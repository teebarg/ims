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


class SaleDeliveryUpdate(BaseModel):
    delivery_status: str | None = Field(
        default=None, max_length=30, description="e.g. PENDING, OUT_FOR_DELIVERY, DELIVERED"
    )
    delivery_assigned_to: str | None = Field(default=None, max_length=255)
    delivery_notes: str | None = Field(default=None, max_length=500)


class SaleRead(BaseModel):
    id: int
    reference: str
    customer_id: UUID
    channel: str
    user_id: str | None
    sale_date: date
    created_at: datetime
    total_amount: Decimal
    total_paid: Decimal
    balance: Decimal
    items: list[SaleItemRead]
    delivery_status: str | None = None
    delivery_assigned_to: str | None = None
    delivery_notes: str | None = None
    out_for_delivery_at: datetime | None = None
    delivered_at: datetime | None = None

    class Config:
        from_attributes = True

