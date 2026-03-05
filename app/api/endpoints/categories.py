from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import UserRole, require_roles
from app.db.session import get_db
from app.schemas.category import CategoryCreate, CategoryRead
from app.services.categories import (
    create_category,
    delete_category,
    list_categories,
    update_category,
)
from app.schemas.generic import Message


router = APIRouter()


@router.get("/", response_model=list[CategoryRead])
def list_categories_endpoint(db: Session = Depends(get_db)) -> list[CategoryRead]:
    return list_categories(db)


@router.post("/", response_model=CategoryRead, status_code=status.HTTP_201_CREATED)
def create_category_endpoint(
    category_in: CategoryCreate,
    db: Session = Depends(get_db),
    _: None = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF)),
) -> CategoryRead:
    try:
        return create_category(db, category_in)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.put("/{category_id}", response_model=CategoryRead)
def update_category_endpoint(
    category_id: int,
    category_in: CategoryCreate,
    db: Session = Depends(get_db),
    _: None = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF)),
) -> CategoryRead:
    try:
        return update_category(db, category_id, category_in)
    except ValueError as exc:
        message = str(exc)
        status_code = status.HTTP_404_NOT_FOUND if "not found" in message.lower() else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=message) from exc


@router.delete("/{category_id}")
def delete_category_endpoint(
    category_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(require_roles(UserRole.SUPER_ADMIN)),
) -> Message:
    try:
        delete_category(db, category_id)
        return Message(details="Category deleted successfully")
    except ValueError as exc:
        message = str(exc)
        status_code = status.HTTP_404_NOT_FOUND if "not found" in message.lower() else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=message) from exc

