from collections import defaultdict
from decimal import Decimal
from datetime import date, datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.category import Category
from app.models.customer import Customer
from app.models.inventory import InventoryStock
from app.models.payment import Payment
from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.schemas.sale import SaleCreate, SaleDeliveryUpdate, SaleItemRead, SaleRead


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


def _load_items_for_sales(db: Session, sale_ids: list[int]) -> dict[int, list[SaleItem]]:
    if not sale_ids:
        return {}
    stmt = select(SaleItem).where(SaleItem.sale_id.in_(sale_ids))
    items = db.scalars(stmt).all()
    by_sale: dict[int, list[SaleItem]] = defaultdict(list)
    for item in items:
        by_sale[item.sale_id].append(item)
    return by_sale


def create_sale(db: Session, sale_in: SaleCreate) -> SaleRead:
    if not sale_in.items:
        raise ValueError("Sale must contain at least one item")

    customer = db.get(Customer, sale_in.customer_id)
    if customer is None:
        raise ValueError("Customer not found")

    category_ids = {item.category_id for item in sale_in.items}
    existing_category_ids = set(
        db.scalars(
            select(Category.id).where(Category.id.in_(category_ids))
        ).all()
    )
    missing = category_ids - existing_category_ids
    if missing:
        raise ValueError(f"Unknown category IDs: {sorted(missing)}")

    total_amount = sum(Decimal(item.amount) for item in sale_in.items)

    created_items: list[SaleItem] = []
    try:
        next_id = (db.scalars(select(func.max(Sale.id))).first() or 0) + 1
        reference: str = f"SL-{next_id:03d}"
        sale = Sale(
            customer_id=sale_in.customer_id,
            reference=reference,
            total_amount=total_amount,
            channel=sale_in.channel,
            staff_id=sale_in.user_id or "",
            sale_date=sale_in.sale_date or date.today(),
        )
        db.add(sale)
        db.flush()

        for item_in in sale_in.items:
            item = SaleItem(
                sale_id=sale.id,
                category_id=item_in.category_id,
                quantity=item_in.quantity,
                amount=Decimal(item_in.amount),
            )
            db.add(item)
            created_items.append(item)

            stock = InventoryStock(
                sale_id=sale.id,
                category_id=item_in.category_id,
                quantity_change=-item_in.quantity,
                reason="SALE",
            )
            db.add(stock)

        db.commit()
        db.refresh(sale)
    except Exception:
        db.rollback()
        raise

    total_paid = Decimal(0)
    balance = total_amount - total_paid

    items_read = [
        SaleItemRead(
            id=item.id,
            category_id=item.category_id,
            quantity=item.quantity,
            amount=item.amount,
        )
        for item in created_items
    ]

    return SaleRead(
        id=sale.id,
        reference=sale.reference,
        customer_id=sale.customer_id,
        channel=sale.channel,
        user_id=sale.staff_id,
        sale_date=sale.sale_date,
        created_at=sale.created_at,
        total_amount=total_amount,
        total_paid=total_paid,
        balance=balance,
        items=items_read,
        delivery_status=sale.delivery_status,
        delivery_assigned_to=sale.delivery_assigned_to,
        delivery_notes=sale.delivery_notes,
        out_for_delivery_at=sale.out_for_delivery_at,
        delivered_at=sale.delivered_at,
    )


def list_sales(db: Session) -> list[SaleRead]:
    stmt = select(Sale).order_by(Sale.created_at.desc())
    sales = db.scalars(stmt).all()
    return enrich_sales_with_payments(db, sales)


def enrich_sales_with_payments(db: Session, sales: list[Sale]) -> list[SaleRead]:
    sale_ids = [s.id for s in sales]
    payments_by_sale = _compute_payment_totals(db, sale_ids)
    items_by_sale = _load_items_for_sales(db, sale_ids)

    result: list[SaleRead] = []
    for sale in sales:
        total_amount = sale.total_amount
        total_paid = payments_by_sale.get(sale.id, Decimal(0))
        balance = total_amount - total_paid
        items = items_by_sale.get(sale.id, [])

        items_read = [
            SaleItemRead(
                id=item.id,
                category_id=item.category_id,
                quantity=item.quantity,
                amount=item.amount,
            )
            for item in items
        ]

        result.append(
            SaleRead(
                id=sale.id,
                reference=sale.reference,
                customer_id=sale.customer_id,
                channel=sale.channel,
                user_id=sale.staff_id,
                sale_date=sale.sale_date,
                created_at=sale.created_at,
                total_amount=total_amount,
                total_paid=total_paid,
                balance=balance,
                items=items_read,
                delivery_status=sale.delivery_status,
                delivery_assigned_to=sale.delivery_assigned_to,
                delivery_notes=sale.delivery_notes,
                out_for_delivery_at=sale.out_for_delivery_at,
                delivered_at=sale.delivered_at,
            )
        )
    return result


def get_sale(db: Session, sale_id: int) -> Sale | None:
    return db.get(Sale, sale_id)


def update_sale_delivery(
    db: Session, sale_id: int, delivery_in: SaleDeliveryUpdate
) -> SaleRead:
    sale = db.get(Sale, sale_id)
    if sale is None:
        raise ValueError("Sale not found")
    payload = delivery_in.model_dump(exclude_unset=True)
    for key, value in payload.items():
        setattr(sale, key, value)
    if sale.delivery_status == "OUT_FOR_DELIVERY" and sale.out_for_delivery_at is None:
        sale.out_for_delivery_at = datetime.now(timezone.utc)
    if sale.delivery_status == "DELIVERED" and sale.delivered_at is None:
        sale.delivered_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(sale)
    sales_read = enrich_sales_with_payments(db, [sale])
    return sales_read[0]

