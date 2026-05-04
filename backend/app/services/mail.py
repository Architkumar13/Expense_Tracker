"""Mail and message ingestion.

Two backends are supported:
1) MCP servers (e.g. Gmail MCP, WhatsApp/iMessage MCP) — referenced by URL via
   the MCP_MAIL_URL / MCP_MESSAGES_URL env vars. The FastAPI process forwards
   tool calls through `httpx` to a running MCP HTTP bridge.
2) Direct IMAP — used when MCP is not configured but IMAP credentials are.
3) Demo mode — synthesizes a small set of realistic transactional messages so
   the UI is fully usable without secrets.
"""
from __future__ import annotations

import email
import imaplib
import re
from datetime import datetime, timedelta
from email.header import decode_header
from email.utils import parsedate_to_datetime
from typing import Optional

import httpx

from ..config import get_settings
from ..schemas import MailMessage


AMOUNT_RE = re.compile(r"(?:USD|EUR|GBP|INR|\$|€|£|₹)\s?([0-9]+(?:[,.][0-9]{2})?)", re.I)
MERCHANT_HINTS = re.compile(r"(?:at|from|on)\s+([A-Z][A-Za-z0-9 &'\.\-]{2,40})")


def _detect_amount(text: str) -> Optional[float]:
    m = AMOUNT_RE.search(text or "")
    if not m:
        return None
    raw = m.group(1).replace(",", ".")
    try:
        return float(raw)
    except ValueError:
        return None


def _detect_merchant(text: str) -> Optional[str]:
    m = MERCHANT_HINTS.search(text or "")
    return m.group(1).strip() if m else None


def _decode(value) -> str:
    if value is None:
        return ""
    parts = decode_header(value)
    out = []
    for chunk, enc in parts:
        if isinstance(chunk, bytes):
            try:
                out.append(chunk.decode(enc or "utf-8", errors="ignore"))
            except LookupError:
                out.append(chunk.decode("utf-8", errors="ignore"))
        else:
            out.append(chunk)
    return "".join(out)


def fetch_via_mcp(url: str, kind: str, limit: int) -> list[MailMessage]:
    """Call an MCP HTTP bridge.

    Expected response: {"items": [{"id","subject","sender","received_at","snippet"}, ...]}
    The bridge maps the standard MCP tool (e.g. `gmail.search`) to JSON.
    """
    try:
        with httpx.Client(timeout=15.0) as client:
            resp = client.post(
                url.rstrip("/") + "/list",
                json={"kind": kind, "limit": limit, "query": "transactional OR receipt OR purchase"},
            )
            resp.raise_for_status()
            payload = resp.json()
    except Exception:
        return []

    items: list[MailMessage] = []
    for raw in payload.get("items", [])[:limit]:
        snippet = raw.get("snippet", "")
        items.append(
            MailMessage(
                id=str(raw.get("id", "")),
                subject=raw.get("subject", ""),
                sender=raw.get("sender", ""),
                received_at=raw.get("received_at"),
                snippet=snippet,
                detected_amount=_detect_amount(snippet + " " + raw.get("subject", "")),
                detected_merchant=_detect_merchant(snippet + " " + raw.get("subject", "")),
            )
        )
    return items


def fetch_via_imap(limit: int = 25) -> list[MailMessage]:
    settings = get_settings()
    if not (settings.imap_host and settings.imap_user and settings.imap_password):
        return []
    out: list[MailMessage] = []
    try:
        with imaplib.IMAP4_SSL(settings.imap_host, settings.imap_port) as mbox:
            mbox.login(settings.imap_user, settings.imap_password)
            mbox.select("INBOX", readonly=True)
            since = (datetime.utcnow() - timedelta(days=30)).strftime("%d-%b-%Y")
            typ, data = mbox.search(None, f'(SINCE {since} OR SUBJECT "receipt" OR SUBJECT "payment")')
            if typ != "OK":
                return []
            ids = data[0].split()[-limit:]
            for raw_id in reversed(ids):
                typ, msg_data = mbox.fetch(raw_id, "(RFC822)")
                if typ != "OK" or not msg_data or not msg_data[0]:
                    continue
                msg = email.message_from_bytes(msg_data[0][1])
                subject = _decode(msg.get("Subject"))
                sender = _decode(msg.get("From"))
                received_at = None
                if msg.get("Date"):
                    try:
                        received_at = parsedate_to_datetime(msg["Date"])
                    except (TypeError, ValueError):
                        received_at = None
                snippet = ""
                if msg.is_multipart():
                    for part in msg.walk():
                        if part.get_content_type() == "text/plain":
                            payload = part.get_payload(decode=True) or b""
                            snippet = payload.decode(errors="ignore")[:800]
                            break
                else:
                    payload = msg.get_payload(decode=True) or b""
                    snippet = payload.decode(errors="ignore")[:800]
                blob = subject + " " + snippet
                out.append(
                    MailMessage(
                        id=raw_id.decode(),
                        subject=subject,
                        sender=sender,
                        received_at=received_at,
                        snippet=snippet[:300],
                        detected_amount=_detect_amount(blob),
                        detected_merchant=_detect_merchant(blob),
                    )
                )
    except Exception:
        return out
    return out


def demo_messages(kind: str) -> list[MailMessage]:
    now = datetime.utcnow()
    if kind == "messages":
        seed = [
            ("SMS-1", "Bank Alert", "+1-AUTH",
             "Your card ending 4421 was charged $42.18 at WHOLE FOODS on May 02."),
            ("SMS-2", "UPI Notice", "PAYTM",
             "Sent ₹780.00 to METRO TRANSIT on 04 May. Ref 8821."),
            ("SMS-3", "Subscription", "Apple",
             "Your subscription to iCloud+ 200GB renewed for $2.99."),
        ]
    else:
        seed = [
            ("MAIL-1", "Receipt from Uber", "receipts@uber.com",
             "Trip on May 1 — Total $18.40 charged to Visa ••4421."),
            ("MAIL-2", "Your Amazon.com order", "auto-confirm@amazon.com",
             "Order Total: $63.27 from Amazon. Shipping to home address."),
            ("MAIL-3", "Netflix invoice", "info@netflix.com",
             "We charged $15.49 to your card on May 03 at Netflix."),
        ]
    out = []
    for idx, (mid, subject, sender, snippet) in enumerate(seed):
        blob = subject + " " + snippet
        out.append(
            MailMessage(
                id=mid,
                subject=subject,
                sender=sender,
                received_at=now - timedelta(hours=idx * 7),
                snippet=snippet,
                detected_amount=_detect_amount(blob),
                detected_merchant=_detect_merchant(blob),
            )
        )
    return out


def fetch_mail(limit: int = 25) -> list[MailMessage]:
    settings = get_settings()
    if settings.mcp_mail_url:
        items = fetch_via_mcp(settings.mcp_mail_url, kind="mail", limit=limit)
        if items:
            return items
    items = fetch_via_imap(limit=limit)
    if items:
        return items
    return demo_messages("mail")


def fetch_messages(limit: int = 25) -> list[MailMessage]:
    settings = get_settings()
    if settings.mcp_messages_url:
        items = fetch_via_mcp(settings.mcp_messages_url, kind="messages", limit=limit)
        if items:
            return items
    return demo_messages("messages")
