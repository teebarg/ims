from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Bale(Base):
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    reference: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    category_id: Mapped[int] = mapped_column(
        ForeignKey("category.id"), nullable=False, index=True
    )
    purchase_price: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    total_items: Mapped[int] = mapped_column(Integer)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    category: Mapped["Category"] = relationship("Category", back_populates="bales")

