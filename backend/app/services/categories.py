from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryRead


def create_category(db: Session, category_in: CategoryCreate) -> CategoryRead:
    existing = db.scalar(select(Category).where(Category.name == category_in.name))
    if existing:
        raise ValueError("Category with this name already exists")

    category = Category(name=category_in.name)
    db.add(category)
    db.commit()
    db.refresh(category)
    return CategoryRead.model_validate(category)


def list_categories(db: Session) -> list[CategoryRead]:
    categories = db.scalars(select(Category).order_by(Category.name)).all()
    return [CategoryRead.model_validate(c) for c in categories]


def update_category(
    db: Session, category_id: int, category_in: CategoryCreate
) -> CategoryRead:
    category = db.get(Category, category_id)
    if category is None:
        raise ValueError("Category not found")

    # Enforce unique name
    existing = db.scalar(
        select(Category).where(
            Category.name == category_in.name, Category.id != category_id
        )
    )
    if existing:
        raise ValueError("Category with this name already exists")

    category.name = category_in.name
    db.commit()
    db.refresh(category)
    return CategoryRead.model_validate(category)


def delete_category(db: Session, category_id: int) -> None:
    category = db.get(Category, category_id)
    if category is None:
        raise ValueError("Category not found")

    try:
        db.delete(category)
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ValueError(
            "Cannot delete category that is still referenced by bales, sales, or stock"
        ) from exc

