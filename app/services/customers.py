from decimal import Decimal
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.models.payment import Payment
from app.models.sale import Sale
from app.schemas.customer import CustomerCreate, CustomerResponse
from app.schemas.sale import SaleRead
from app.services.sales import enrich_sales_with_payments


def create_customer(db: Session, customer_in: CustomerCreate) -> CustomerResponse:
    existing = db.scalar(
        select(Customer).where(Customer.identifier == customer_in.identifier)
    )
    if existing:
        raise ValueError("Customer with this identifier already exists")

    customer = Customer(
        display_name=customer_in.display_name,
        identifier=customer_in.identifier,
        identifier_type=customer_in.identifier_type,
        phone=customer_in.phone,
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return CustomerResponse.model_validate(customer)


def list_customers(db: Session) -> list[CustomerResponse]:
    customers = db.scalars(select(Customer).order_by(Customer.created_at.desc())).all()
    return [CustomerResponse.model_validate(c) for c in customers]


def get_customer(db: Session, customer_id: UUID) -> CustomerResponse | None:
    customer = db.get(Customer, customer_id)
    if not customer:
        return None
    return CustomerResponse.model_validate(customer)


def get_customer_sales(db: Session, customer_id: UUID) -> list[SaleRead]:
    sales = db.scalars(
        select(Sale).where(Sale.customer_id == customer_id).order_by(Sale.created_at)
    ).all()
    return enrich_sales_with_payments(db, sales)


def calculate_customer_balance(db: Session, customer_id: UUID) -> Decimal:
    sales_total_stmt = select(
        func.coalesce(func.sum(Sale.total_amount), 0)
    ).where(Sale.customer_id == customer_id)
    total_sales = Decimal(db.execute(sales_total_stmt).scalar_one())

    payments_total_stmt = (
        select(func.coalesce(func.sum(Payment.amount), 0))
        .join(Sale, Payment.sale_id == Sale.id)
        .where(Sale.customer_id == customer_id)
    )
    total_payments = Decimal(db.execute(payments_total_stmt).scalar_one())
    return total_sales - total_payments


def calculate_customer_lifetime_value(db: Session, customer_id: UUID) -> Decimal:
    stmt = select(func.coalesce(func.sum(Sale.total_amount), 0)).where(
        Sale.customer_id == customer_id
    )
    return Decimal(db.execute(stmt).scalar_one())

