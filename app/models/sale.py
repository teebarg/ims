from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID as UUIDType

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.customer import SalesChannel


class Sale(Base):
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    bale_id: Mapped[int] = mapped_column(ForeignKey("bale.id"), index=True)
    customer_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("customer.id"), index=True
    )
    category_id: Mapped[int] = mapped_column(
        ForeignKey("category.id"), nullable=False, index=True
    )

    total_quantity: Mapped[int] = mapped_column(Integer)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))

    channel: Mapped[SalesChannel] = mapped_column(
        Enum(SalesChannel, name="sales_channel", native_enum=False), nullable=False
    )
    staff_id: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, server_default="PENDING"
    )

    sale_date: Mapped[date] = mapped_column(
        Date, nullable=False, server_default=func.current_date()
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    bale: Mapped["Bale"] = relationship("Bale", back_populates="sales")
    customer: Mapped["Customer"] = relationship("Customer", back_populates="sales")
    category: Mapped["Category"] = relationship("Category", back_populates="sales")
    payments: Mapped[list["Payment"]] = relationship(
        "Payment", back_populates="sale", cascade="all, delete-orphan"
    )

