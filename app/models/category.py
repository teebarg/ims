from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Category(Base):
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    bales: Mapped[list["Bale"]] = relationship("Bale", back_populates="category")
    sale_items: Mapped[list["SaleItem"]] = relationship(
        "SaleItem", back_populates="category"
    )
    inventory_stocks: Mapped[list["InventoryStock"]] = relationship(
        "InventoryStock", back_populates="category"
    )

