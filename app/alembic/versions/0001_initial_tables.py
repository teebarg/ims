"""initial core tables with categories table

Revision ID: 0001_initial
Revises:
Create Date: 2026-03-05
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Categories table
    op.create_table(
        "category",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=50), nullable=False, unique=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    # Bale table (metadata)
    op.create_table(
        "bale",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("reference", sa.String(length=50), nullable=False, unique=True),
        sa.Column("purchase_price", sa.Numeric(12, 2), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    # Bale items
    op.create_table(
        "baleitem",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("bale_id", sa.Integer(), sa.ForeignKey("bale.id"), nullable=False),
        sa.Column(
            "category_id",
            sa.Integer(),
            sa.ForeignKey("category.id"),
            nullable=False,
        ),
        sa.Column("quantity", sa.Integer(), nullable=False),
    )

    # Customer table
    op.create_table(
        "customer",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("display_name", sa.String(length=255), nullable=False),
        sa.Column("identifier", sa.String(length=255), nullable=False, unique=True),
        sa.Column("identifier_type", sa.String(length=50), nullable=False),
        sa.Column("phone", sa.String(length=50), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    # Sale table
    op.create_table(
        "sale",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "customer_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("customer.id"),
            nullable=False,
        ),
        sa.Column("total_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("channel", sa.String(length=50), nullable=False),
        sa.Column("staff_id", sa.String(length=255), nullable=False),

        # Payment status
        sa.Column(
            "status",
            sa.String(length=20),
            nullable=False,
            server_default="PENDING",
        ),

        # Delivery tracking
        sa.Column(
            "delivery_status",
            sa.String(length=30),
            nullable=False,
            server_default="PROCESSING",
        ),  # PROCESSING / OUT_FOR_DELIVERY / DELIVERED

        sa.Column(
            "delivery_assigned_to",
            sa.String(length=255),
            nullable=True,
        ),

        sa.Column(
            "delivery_notes",
            sa.Text(),
            nullable=True,
        ),

        sa.Column(
            "out_for_delivery_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),

        sa.Column(
            "delivered_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),

        sa.Column(
            "sale_date",
            sa.Date(),
            nullable=False,
            server_default=sa.func.current_date(),
        ),

        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),

        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
            nullable=False,
        ),
    )

    # Sale items table
    op.create_table(
        "saleitem",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("sale_id", sa.Integer(), sa.ForeignKey("sale.id"), nullable=False),
        sa.Column(
            "category_id",
            sa.Integer(),
            sa.ForeignKey("category.id"),
            nullable=False,
        ),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
    )

    # Payment table
    op.create_table(
        "payment",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("sale_id", sa.Integer(), sa.ForeignKey("sale.id"), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("method", sa.String(length=50), nullable=False),
        sa.Column("reference", sa.String(length=100), nullable=True),
        sa.Column(
            "payment_date",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    # Inventory stock table
    op.create_table(
        "inventorystock",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("sale_id", sa.Integer(), sa.ForeignKey("sale.id"), nullable=True),
        sa.Column(
            "category_id",
            sa.Integer(),
            sa.ForeignKey("category.id"),
            nullable=False,
        ),
        sa.Column("quantity_change", sa.Integer(), nullable=False),
        sa.Column("reason", sa.String(length=50), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_table("inventorystock")
    op.drop_table("payment")
    op.drop_table("saleitem")
    op.drop_table("sale")
    op.drop_table("customer")
    op.drop_table("baleitem")
    op.drop_table("bale")
    op.drop_table("category")