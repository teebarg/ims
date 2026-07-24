from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.bale import Bale
from app.models.bale_item import BaleItem
from app.models.category import Category
from app.models.inventory import InventoryStock
from app.schemas.bale import BaleCreate, BaleItemRead, BaleListRead, BaleRead


def create_bale(db: Session, bale_in: BaleCreate) -> BaleRead:
    category_ids = {item.category_id for item in bale_in.items}
    existing = set(
        db.scalars(select(Category.id).where(Category.id.in_(category_ids))).all()
    )
    missing = category_ids - existing
    if missing:
        raise ValueError(f"Category not found: {sorted(missing)}")

    bale = Bale(
        reference=bale_in.reference,
        purchase_price=Decimal(bale_in.purchase_price),
    )
    db.add(bale)
    db.flush()

    for item_in in bale_in.items:
        bi = BaleItem(
            bale_id=bale.id,
            category_id=item_in.category_id,
            quantity=item_in.quantity,
        )
        db.add(bi)
        db.add(
            InventoryStock(
                category_id=item_in.category_id,
                quantity_change=item_in.quantity,
                reason="BALE_PURCHASE",
            )
        )
    db.commit()
    db.refresh(bale)
    items_stmt = select(BaleItem).where(BaleItem.bale_id == bale.id)
    bale_items = list(db.scalars(items_stmt).all())
    return BaleRead(
        id=bale.id,
        reference=bale.reference,
        purchase_price=bale.purchase_price,
        created_at=bale.created_at,
        updated_at=bale.updated_at,
        items=[
            BaleItemRead(id=bi.id, bale_id=bi.bale_id, category_id=bi.category_id, quantity=bi.quantity)
            for bi in bale_items
        ],
    )


def list_bales(db: Session) -> list[BaleListRead]:
    stmt = select(Bale).options(selectinload(Bale.items)).order_by(Bale.created_at.desc())
    bales = db.execute(stmt).scalars().all()
    if not bales:
        return []

    result: list[BaleListRead] = []
    for b in bales:
        total_items = sum(bi.quantity for bi in b.items)
        result.append(
            BaleListRead(
                id=b.id,
                reference=b.reference,
                purchase_price=b.purchase_price,
                created_at=b.created_at,
                updated_at=b.updated_at,
                items=[
                    BaleItemRead(
                        id=bi.id,
                        bale_id=bi.bale_id,
                        category_id=bi.category_id,
                        quantity=bi.quantity,
                    )
                    for bi in b.items
                ],
                remaining_items=total_items,
            )
        )
    return result
