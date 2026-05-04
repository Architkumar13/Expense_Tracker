"""Quote lookups for stocks and mutual funds via yfinance."""
from __future__ import annotations

from typing import Iterable

from ..schemas import StockQuote

try:
    import yfinance as yf
except ImportError:  # pragma: no cover
    yf = None  # type: ignore


def fetch_quote(symbol: str) -> StockQuote:
    symbol = symbol.strip().upper()
    if not symbol:
        return StockQuote(symbol="", error="empty symbol")
    if yf is None:
        return StockQuote(symbol=symbol, error="yfinance not installed")
    try:
        ticker = yf.Ticker(symbol)
        fast = getattr(ticker, "fast_info", {}) or {}
        price = float(fast.get("last_price") or fast.get("lastPrice") or 0.0)
        prev = float(fast.get("previous_close") or fast.get("previousClose") or 0.0)
        change_pct = ((price - prev) / prev * 100.0) if prev else 0.0
        name = ""
        try:
            info = ticker.get_info()
            name = info.get("shortName") or info.get("longName") or ""
        except Exception:
            pass
        return StockQuote(
            symbol=symbol,
            name=name,
            price=price,
            change_pct=change_pct,
            currency=str(fast.get("currency") or "USD"),
        )
    except Exception as exc:
        return StockQuote(symbol=symbol, error=str(exc))


def fetch_quotes(symbols: Iterable[str]) -> list[StockQuote]:
    return [fetch_quote(s) for s in symbols if s.strip()]
