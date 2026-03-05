from datetime import date
from decimal import Decimal

from sqlalchemy import cast, func, select
from sqlalchemy.orm import Session

from app.models.bale import Bale
from app.models.category import Category
from app.models.inventory import InventoryStock
from app.models.sale import Sale
from app.schemas.analytics import (
    AnalyticsSummary,
    ProfitPerBale,
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
    if period == "weekly":
        trunc_expr = func.date_trunc("week", Sale.created_at)
    else:
        trunc_expr = func.date_trunc("month", Sale.created_at)

    stmt = select(
        cast(trunc_expr, date).label("period_start"),
        func.coalesce(func.sum(Sale.total_amount), 0).label("total_amount"),
    ).group_by("period_start").order_by("period_start")
    rows = db.execute(stmt).all()
    points = [
        SalesTrendPoint(period_start=period_start, total_amount=Decimal(total_amount))
        for period_start, total_amount in rows
    ]
    return SalesTrendResponse(period=period, points=points)


def get_analytics_summary(db: Session) -> AnalyticsSummary:
    # total revenue
    revenue_stmt = select(func.coalesce(func.sum(Sale.total_amount), 0)).select_from(
        Sale
    )
    total_revenue = Decimal(db.execute(revenue_stmt).scalar_one())

    # profit per bale = sum(sale revenue) - purchase_price
    bale_profit_stmt = (
        select(
            Bale.id,
            Bale.reference,
            (func.coalesce(func.sum(Sale.total_amount), 0) - Bale.purchase_price).label(
                "profit"
            ),
        )
        .join(Sale, Sale.bale_id == Bale.id, isouter=True)
        .group_by(Bale.id, Bale.reference, Bale.purchase_price)
    )
    bale_rows = db.execute(bale_profit_stmt).all()
    profit_per_bale = [
        ProfitPerBale(
            bale_id=bale_id,
            reference=reference,
            profit=Decimal(profit),
        )
        for bale_id, reference, profit in bale_rows
    ]
    total_profit = sum(p.profit for p in profit_per_bale)

    # simple turnover: total items sold / max(current stock, 1)
    sold_items_stmt = select(
        func.coalesce(func.sum(Sale.total_quantity), 0)
    ).select_from(Sale)
    sold_items = int(db.execute(sold_items_stmt).scalar_one())

    stock_snapshot = get_stock_snapshot(db)
    current_stock = max(stock_snapshot.total_stock, 1)
    turnover_rate = sold_items / float(current_stock)

    return AnalyticsSummary(
        total_revenue=total_revenue,
        total_profit=total_profit,
        turnover_rate=turnover_rate,
        profit_per_bale=profit_per_bale,
    )

