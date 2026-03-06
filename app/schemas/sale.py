from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, Field


class SalesChannel(str, Enum):
    SHOP = "SHOP"
    TIKTOK = "TIKTOK"
    INSTAGRAM = "INSTAGRAM"
    WEBSITE = "WEBSITE"


class SaleBase(BaseModel):
    bale_id: int
    customer_id: UUID
    category_id: int = Field(..., description="Foreign key to category.id")
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
    category_id: int
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

