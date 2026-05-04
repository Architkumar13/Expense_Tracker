from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import schemas
from ..database import get_db
from ..services import recurring


router = APIRouter(prefix="/api/subscriptions", tags=["subscriptions"])


@router.get("", response_model=list[schemas.Subscription])
def list_subscriptions(db: Session = Depends(get_db)):
    return recurring.detect_subscriptions(db)
