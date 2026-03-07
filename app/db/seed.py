import asyncio
import uuid
from decimal import Decimal
from datetime import datetime, timezone

from sqlalchemy import insert
from app.db.session import SessionLocal
from app.models.bale import Bale
from app.models.bale_item import BaleItem
from app.models.category import Category
from app.models.customer import Customer
from app.models.inventory import InventoryStock
from app.models.sale import Sale
from app.models.sale_item import SaleItem


def seed():
    db = SessionLocal()
    try:
        # Get walkin customer
        walkin = db.query(Customer).filter(Customer.identifier == "walkin").first()
        if not walkin:
            print("Walkin customer not found, skipping seed")
            return

        # Add more customers if not exist
        additional_customers = [
            {"identifier": "tiktok_user", "identifier_type": "TIKTOK", "display_name": "Tiktok Customer"},
            {"identifier": "insta_user", "identifier_type": "INSTAGRAM", "display_name": "Instagram Customer"},
            {"identifier": "street_user", "identifier_type": "STREET", "display_name": "Street Customer"},
            {"identifier": "web_user", "identifier_type": "WEBSITE", "display_name": "Website Customer"},
        ]
        customers = [walkin]
        for cust_data in additional_customers:
            cust = db.query(Customer).filter(Customer.identifier == cust_data["identifier"]).first()
            if not cust:
                cust = Customer(id=uuid.uuid4(), **cust_data)
                db.add(cust)
            customers.append(cust)
        db.commit()

        # add inventory for all categories
        cats = db.query(Category).all()
        for c in cats:
            existing = db.query(InventoryStock).filter(InventoryStock.category_id == c.id, InventoryStock.reason == "INITIAL_STOCK").first()
            if not existing:
                db.add(
                    InventoryStock(
                        category_id=c.id,
                        quantity_change=50,
                        reason="INITIAL_STOCK",
                    )
                )
        db.commit()

        customer_objs = {"walkin": walkin}
        for cust in customers[1:]:
            customer_objs[cust.identifier] = cust

        # add sales and bales
        sales_data = [
            ("SALE001", datetime(2026, 2, 1, tzinfo=timezone.utc), Decimal("10000.00"), "walkin"),
            ("SALE002", datetime(2026, 3, 1, tzinfo=timezone.utc), Decimal("20000.00"), "tiktok_user"),
            ("SALE003", datetime(2026, 1, 15, tzinfo=timezone.utc), Decimal("15000.00"), "insta_user"),
            ("SALE004", datetime(2026, 4, 10, tzinfo=timezone.utc), Decimal("25000.00"), "street_user"),
            ("SALE005", datetime(2026, 5, 5, tzinfo=timezone.utc), Decimal("18000.00"), "web_user"),
            ("SALE006", datetime(2026, 1, 20, tzinfo=timezone.utc), Decimal("12000.00"), "walkin"),
            ("SALE007", datetime(2026, 2, 15, tzinfo=timezone.utc), Decimal("22000.00"), "tiktok_user"),
            ("SALE008", datetime(2026, 3, 10, tzinfo=timezone.utc), Decimal("17000.00"), "insta_user"),
            ("SALE009", datetime(2026, 4, 5, tzinfo=timezone.utc), Decimal("19000.00"), "street_user"),
            ("SALE010", datetime(2026, 5, 10, tzinfo=timezone.utc), Decimal("21000.00"), "web_user"),
            ("SALE011", datetime(2026, 1, 25, tzinfo=timezone.utc), Decimal("16000.00"), "walkin"),
            ("SALE012", datetime(2026, 2, 20, tzinfo=timezone.utc), Decimal("14000.00"), "tiktok_user"),
            ("SALE013", datetime(2026, 3, 15, tzinfo=timezone.utc), Decimal("23000.00"), "insta_user"),
            ("SALE014", datetime(2026, 4, 20, tzinfo=timezone.utc), Decimal("20000.00"), "street_user"),
            ("SALE015", datetime(2026, 5, 15, tzinfo=timezone.utc), Decimal("24000.00"), "web_user"),
        ]
        for ref, date, amount, cust_key in sales_data:
            if not db.query(Sale).filter(Sale.reference == ref).first():
                sale = Sale(reference=ref, sale_date=date, total_amount=amount, customer_id=customer_objs[cust_key].id, channel="SHOP", staff_id="seed")
                db.add(sale)

        bales_data = [
            ("BALE001", datetime(2026, 2, 1, tzinfo=timezone.utc), Decimal("50000.00")),
            ("BALE002", datetime(2026, 3, 1, tzinfo=timezone.utc), Decimal("60000.00")),
            ("BALE003", datetime(2026, 1, 10, tzinfo=timezone.utc), Decimal("40000.00")),
            ("BALE004", datetime(2026, 4, 15, tzinfo=timezone.utc), Decimal("70000.00")),
            ("BALE005", datetime(2026, 5, 20, tzinfo=timezone.utc), Decimal("55000.00")),
        ]
        for ref, date, price in bales_data:
            if not db.query(Bale).filter(Bale.reference == ref).first():
                bale = Bale(reference=ref, purchase_price=price, created_at=date)
                db.add(bale)

        # add bale items
        cats = db.query(Category).all()
        for ref, date, price in bales_data:
            bale = db.query(Bale).filter(Bale.reference == ref).first()
            if bale:
                for cat in cats:
                    if not db.query(BaleItem).filter(BaleItem.bale_id == bale.id, BaleItem.category_id == cat.id).first():
                        item = BaleItem(bale_id=bale.id, category_id=cat.id, quantity=10)
                        db.add(item)

        db.commit()

        # add sale items
        cats = db.query(Category).all()
        if cats:
            first_cat = cats[0]
            for ref, date, amount, cust_key in sales_data:
                sale = db.query(Sale).filter(Sale.reference == ref).first()
                if sale and not db.query(SaleItem).filter(SaleItem.sale_id == sale.id).first():
                    item = SaleItem(
                        sale_id=sale.id,
                        category_id=first_cat.id,
                        quantity=1,
                        amount=amount
                    )
                    db.add(item)

        db.commit()

        # Add BaleItems for each bale
        categories = db.query(Category).all()
        category_ids = [c.id for c in categories]
        bales = db.query(Bale).filter(Bale.reference.in_(["BALE001", "BALE002", "BALE003", "BALE004", "BALE005"])).all()
        for bale in bales:
            for cat_id in category_ids:
                # Check if item exists
                if not db.query(BaleItem).filter(BaleItem.bale_id == bale.id, BaleItem.category_id == cat_id).first():
                    item = BaleItem(bale_id=bale.id, category_id=cat_id, quantity=5)
                    db.add(item)

        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    seed()
    print("Seeding completed")
