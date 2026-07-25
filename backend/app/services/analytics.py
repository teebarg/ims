from collections import defaultdict
from decimal import Decimal

from sqlalchemy import Date, cast, func, select
from sqlalchemy.orm import Session

from app.models.bale import Bale
from app.models.category import Category
from app.models.customer import Customer
from app.models.inventory import InventoryStock
from app.models.sale import Sale
from app.schemas.analytics import (
    AnalyticsSummary,
    SalesTrendPoint,
    SalesTrendResponse,
    StockCategory,
    StockSnapshot,
    TopCustomer,
    ChannelStat,
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
    # Revenue from sales
    if period == "weekly":
        trunc_expr_sale = func.date_trunc("week", Sale.sale_date)
    else:
        trunc_expr_sale = func.date_trunc("month", Sale.sale_date)
    period_col_sale = cast(trunc_expr_sale, Date).label("period_start")

    revenue_stmt = (
        select(
            period_col_sale,
            func.coalesce(func.sum(Sale.total_amount), 0).label("total_amount"),
        )
        .select_from(Sale)
        .group_by(period_col_sale)
    )
    revenue_rows = db.execute(revenue_stmt).all()

    # Costs from bales
    if period == "weekly":
        trunc_expr_bale = func.date_trunc("week", Bale.created_at)
    else:
        trunc_expr_bale = func.date_trunc("month", Bale.created_at)
    period_col_bale = cast(trunc_expr_bale, Date).label("period_start")

    cost_stmt = (
        select(
            period_col_bale,
            func.coalesce(func.sum(Bale.purchase_price), 0).label("total_cost"),
        )
        .select_from(Bale)
        .group_by(period_col_bale)
    )
    cost_rows = db.execute(cost_stmt).all()

    # Merge into trends dict
    trends = defaultdict(lambda: {"revenue": Decimal(0), "cost": Decimal(0)})
    for period_start, amount in revenue_rows:
        trends[period_start]["revenue"] = Decimal(amount)
    for period_start, cost in cost_rows:
        trends[period_start]["cost"] = Decimal(cost)

    # Create points, sorted by period
    points = [
        SalesTrendPoint(
            period_start=period_start,
            total_amount=data["revenue"],
            total_cost=data["cost"],
            total_profit=data["revenue"] - data["cost"],
        )
        for period_start, data in sorted(trends.items())
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


def get_top_customers(db: Session, limit: int = 5) -> list[TopCustomer]:
    # group sales by customer and compute number of purchases + total spent
    stmt = (
        select(
            Customer.id,
            Customer.display_name,
            func.count(Sale.id).label("purchases"),
            func.coalesce(func.sum(Sale.total_amount), 0).label("spent"),
        )
        .join(Sale, Sale.customer_id == Customer.id)
        .group_by(Customer.id, Customer.display_name)
        .order_by(func.sum(Sale.total_amount).desc())
        .limit(limit)
    )
    rows = db.execute(stmt).all()
    return [
        TopCustomer(
            customer_id=cid,
            display_name=name,
            purchases=int(purchases),
            spent=Decimal(spent),
        )
        for cid, name, purchases, spent in rows
    ]


def get_channel_stats(db: Session) -> list[ChannelStat]:
    # compute distribution of sales by channel (count and revenue)
    stmt = (
        select(
            Sale.channel,
            func.count(Sale.id).label("count"),
            func.coalesce(func.sum(Sale.total_amount), 0).label("revenue"),
        )
        .group_by(Sale.channel)
    )
    rows = db.execute(stmt).all()
    total_count = sum(r[1] for r in rows)
    stats: list[ChannelStat] = []
    for channel, count, revenue in rows:
        pct = float(count) / total_count * 100 if total_count else 0.0
        stats.append(ChannelStat(channel=channel, count=int(count), revenue=Decimal(revenue), percentage=pct))
    return stats


