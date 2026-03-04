from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, Field


class SalesChannel(str, Enum):
    SHOP = "SHOP"
    SOCIAL_MEDIA = "SOCIAL_MEDIA"
    WEBSITE = "WEBSITE"


class SaleBase(BaseModel):
    bale_id: int
    customer_id: UUID
    category: str = Field(..., description="e.g. shirts, pants, jackets")
    total_quantity: int = Field(..., gt=0)
    unit_price: Decimal = Field(..., gt=0)
    channel: SalesChannel
    user_id: str | None = Field(
        default=None, description="Registered user identifier if applicable"
    )
    sale_date: date | None = Field(
        default=None, description="Explicit sale date; defaults to today if omitted"
    )


class SaleCreate(SaleBase):
    pass


class SaleRead(BaseModel):
    id: int
    bale_id: int
    customer_id: UUID
    category: str
    total_quantity: int
    unit_price: Decimal
    channel: SalesChannel
    user_id: str | None
    sale_date: date
    created_at: datetime
    total_amount: Decimal
    total_paid: Decimal
    balance: Decimal

    class Config:
        from_attributes = True

