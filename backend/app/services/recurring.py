"""Detect recurring/subscription-like charges from expense history.

Heuristic: cluster expenses by normalized merchant + amount bucket (rounded to
nearest dollar within ±5%). A cluster qualifies as a subscription when there
are at least 3 charges, the median interval between charges falls within
[20, 95] days (weekly through quarterly), and the spread of intervals is
modest (stddev < 12 days).
"""
from __future__ import annotations

import re
import statistics
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Iterable

from sqlalchemy.orm import Session

from .. import models
from ..schemas import Subscription


def _normalize_merchant(value: str) -> str:
    if not value:
        return ""
    cleaned = re.sub(r"\s+", " ", value.strip().lower())
    cleaned = re.sub(r"[^a-z0-9 &]", "", cleaned)
    return cleaned[:48]


def _bucket_amount(amount: float) -> float:
    return round(amount, 0)


def _intervals(dates: list[datetime]) -> list[float]:
    sorted_dates = sorted(d for d in dates if d)
    return [(b - a).total_seconds() / 86400.0 for a, b in zip(sorted_dates, sorted_dates[1:])]


def detect_subscriptions(db: Session, *, lookback_days: int = 365) -> list[Subscription]:
    cutoff = datetime.utcnow() - timedelta(days=lookback_days)
    rows: Iterable[models.Expense] = (
        db.query(models.Expense)
        .filter(models.Expense.amount > 0)
        .filter(models.Expense.occurred_at >= cutoff)
        .all()
    )

    clusters: dict[tuple[str, float], list[models.Expense]] = defaultdict(list)
    for row in rows:
        key = (_normalize_merchant(row.merchant or row.description), _bucket_amount(row.amount))
        if not key[0]:
            continue
        clusters[key].append(row)

    out: list[Subscription] = []
    for (merchant, amount), items in clusters.items():
        if len(items) < 3:
            continue
        intervals = _intervals([i.occurred_at for i in items])
        if not intervals:
            continue
        median = statistics.median(intervals)
        if not (20 <= median <= 95):
            continue
        if len(intervals) >= 2 and statistics.pstdev(intervals) > 12:
            continue
        last = max(items, key=lambda r: r.occurred_at or datetime.min)
        next_expected = (last.occurred_at or datetime.utcnow()) + timedelta(days=median)
        category = last.category or "subscription"
        out.append(
            Subscription(
                merchant=merchant.title(),
                amount=round(float(items[0].amount), 2),
                currency=last.currency or "USD",
                cadence_days=int(round(median)),
                last_seen=last.occurred_at or datetime.utcnow(),
                next_expected=next_expected,
                count=len(items),
                category=category,
            )
        )
    out.sort(key=lambda s: (s.next_expected or datetime.max))
    return out
