from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class IdentifierType(str, enum.Enum):
    TIKTOK = "TIKTOK"
    INSTAGRAM = "INSTAGRAM"
    STREET = "STREET"
    APP_USER = "APP_USER"


class SalesChannel(str, enum.Enum):
    SHOP = "SHOP"
    TIKTOK = "TIKTOK"
    INSTAGRAM = "INSTAGRAM"
    WEBSITE = "WEBSITE"


class Customer(Base):
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    identifier: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    identifier_type: Mapped[IdentifierType] = mapped_column(
        Enum(IdentifierType, name="identifier_type", native_enum=False),
        nullable=False,
    )
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    sales: Mapped[list["Sale"]] = relationship(
        "Sale", back_populates="customer", cascade="all, delete-orphan"
    )

