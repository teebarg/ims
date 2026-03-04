from datetime import date
from decimal import Decimal

from pydantic import BaseModel


class ProfitPerBale(BaseModel):
    bale_id: int
    reference: str
    profit: Decimal


class SalesTrendPoint(BaseModel):
    period_start: date
    total_amount: Decimal


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
    total_revenue: Decimal
    total_profit: Decimal
    turnover_rate: float
    profit_per_bale: list[ProfitPerBale]

