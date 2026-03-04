from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class BaleBase(BaseModel):
    reference: str = Field(..., max_length=50)
    category: str = Field(..., max_length=50, description="e.g. shirts, pants, jackets")
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

