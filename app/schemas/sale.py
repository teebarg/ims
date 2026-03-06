from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


class SaleItemInput(BaseModel):
    category_id: int
    quantity: int = Field(..., gt=0)
    amount: Decimal = Field(..., gt=0)


class SaleItemRead(SaleItemInput):
    id: int

    class Config:
        from_attributes = True


class SaleCreate(BaseModel):
    customer_id: UUID
    channel: str
    items: list[SaleItemInput]
    user_id: str | None = Field(
        default=None, description="Registered user identifier if applicable"
    )
    sale_date: date | None = Field(
        default=None, description="Explicit sale date; defaults to today if omitted"
    )


class SaleRead(BaseModel):
    id: int
    customer_id: UUID
    channel: str
    user_id: str | None
    sale_date: date
    created_at: datetime
    total_amount: Decimal
    total_paid: Decimal
    balance: Decimal
    items: list[SaleItemRead]

    class Config:
        from_attributes = True

