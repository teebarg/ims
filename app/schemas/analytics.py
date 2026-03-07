from datetime import date
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel

class SalesTrendPoint(BaseModel):
    period_start: date
    total_amount: Decimal
    # optional fields added after schema change to allow cost/profit charts
    total_cost: Decimal | None = None
    total_profit: Decimal | None = None

class SalesTrendResponse(BaseModel):
    period: str
    points: list[SalesTrendPoint]

class StockCategory(BaseModel):
    category: str
    quantity: int

class StockSnapshot(BaseModel):
    total_stock: int
    categories: list[StockCategory]

class AnalyticsSummary(BaseModel):
    # revenue is still the primary number returned by the simple summary
    total_revenue: Decimal

    # optional profit figure for clients that may need it
    total_profit: Decimal | None = None


class TopCustomer(BaseModel):
    customer_id: UUID
    display_name: str
    purchases: int
    spent: Decimal


class ChannelStat(BaseModel):
    channel: str
    count: int
    revenue: Decimal
    percentage: float
