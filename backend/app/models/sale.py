from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Date, DateTime, Integer, Numeric, String, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Sale(Base):
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    customer_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("customer.id"), index=True
    )

    reference: Mapped[str] = mapped_column(String(50), nullable=False, unique=True, index=True)

    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))

    channel: Mapped[str] = mapped_column(String(50), nullable=False)
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

    delivery_status: Mapped[str] = mapped_column(
        String(30), nullable=False, index=True, server_default="PROCESSING"
    )
    delivery_assigned_to: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )
    delivery_notes: Mapped[str | None] = mapped_column(String(500), nullable=True)
    out_for_delivery_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    delivered_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    customer: Mapped["Customer"] = relationship("Customer", back_populates="sales")
    items: Mapped[list["SaleItem"]] = relationship(
        "SaleItem", back_populates="sale", cascade="all, delete-orphan"
    )
    payments: Mapped[list["Payment"]] = relationship(
        "Payment", back_populates="sale", cascade="all, delete-orphan"
    )

