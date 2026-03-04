from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import UserRole, require_roles
from app.db.session import get_db
from app.schemas.payment import PaymentCreate, PaymentRead
from app.services.payments import create_payment


router = APIRouter()


@router.post("/", response_model=PaymentRead, status_code=status.HTTP_201_CREATED)
def record_payment(
    payment_in: PaymentCreate,
    db: Session = Depends(get_db),
    _: None = Depends(require_roles(UserRole.ADMIN, UserRole.STAFF)),
) -> PaymentRead:
    try:
        payment = create_payment(db, payment_in)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return payment

