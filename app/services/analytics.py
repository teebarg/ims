from decimal import Decimal

from sqlalchemy import Date, cast, func, select
from sqlalchemy.orm import Session

from app.models.category import Category
from app.models.inventory import InventoryStock
from app.models.sale import Sale
from app.schemas.analytics import (
    AnalyticsSummary,
    SalesTrendPoint,
    SalesTrendResponse,
    StockCategory,
    StockSnapshot,
)


def get_stock_snapshot(db: Session) -> StockSnapshot:
    stmt = (
        select(
            Category.name,
            func.coalesce(func.sum(InventoryStock.quantity_change), 0).label(
                "quantity"
            ),
        )
        .join(Category, InventoryStock.category_id == Category.id)
        .group_by(Category.name)
        .order_by(Category.name)
    )
    rows = db.execute(stmt).all()
    categories = [
        StockCategory(category=category_name, quantity=int(quantity))
        for category_name, quantity in rows
    ]
    total_stock = sum(c.quantity for c in categories)
    return StockSnapshot(total_stock=total_stock, categories=categories)


def get_sales_trends(db: Session, period: str = "weekly") -> SalesTrendResponse:
    # Use sale_date so revenue is grouped by when the sale happened, not when it was recorded
    if period == "weekly":
        trunc_expr = func.date_trunc("week", Sale.sale_date)
    else:
        trunc_expr = func.date_trunc("month", Sale.sale_date)
    # Cast to SQLAlchemy Date type, not Python's datetime.date
    period_col = cast(trunc_expr, Date).label("period_start")

    stmt = (
        select(
            period_col,
            func.coalesce(func.sum(Sale.total_amount), 0).label("total_amount"),
        )
        .select_from(Sale)
        .group_by(period_col)
        .order_by(period_col)
    )
    rows = db.execute(stmt).all()
    points = [
        SalesTrendPoint(period_start=period_start, total_amount=Decimal(total_amount))
        for period_start, total_amount in rows
    ]
    return SalesTrendResponse(period=period, points=points)


def get_analytics_summary(db: Session) -> AnalyticsSummary:
    revenue_stmt = select(func.coalesce(func.sum(Sale.total_amount), 0)).select_from(
        Sale
    )
    total_revenue = Decimal(db.execute(revenue_stmt).scalar_one())

    return AnalyticsSummary(
        total_revenue=total_revenue,
    )
