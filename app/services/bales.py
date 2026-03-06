from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.bale import Bale
from app.models.category import Category
from app.models.inventory import InventoryStock
from app.models.sale import Sale
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
        bale_id=bale.id,
        category_id=bale.category_id,
        quantity_change=bale.total_items,
        reason="bale_in",
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

    bale_ids = [b.id for b in bales]
    sold_stmt = (
        select(Sale.bale_id, func.coalesce(func.sum(Sale.total_quantity), 0).label("sold"))
        .where(Sale.bale_id.in_(bale_ids))
        .group_by(Sale.bale_id)
    )
    sold_rows = db.execute(sold_stmt).all()
    sold_by_bale = {row.bale_id: int(row.sold) for row in sold_rows}

    return [
        BaleListRead(
            id=b.id,
            reference=b.reference,
            category_id=b.category_id,
            purchase_price=b.purchase_price,
            total_items=b.total_items,
            created_at=b.created_at,
            updated_at=b.updated_at,
            remaining_items=max(0, b.total_items - sold_by_bale.get(b.id, 0)),
        )
        for b in bales
    ]

