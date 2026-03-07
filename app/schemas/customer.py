from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.payment import PaymentRead
from app.schemas.sale import SaleRead


class IdentifierType(str, Enum):
    TIKTOK = "TIKTOK"
    INSTAGRAM = "INSTAGRAM"
    STREET = "STREET"
    WEBSITE = "WEBSITE"


class CustomerBase(BaseModel):
    display_name: str = Field(..., max_length=255)
    identifier: str = Field(..., max_length=255)
    identifier_type: IdentifierType
    phone: str | None = Field(default=None, max_length=50)


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(CustomerBase):
    pass


class CustomerResponse(CustomerBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CustomerListResponse(CustomerResponse):
    """Customer with summary fields for list views."""

    balance: Decimal = Decimal("0")
    lifetime_value: Decimal = Decimal("0")
    last_sale_date: date | None = None


class CustomerProfileResponse(BaseModel):
    """Combined response for the customer profile page."""

    customer: CustomerResponse
    sales: list[SaleRead]
    balance: Decimal
    lifetime_value: Decimal
    payments: list[PaymentRead]

