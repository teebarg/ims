from __future__ import annotations

from decimal import Decimal

from sqlalchemy import ForeignKey, Integer, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class SaleItem(Base):
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    sale_id: Mapped[int] = mapped_column(ForeignKey("sale.id"), index=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("category.id"), index=True)

    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    sale: Mapped["Sale"] = relationship("Sale", back_populates="items")
    category: Mapped["Category"] = relationship("Category", back_populates="sale_items")

