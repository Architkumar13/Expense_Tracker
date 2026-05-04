from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..services import mail as mail_service


router = APIRouter(prefix="/api", tags=["mail"])


@router.get("/mail", response_model=list[schemas.MailMessage])
def list_mail(limit: int = Query(25, le=100)):
    return mail_service.fetch_mail(limit=limit)


@router.get("/messages", response_model=list[schemas.MailMessage])
def list_messages(limit: int = Query(25, le=100)):
    return mail_service.fetch_messages(limit=limit)


def _ingest(items: list[schemas.MailMessage], source: str, db: Session) -> schemas.IngestResult:
    created: list[models.Expense] = []
    for item in items:
        if not item.detected_amount:
            continue
        exists = (
            db.query(models.Expense)
            .filter(models.Expense.source == source, models.Expense.notes.like(f"%{item.id}%"))
            .first()
        )
        if exists:
            continue
        expense = models.Expense(
            description=item.subject or item.snippet[:80],
            amount=float(item.detected_amount),
            currency="USD",
            category="uncategorized",
            merchant=item.detected_merchant or item.sender,
            occurred_at=item.received_at or datetime.utcnow(),
            source=source,
            notes=f"id={item.id}; from={item.sender}",
        )
        db.add(expense)
        created.append(expense)
    db.commit()
    for expense in created:
        db.refresh(expense)
    return schemas.IngestResult(
        scanned=len(items),
        created_expenses=len(created),
        items=[schemas.ExpenseOut.model_validate(e) for e in created],
        notes="ingested via " + source,
    )


@router.post("/mail/ingest", response_model=schemas.IngestResult)
def ingest_mail(limit: int = Query(25, le=100), db: Session = Depends(get_db)):
    return _ingest(mail_service.fetch_mail(limit=limit), source="mail", db=db)


@router.post("/messages/ingest", response_model=schemas.IngestResult)
def ingest_messages(limit: int = Query(25, le=100), db: Session = Depends(get_db)):
    return _ingest(mail_service.fetch_messages(limit=limit), source="message", db=db)
