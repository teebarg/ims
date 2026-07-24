from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.payment import Payment
from app.models.sale import Sale
from app.schemas.payment import PaymentCreate, PaymentRead


def _get_sale_totals(db: Session, sale_id: int) -> tuple[Decimal, Decimal]:
    sale = db.get(Sale, sale_id)
    if sale is None:
        raise ValueError("Sale not found")

    total_amount = sale.total_amount

    stmt = select(func.coalesce(func.sum(Payment.amount), 0)).where(
        Payment.sale_id == sale_id
    )
    total_paid = Decimal(db.execute(stmt).scalar_one())
    return total_amount, total_paid


def create_payment(db: Session, payment_in: PaymentCreate) -> PaymentRead:
    total_amount, total_paid = _get_sale_totals(db, payment_in.sale_id)
    remaining = total_amount - total_paid

    if Decimal(payment_in.amount) > remaining:
        raise ValueError("Payment exceeds remaining balance")

    payment = Payment(
        sale_id=payment_in.sale_id,
        amount=Decimal(payment_in.amount),
        method=payment_in.method,
        reference=payment_in.reference,
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return PaymentRead.model_validate(payment)

