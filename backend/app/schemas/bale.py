from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class BaleItemInput(BaseModel):
    category_id: int = Field(..., description="Foreign key to category.id")
    quantity: int = Field(..., gt=0)


class BaleItemRead(BaleItemInput):
    id: int
    bale_id: int

    class Config:
        from_attributes = True


class BaleBase(BaseModel):
    reference: str = Field(..., max_length=50)
    purchase_price: Decimal = Field(..., gt=0)


class BaleCreate(BaleBase):
    items: list[BaleItemInput] = Field(
        ..., min_length=1, description="At least one category/quantity pair"
    )


class BaleRead(BaleBase):
    id: int
    created_at: datetime
    updated_at: datetime
    items: list[BaleItemRead] = []

    class Config:
        from_attributes = True


class BaleListRead(BaleRead):
    """Bale with items; remaining_items is sum of item quantities (no per-bale sold tracking)."""

    remaining_items: int = 0
