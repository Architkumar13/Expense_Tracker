"""Claude-powered AI helpers for receipt refinement and financial advice.

Falls back to deterministic stubs when no ANTHROPIC_API_KEY is configured so
the app remains usable without credentials.
"""
from __future__ import annotations

import json
from typing import Iterable, Optional

from ..config import get_settings
from ..schemas import ParsedReceipt

try:
    from anthropic import Anthropic
except ImportError:  # pragma: no cover
    Anthropic = None  # type: ignore


SYSTEM_ADVISOR = (
    "You are a calm, evidence-based personal finance advisor inside an expense "
    "tracker app. You help users budget, understand their spending, and answer "
    "questions about stocks and mutual funds at a high level. You are NOT a "
    "licensed advisor and should remind the user that suggestions are educational. "
    "Use the user's spending summary and any quote data provided in the context. "
    "Be concise (under 200 words) and end with a short bulleted action list."
)

SYSTEM_RECEIPT = (
    "You are a receipt-parsing assistant. Given the raw text extracted from a "
    "receipt PDF, return STRICT JSON with keys: merchant (string), total (number), "
    "currency (ISO code), occurred_at (ISO 8601 string or null), category (one of: "
    "groceries, dining, travel, transport, utilities, shopping, healthcare, "
    "entertainment, subscription, fees, other), line_items (array of {name, amount}), "
    "confidence (0-1). Output JSON only, no prose."
)


def _client() -> Optional["Anthropic"]:
    settings = get_settings()
    if not settings.anthropic_api_key or Anthropic is None:
        return None
    return Anthropic(api_key=settings.anthropic_api_key)


def refine_receipt(raw_text: str, fallback: ParsedReceipt) -> ParsedReceipt:
    client = _client()
    if not client or not raw_text.strip():
        return fallback

    settings = get_settings()
    try:
        msg = client.messages.create(
            model=settings.anthropic_model,
            max_tokens=800,
            system=SYSTEM_RECEIPT,
            messages=[{"role": "user", "content": raw_text[:8000]}],
        )
        text = "".join(block.text for block in msg.content if getattr(block, "type", "") == "text")
        data = json.loads(text)
        return ParsedReceipt(**{**fallback.model_dump(), **data})
    except Exception:
        return fallback


def advise(
    user_message: str,
    spending_summary: dict,
    quotes: Iterable[dict] | None = None,
    history: Iterable[dict] | None = None,
) -> str:
    client = _client()
    quotes = list(quotes or [])
    history = list(history or [])

    if not client:
        return _offline_advice(user_message, spending_summary, quotes)

    settings = get_settings()
    context = {
        "spending_summary": spending_summary,
        "live_quotes": quotes,
    }
    messages = list(history) + [
        {
            "role": "user",
            "content": (
                f"Context (JSON): {json.dumps(context, default=str)}\n\n"
                f"User question: {user_message}"
            ),
        }
    ]
    try:
        msg = client.messages.create(
            model=settings.anthropic_model,
            max_tokens=600,
            system=SYSTEM_ADVISOR,
            messages=messages,
        )
        return "".join(b.text for b in msg.content if getattr(b, "type", "") == "text").strip()
    except Exception as exc:  # pragma: no cover
        return f"(advisor offline: {exc})\n\n" + _offline_advice(user_message, spending_summary, quotes)


def _offline_advice(message: str, summary: dict, quotes: list[dict]) -> str:
    total = summary.get("total_spent", 0.0)
    top = sorted(summary.get("by_category", {}).items(), key=lambda kv: kv[1], reverse=True)[:3]
    top_str = ", ".join(f"{k} ${v:.0f}" for k, v in top) or "no data yet"
    quote_str = ""
    if quotes:
        quote_str = "\nLive quotes: " + ", ".join(
            f"{q['symbol']} ${q.get('price', 0):.2f} ({q.get('change_pct', 0):+.2f}%)" for q in quotes
        )
    return (
        "(Running in offline mode — set ANTHROPIC_API_KEY for tailored advice.)\n\n"
        f"You spent ${total:.2f} so far. Top categories: {top_str}.{quote_str}\n\n"
        "Suggestions:\n"
        "- Cap your top discretionary category at 80% of last month's spend.\n"
        "- Build a 3–6 month emergency fund in a high-yield savings account before adding new positions.\n"
        "- For long-term goals, low-cost broad-market index funds remain a sensible default.\n"
        "- This is educational, not licensed advice."
    )
