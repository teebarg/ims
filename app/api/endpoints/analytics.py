from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.analytics import (
    AnalyticsSummary,
    SalesTrendResponse,
    StockSnapshot,
)
from app.services.analytics import (
    get_analytics_summary,
    get_sales_trends,
    get_stock_snapshot,
)


router = APIRouter()


@router.get("/", response_model=AnalyticsSummary)
def analytics_summary(
    db: Session = Depends(get_db),
) -> AnalyticsSummary:
    return get_analytics_summary(db)


@router.get("/trends", response_model=SalesTrendResponse)
def analytics_trends(
    period: str = Query("weekly", pattern="^(weekly|monthly)$"),
    db: Session = Depends(get_db),
) -> SalesTrendResponse:
    return get_sales_trends(db, period=period)


@router.get("/stock", response_model=StockSnapshot)
def analytics_stock(db: Session = Depends(get_db)) -> StockSnapshot:
    return get_stock_snapshot(db)

