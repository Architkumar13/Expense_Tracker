import json
import uuid
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from .. import models, schemas
from ..config import UPLOAD_DIR
from ..database import get_db
from ..services import ai, pdf_parser


router = APIRouter(prefix="/api/receipts", tags=["receipts"])


@router.post("/upload", response_model=schemas.ExpenseOut, status_code=201)
async def upload_receipt(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "only PDF receipts are accepted")

    safe_name = f"{uuid.uuid4().hex}_{Path(file.filename).name}"
    target = UPLOAD_DIR / safe_name
    contents = await file.read()
    target.write_bytes(contents)

    try:
        raw_text, parsed = pdf_parser.parse_pdf(target)
    except Exception as exc:
        raise HTTPException(400, f"could not parse PDF: {exc}")

    parsed = ai.refine_receipt(raw_text, parsed)

    receipt = models.Receipt(
        filename=file.filename,
        stored_path=str(target),
        raw_text=raw_text[:50000],
        parsed_json=parsed.model_dump_json(),
    )
    db.add(receipt)
    db.flush()

    expense = models.Expense(
        description=f"Receipt: {parsed.merchant or file.filename}",
        amount=parsed.total or 0.0,
        currency=parsed.currency or "USD",
        category=parsed.category or "uncategorized",
        merchant=parsed.merchant or "",
        occurred_at=parsed.occurred_at or datetime.utcnow(),
        source="receipt",
        notes=json.dumps({"confidence": parsed.confidence, "line_items": parsed.line_items}),
        receipt_id=receipt.id,
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


@router.get("", response_model=list[schemas.ReceiptOut])
def list_receipts(db: Session = Depends(get_db)):
    return db.query(models.Receipt).order_by(models.Receipt.uploaded_at.desc()).all()
