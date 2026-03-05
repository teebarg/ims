from decimal import Decimal
from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.bale import Bale
from app.models.category import Category
from app.models.customer import Customer
from app.models.inventory import InventoryStock
from app.models.payment import Payment
from app.models.sale import Sale
from app.schemas.sale import SaleCreate, SaleRead


def _compute_payment_totals(db: Session, sale_ids: list[int]) -> dict[int, Decimal]:
    if not sale_ids:
        return {}
    stmt = (
        select(Payment.sale_id, func.coalesce(func.sum(Payment.amount), 0))
        .where(Payment.sale_id.in_(sale_ids))
        .group_by(Payment.sale_id)
    )
    rows = db.execute(stmt).all()
    return {sale_id: Decimal(total) for sale_id, total in rows}


def create_sale(db: Session, sale_in: SaleCreate) -> SaleRead:
    bale = db.get(Bale, sale_in.bale_id)
    if bale is None:
        raise ValueError("Bale not found")

    customer = db.get(Customer, sale_in.customer_id)
    if customer is None:
        raise ValueError("Customer not found")

    category = db.get(Category, sale_in.category_id)
    if category is None:
        raise ValueError("Category not found")

    total_amount = Decimal(sale_in.unit_price) * Decimal(sale_in.total_quantity)

    sale = Sale(
        bale_id=sale_in.bale_id,
        customer_id=sale_in.customer_id,
        category_id=sale_in.category_id,
        total_quantity=sale_in.total_quantity,
        total_amount=total_amount,
        channel=sale_in.channel,
        staff_id=sale_in.user_id or "",
        sale_date=sale_in.sale_date or date.today(),
    )
    db.add(sale)
    db.flush()

    stock = InventoryStock(
        bale_id=sale.bale_id,
        sale_id=sale.id,
        category_id=sale.category_id,
        quantity_change=-sale.total_quantity,
        reason="sale_out",
    )
    db.add(stock)
    db.commit()
    db.refresh(sale)

    total_paid = Decimal(0)
    balance = total_amount - total_paid

    return SaleRead(
        id=sale.id,
        bale_id=sale.bale_id,
        customer_id=sale.customer_id,
        category_id=sale.category_id,
        total_quantity=sale.total_quantity,
        unit_price=sale_in.unit_price,
        channel=sale.channel,
        user_id=sale.staff_id,
        sale_date=sale.sale_date,
        created_at=sale.created_at,
        total_amount=total_amount,
        total_paid=total_paid,
        balance=balance,
    )


def enrich_sales_with_payments(db: Session, sales: list[Sale]) -> list[SaleRead]:
    sale_ids = [s.id for s in sales]
    payments_by_sale = _compute_payment_totals(db, sale_ids)

    result: list[SaleRead] = []
    for sale in sales:
        total_amount = sale.total_amount
        total_paid = payments_by_sale.get(sale.id, Decimal(0))
        balance = total_amount - total_paid
        result.append(
            SaleRead(
                id=sale.id,
                bale_id=sale.bale_id,
                customer_id=sale.customer_id,
                category_id=sale.category_id,
                total_quantity=sale.total_quantity,
                unit_price=total_amount / Decimal(sale.total_quantity)
                if sale.total_quantity
                else Decimal(0),
                channel=sale.channel,
                user_id=sale.staff_id,
                sale_date=sale.sale_date,
                created_at=sale.created_at,
                total_amount=total_amount,
                total_paid=total_paid,
                balance=balance,
            )
        )
    return result

