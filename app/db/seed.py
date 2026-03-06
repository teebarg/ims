import asyncio
import uuid

from sqlalchemy import insert
from app.db.session import async_session
from app.db.models import Category, Customer, InventoryStock


async def seed():

    async with async_session() as db:

        async with db.begin():

            categories = ["Top", "Skirt", "Trouser", "Dress"]

            for name in categories:
                db.add(Category(name=name))

            walkin = Customer(
                id=uuid.uuid4(),
                display_name="Walk-in Customer",
                identifier="walkin",
                identifier_type="CUSTOM",
            )

            db.add(walkin)

        await db.commit()

        # add inventory

        async with db.begin():

            cats = await db.execute(
                Category.__table__.select()
            )

            for c in cats.scalars():

                db.add(
                    InventoryStock(
                        category_id=c.id,
                        quantity_change=50,
                        reason="INITIAL_STOCK",
                    )
                )

        await db.commit()

    print("Seeding completed")


if __name__ == "__main__":
    asyncio.run(seed())
