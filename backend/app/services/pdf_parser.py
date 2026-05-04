"""Receipt PDF parsing.

Extracts raw text via pdfplumber and applies regex heuristics to identify
the merchant, total amount, currency and date. The output is intentionally
conservative: when the AI service has an API key, the router will refine
the result by passing the raw text through Claude.
"""
from __future__ import annotations

import re
from datetime import datetime
from pathlib import Path
from typing import Optional

import pdfplumber

from ..schemas import ParsedReceipt


CURRENCY_SYMBOLS = {"$": "USD", "€": "EUR", "£": "GBP", "₹": "INR", "¥": "JPY"}

TOTAL_PATTERNS = [
    re.compile(r"(?:grand\s*total|total\s*amount|amount\s*due|balance\s*due|total)\D{0,8}([\$€£₹¥]?\s?\d{1,3}(?:[,\d]{0,9})?(?:\.\d{2})?)", re.I),
    re.compile(r"\b(?:total)\b[^\n]{0,20}?([\$€£₹¥]?\s?\d+(?:\.\d{2}))", re.I),
]

DATE_PATTERNS = [
    re.compile(r"\b(\d{4}-\d{2}-\d{2})\b"),
    re.compile(r"\b(\d{1,2}/\d{1,2}/\d{2,4})\b"),
    re.compile(r"\b(\d{1,2}-\d{1,2}-\d{2,4})\b"),
    re.compile(r"\b(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})\b", re.I),
]


def _coerce_amount(raw: str) -> float:
    cleaned = re.sub(r"[^\d.,]", "", raw)
    if not cleaned:
        return 0.0
    if cleaned.count(",") and not cleaned.count("."):
        cleaned = cleaned.replace(",", ".")
    else:
        cleaned = cleaned.replace(",", "")
    try:
        return float(cleaned)
    except ValueError:
        return 0.0


def _detect_currency(text: str) -> str:
    for sym, code in CURRENCY_SYMBOLS.items():
        if sym in text:
            return code
    match = re.search(r"\b(USD|EUR|GBP|INR|JPY|CAD|AUD)\b", text)
    return match.group(1) if match else "USD"


def _parse_date(text: str) -> Optional[datetime]:
    for pattern in DATE_PATTERNS:
        m = pattern.search(text)
        if not m:
            continue
        token = m.group(1)
        for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%d/%m/%Y", "%m/%d/%y", "%d-%m-%Y", "%d %b %Y", "%d %B %Y"):
            try:
                return datetime.strptime(token, fmt)
            except ValueError:
                continue
    return None


def _guess_merchant(text: str) -> str:
    for line in text.splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        if any(c.isdigit() for c in stripped):
            continue
        if len(stripped) < 3 or len(stripped) > 60:
            continue
        return stripped.title()
    return ""


def extract_text(path: Path) -> str:
    out: list[str] = []
    with pdfplumber.open(str(path)) as pdf:
        for page in pdf.pages:
            txt = page.extract_text() or ""
            out.append(txt)
    return "\n".join(out)


def parse_receipt_text(text: str) -> ParsedReceipt:
    if not text.strip():
        return ParsedReceipt()

    total = 0.0
    for pattern in TOTAL_PATTERNS:
        m = pattern.search(text)
        if m:
            total = _coerce_amount(m.group(1))
            if total:
                break

    return ParsedReceipt(
        merchant=_guess_merchant(text),
        total=total,
        currency=_detect_currency(text),
        occurred_at=_parse_date(text),
        category="uncategorized",
        confidence=0.65 if total else 0.2,
    )


def parse_pdf(path: Path) -> tuple[str, ParsedReceipt]:
    text = extract_text(path)
    return text, parse_receipt_text(text)
