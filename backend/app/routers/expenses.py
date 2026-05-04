from collections import defaultdict
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db


router = APIRouter(prefix="/api/expenses", tags=["expenses"])


@router.get("", response_model=list[schemas.ExpenseOut])
def list_expenses(
    db: Session = Depends(get_db),
    category: Optional[str] = None,
    source: Optional[str] = None,
    limit: int = Query(200, le=1000),
):
    query = db.query(models.Expense)
    if category:
        query = query.filter(models.Expense.category == category)
    if source:
        query = query.filter(models.Expense.source == source)
    return query.order_by(desc(models.Expense.occurred_at)).limit(limit).all()


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
