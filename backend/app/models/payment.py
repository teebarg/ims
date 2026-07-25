from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Payment(Base):
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    sale_id: Mapped[int] = mapped_column(ForeignKey("sale.id"), index=True)

    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    method: Mapped[str] = mapped_column(String(50))
    reference: Mapped[str | None] = mapped_column(String(100), nullable=True)

    payment_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    sale: Mapped["Sale"] = relationship("Sale", back_populates="payments")

