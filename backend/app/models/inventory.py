from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class InventoryStock(Base):
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    sale_id: Mapped[int | None] = mapped_column(
        ForeignKey("sale.id"), nullable=True, index=True
    )
    category_id: Mapped[int] = mapped_column(
        ForeignKey("category.id"), nullable=False, index=True
    )
    quantity_change: Mapped[int] = mapped_column(Integer)
    reason: Mapped[str] = mapped_column(String(50))

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )

    sale: Mapped["Sale"] = relationship("Sale")
    category: Mapped["Category"] = relationship(
        "Category", back_populates="inventory_stocks"
    )

