from collections import defaultdict
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..services import ai, stocks


router = APIRouter(prefix="/api/advisor", tags=["advisor"])


def _build_summary(db: Session) -> dict:
    rows = db.query(models.Expense).all()
    by_category: dict[str, float] = defaultdict(float)
    total_spent = 0.0
    for row in rows:
        if row.amount >= 0:
            total_spent += row.amount
            by_category[row.category or "uncategorized"] += row.amount
    return {
        "total_spent": round(total_spent, 2),
        "by_category": {k: round(v, 2) for k, v in by_category.items()},
        "expense_count": len(rows),
    }


@router.post("/chat", response_model=schemas.AdvisorResponse)
def chat(payload: schemas.AdvisorRequest, db: Session = Depends(get_db)):
    summary = _build_summary(db) if payload.use_portfolio_context else {}

    symbols: list[str] = []
    for token in payload.message.replace(",", " ").split():
        bare = token.strip("().,?!:$")
        if bare.isupper() and 1 <= len(bare) <= 6 and bare.isalpha():
            symbols.append(bare)
    quotes = [q.model_dump() for q in stocks.fetch_quotes(symbols)] if symbols else []

    history_rows = (
        db.query(models.AdvisorChat)
        .order_by(models.AdvisorChat.created_at.asc())
        .limit(20)
        .all()
    )
    history = [{"role": r.role, "content": r.content} for r in history_rows]

    db.add(models.AdvisorChat(role="user", content=payload.message))
    db.commit()

    reply = ai.advise(payload.message, summary, quotes=quotes, history=history)

    db.add(models.AdvisorChat(role="assistant", content=reply))
    db.commit()

    return schemas.AdvisorResponse(
        reply=reply,
        citations=[f"{q['symbol']}: ${q.get('price', 0):.2f}" for q in quotes if not q.get("error")],
    )


@router.get("/history", response_model=list[schemas.ChatTurn])
def history(db: Session = Depends(get_db), limit: int = Query(50, le=200)):
    return (
        db.query(models.AdvisorChat)
        .order_by(models.AdvisorChat.created_at.asc())
        .limit(limit)
        .all()
    )


@router.delete("/history", status_code=204)
def clear_history(db: Session = Depends(get_db)):
    db.query(models.AdvisorChat).delete()
    db.commit()


@router.get("/quote", response_model=schemas.StockQuote)
def quote(symbol: str):
    return stocks.fetch_quote(symbol)


@router.get("/quotes", response_model=list[schemas.StockQuote])
def quotes(symbols: str = Query(..., description="comma separated symbols")):
    raw = [s.strip() for s in symbols.split(",") if s.strip()]
    return stocks.fetch_quotes(raw)
