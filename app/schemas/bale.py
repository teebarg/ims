from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class BaleBase(BaseModel):
    reference: str = Field(..., max_length=50)
    category_id: int = Field(..., description="Foreign key to category.id")
    purchase_price: Decimal = Field(..., gt=0)
    total_items: int = Field(..., gt=0)


class BaleCreate(BaleBase):
    pass


class BaleRead(BaleBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BaleListRead(BaleRead):
    """Bale with remaining items (total_items minus quantity sold)."""

    remaining_items: int = 0

