from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class PaymentBase(BaseModel):
    sale_id: int
    amount: Decimal = Field(..., gt=0)
    method: str = Field(..., description="e.g. cash, transfer, pos")
    reference: str | None = None


class PaymentCreate(PaymentBase):
    pass


class PaymentRead(PaymentBase):
    id: int
    payment_date: datetime
    created_at: datetime

    class Config:
        from_attributes = True

