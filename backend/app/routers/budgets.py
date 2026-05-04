from collections import defaultdict
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db


router = APIRouter(prefix="/api/budgets", tags=["budgets"])


def _month_bounds(now: datetime | None = None) -> tuple[datetime, datetime]:
    now = now or datetime.utcnow()
    start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    if start.month == 12:
        end = start.replace(year=start.year + 1, month=1)
    else:
        end = start.replace(month=start.month + 1)
    return start, end


@router.get("", response_model=list[schemas.BudgetOut])
def list_budgets(db: Session = Depends(get_db)):
    return db.query(models.Budget).order_by(models.Budget.category.asc()).all()


@router.post("", response_model=schemas.BudgetOut, status_code=201)
def upsert_budget(payload: schemas.BudgetIn, db: Session = Depends(get_db)):
    existing = db.query(models.Budget).filter(models.Budget.category == payload.category).first()
    if existing:
        existing.monthly_limit = payload.monthly_limit
        existing.currency = payload.currency
        db.commit()
        db.refresh(existing)
        return existing
    budget = models.Budget(
        category=payload.category,
        monthly_limit=payload.monthly_limit,
        currency=payload.currency,
    )
    db.add(budget)
    db.commit()
    db.refresh(budget)
    return budget


@router.patch("/{budget_id}", response_model=schemas.BudgetOut)
def update_budget(budget_id: int, payload: schemas.BudgetUpdate, db: Session = Depends(get_db)):
    budget = db.get(models.Budget, budget_id)
    if not budget:
        raise HTTPException(404, "budget not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(budget, field, value)
    db.commit()
    db.refresh(budget)
    return budget


@router.delete("/{budget_id}", status_code=204)
def delete_budget(budget_id: int, db: Session = Depends(get_db)):
    budget = db.get(models.Budget, budget_id)
    if not budget:
        raise HTTPException(404, "budget not found")
    db.delete(budget)
    db.commit()


@router.get("/progress", response_model=list[schemas.BudgetProgress])
def progress(db: Session = Depends(get_db)):
    start, end = _month_bounds()
    spent_by_category: dict[str, float] = defaultdict(float)
    rows = (
        db.query(models.Expense)
        .filter(models.Expense.occurred_at >= start, models.Expense.occurred_at < end)
        .all()
    )
    for row in rows:
        if row.amount > 0:
            spent_by_category[row.category or "uncategorized"] += row.amount

    out: list[schemas.BudgetProgress] = []
    for budget in db.query(models.Budget).all():
        spent = round(spent_by_category.get(budget.category, 0.0), 2)
        remaining = round(budget.monthly_limit - spent, 2)
        percent = round((spent / budget.monthly_limit * 100.0) if budget.monthly_limit else 0.0, 2)
        out.append(
            schemas.BudgetProgress(
                category=budget.category,
                monthly_limit=budget.monthly_limit,
                spent=spent,
                remaining=remaining,
                percent=percent,
                currency=budget.currency,
                over_budget=spent > budget.monthly_limit,
            )
        )
    out.sort(key=lambda p: p.percent, reverse=True)
    return out
