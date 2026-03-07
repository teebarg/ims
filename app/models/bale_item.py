from __future__ import annotations

from sqlalchemy import ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class BaleItem(Base):
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    bale_id: Mapped[int] = mapped_column(
        ForeignKey("bale.id"), nullable=False, index=True
    )
    category_id: Mapped[int] = mapped_column(
        ForeignKey("category.id"), nullable=False, index=True
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)

    bale: Mapped["Bale"] = relationship("Bale", back_populates="items")
    category: Mapped["Category"] = relationship(
        "Category", back_populates="bale_items"
    )
