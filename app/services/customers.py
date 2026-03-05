from decimal import Decimal
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.models.payment import Payment
from app.models.sale import Sale
from app.schemas.customer import CustomerCreate, CustomerProfileResponse, CustomerResponse, CustomerUpdate
from app.schemas.payment import PaymentRead
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


def get_customer_profile(db: Session, customer_id: UUID) -> CustomerProfileResponse | None:
    customer = get_customer(db, customer_id)
    if not customer:
        return None
    sales = get_customer_sales(db, customer_id)
    balance = calculate_customer_balance(db, customer_id)
    lifetime_value = calculate_customer_lifetime_value(db, customer_id)
    payments = get_customer_payments(db, customer_id)
    return CustomerProfileResponse(
        customer=customer,
        sales=sales,
        balance=balance,
        lifetime_value=lifetime_value,
        payments=payments,
    )


def update_customer(
    db: Session, customer_id: UUID, customer_in: CustomerUpdate
) -> CustomerResponse:
    customer: Customer | None = db.get(Customer, customer_id)
    if customer is None:
        raise ValueError("Customer not found")

    existing = db.scalar(
        select(Customer).where(
            Customer.identifier == customer_in.identifier,
            Customer.id != customer_id,
        )
    )
    if existing:
        raise ValueError("Customer with this identifier already exists")

    customer.display_name = customer_in.display_name
    customer.identifier = customer_in.identifier
    customer.identifier_type = customer_in.identifier_type
    customer.phone = customer_in.phone

    db.commit()
    db.refresh(customer)
    return CustomerResponse.model_validate(customer)


def delete_customer(db: Session, customer_id: UUID) -> None:
    customer: Customer | None = db.get(Customer, customer_id)
    if customer is None:
        raise ValueError("Customer not found")

    db.delete(customer)
    db.commit()


def get_customer_sales(db: Session, customer_id: UUID) -> list[SaleRead]:
    sales = db.scalars(
        select(Sale).where(Sale.customer_id == customer_id).order_by(Sale.created_at)
    ).all()
    return enrich_sales_with_payments(db, sales)


def get_customer_payments(db: Session, customer_id: UUID) -> list[PaymentRead]:
    stmt = (
        select(Payment)
        .join(Sale, Payment.sale_id == Sale.id)
        .where(Sale.customer_id == customer_id)
        .order_by(Payment.payment_date.desc())
    )
    payments = db.scalars(stmt).all()
    return [PaymentRead.model_validate(p) for p in payments]


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

