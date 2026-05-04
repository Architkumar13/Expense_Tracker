import csv
import io
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy import desc
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from .expenses import _apply_filters


router = APIRouter(prefix="/api/expenses", tags=["expenses"])


@router.get("/export.csv")
def export_csv(
    db: Session = Depends(get_db),
    q: Optional[str] = None,
    category: Optional[str] = None,
    source: Optional[str] = None,
    start: Optional[datetime] = None,
    end: Optional[datetime] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
):
    query = _apply_filters(
        db.query(models.Expense),
        q=q,
        category=category,
        source=source,
        start=start,
        end=end,
        min_amount=min_amount,
        max_amount=max_amount,
    ).order_by(desc(models.Expense.occurred_at))

    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["id", "occurred_at", "description", "merchant", "category", "source", "amount", "currency", "notes"])
    for row in query.all():
        writer.writerow([
            row.id,
            (row.occurred_at or row.created_at).isoformat(),
            row.description,
            row.merchant,
            row.category,
            row.source,
            f"{row.amount:.2f}",
            row.currency,
            (row.notes or "").replace("\n", " ")[:300],
        ])
    buf.seek(0)
    filename = f"expenses-{datetime.utcnow().strftime('%Y%m%d-%H%M')}.csv"
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
