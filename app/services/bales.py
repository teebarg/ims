from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.bale import Bale
from app.models.category import Category
from app.models.inventory import InventoryStock
from app.models.sale_item import SaleItem
from app.schemas.bale import BaleCreate, BaleListRead, BaleRead


def create_bale(db: Session, bale_in: BaleCreate) -> BaleRead:
    category = db.get(Category, bale_in.category_id)
    if category is None:
        raise ValueError("Category not found")

    bale = Bale(
        reference=bale_in.reference,
        category_id=bale_in.category_id,
        purchase_price=Decimal(bale_in.purchase_price),
        total_items=bale_in.total_items,
    )
    db.add(bale)
    db.flush()

    stock = InventoryStock(
        category_id=bale.category_id,
        quantity_change=bale.total_items,
        reason="BALE_IN",
    )
    db.add(stock)
    db.commit()
    db.refresh(bale)
    return BaleRead.model_validate(bale)


def list_bales(db: Session) -> list[BaleListRead]:
    stmt = select(Bale).order_by(Bale.created_at.desc())
    bales = db.execute(stmt).scalars().all()
    if not bales:
        return []

    category_ids = {b.category_id for b in bales}
    sold_stmt = (
        select(SaleItem.category_id, func.coalesce(func.sum(SaleItem.quantity), 0).label("sold"))
        .where(SaleItem.category_id.in_(category_ids))
        .group_by(SaleItem.category_id)
    )
    sold_rows = db.execute(sold_stmt).all()
    sold_by_category = {row.category_id: int(row.sold) for row in sold_rows}

    return [
        BaleListRead(
            id=b.id,
            reference=b.reference,
            category_id=b.category_id,
            purchase_price=b.purchase_price,
            total_items=b.total_items,
            created_at=b.created_at,
            updated_at=b.updated_at,
            remaining_items=max(0, b.total_items - sold_by_category.get(b.category_id, 0)),
        )
        for b in bales
    ]

