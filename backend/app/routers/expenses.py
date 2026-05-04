from collections import defaultdict
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc, func, or_
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db


router = APIRouter(prefix="/api/expenses", tags=["expenses"])


def _apply_filters(
    query,
    *,
    q: Optional[str],
    category: Optional[str],
    source: Optional[str],
    start: Optional[datetime],
    end: Optional[datetime],
    min_amount: Optional[float],
    max_amount: Optional[float],
):
    if q:
        like = f"%{q.lower()}%"
        query = query.filter(
            or_(
                func.lower(models.Expense.description).like(like),
                func.lower(models.Expense.merchant).like(like),
                func.lower(models.Expense.notes).like(like),
            )
        )
    if category:
        query = query.filter(models.Expense.category == category)
    if source:
        query = query.filter(models.Expense.source == source)
    if start:
        query = query.filter(models.Expense.occurred_at >= start)
    if end:
        query = query.filter(models.Expense.occurred_at <= end)
    if min_amount is not None:
        query = query.filter(models.Expense.amount >= min_amount)
    if max_amount is not None:
        query = query.filter(models.Expense.amount <= max_amount)
    return query


@router.get("", response_model=schemas.ExpensePage)
def list_expenses(
    db: Session = Depends(get_db),
    q: Optional[str] = None,
    category: Optional[str] = None,
    source: Optional[str] = None,
    start: Optional[datetime] = None,
    end: Optional[datetime] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    cursor: Optional[int] = None,
    limit: int = Query(50, le=200),
):
    base = db.query(models.Expense)
    base = _apply_filters(
        base,
        q=q,
        category=category,
        source=source,
        start=start,
        end=end,
        min_amount=min_amount,
        max_amount=max_amount,
    )
    total = base.with_entities(func.count(models.Expense.id)).scalar() or 0

    query = base.order_by(desc(models.Expense.occurred_at), desc(models.Expense.id))
    if cursor:
        query = query.filter(models.Expense.id < cursor)
    items = query.limit(limit + 1).all()
    next_cursor = items[limit].id if len(items) > limit else None
    items = items[:limit]
    return schemas.ExpensePage(items=items, next_cursor=next_cursor, total=total)


@router.get("/stats", response_model=schemas.StatsOut)
def stats(db: Session = Depends(get_db)):
    rows = db.query(models.Expense).all()
    by_category: dict[str, float] = defaultdict(float)
    by_month: dict[str, float] = defaultdict(float)
    total_spent = 0.0
    total_income = 0.0
    for row in rows:
        if row.amount >= 0:
            total_spent += row.amount
            by_category[row.category or "uncategorized"] += row.amount
            month_key = (row.occurred_at or row.created_at).strftime("%Y-%m")
            by_month[month_key] += row.amount
        else:
            total_income += -row.amount
    return schemas.StatsOut(
        total_spent=round(total_spent, 2),
        total_income=round(total_income, 2),
        balance=round(total_income - total_spent, 2),
        by_category={k: round(v, 2) for k, v in by_category.items()},
        by_month={k: round(v, 2) for k, v in sorted(by_month.items())},
        expense_count=len(rows),
    )


@router.post("", response_model=schemas.ExpenseOut, status_code=201)
def create_expense(payload: schemas.ExpenseCreate, db: Session = Depends(get_db)):
    expense = models.Expense(
        description=payload.description,
        amount=payload.amount,
        currency=payload.currency,
        category=payload.category,
        merchant=payload.merchant,
        occurred_at=payload.occurred_at or datetime.utcnow(),
        source=payload.source,
        notes=payload.notes,
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


@router.get("/{expense_id}", response_model=schemas.ExpenseOut)
def get_expense(expense_id: int, db: Session = Depends(get_db)):
    expense = db.get(models.Expense, expense_id)
    if not expense:
        raise HTTPException(404, "expense not found")
    return expense


@router.patch("/{expense_id}", response_model=schemas.ExpenseOut)
def update_expense(expense_id: int, payload: schemas.ExpenseUpdate, db: Session = Depends(get_db)):
    expense = db.get(models.Expense, expense_id)
    if not expense:
        raise HTTPException(404, "expense not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(expense, field, value)
    db.commit()
    db.refresh(expense)
    return expense


@router.delete("/{expense_id}", status_code=204)
def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    expense = db.get(models.Expense, expense_id)
    if not expense:
        raise HTTPException(404, "expense not found")
    db.delete(expense)
    db.commit()
