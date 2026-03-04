from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.bale import Bale
from app.models.inventory import InventoryStock
from app.schemas.bale import BaleCreate, BaleRead


def create_bale(db: Session, bale_in: BaleCreate) -> BaleRead:
    bale = Bale(
        reference=bale_in.reference,
        category=bale_in.category,
        purchase_price=Decimal(bale_in.purchase_price),
        total_items=bale_in.total_items,
    )
    db.add(bale)
    db.flush()

    stock = InventoryStock(
        bale_id=bale.id,
        category=bale.category,
        quantity_change=bale.total_items,
        reason="bale_in",
    )
    db.add(stock)
    db.commit()
    db.refresh(bale)
    return BaleRead.model_validate(bale)


def list_bales(db: Session) -> list[BaleRead]:
    stmt = select(Bale).order_by(Bale.created_at.desc())
    bales = db.execute(stmt).scalars().all()
    return [BaleRead.model_validate(b) for b in bales]

