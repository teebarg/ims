from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import UserRole, require_roles
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import (
    UserCreate,
    UserRead,
    UserUpdateActive,
    UserUpdateRole,
)
from app.services.users import create_user, get_user, list_users, set_user_active, set_user_role


router = APIRouter()


@router.get("/", response_model=list[UserRead])
def list_users_endpoint(
    db: Session = Depends(get_db),
    _: None = Depends(require_roles(UserRole.SUPER_ADMIN)),
) -> list[UserRead]:
    return list_users(db)


@router.post("/", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_user_endpoint(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    _: None = Depends(require_roles(UserRole.SUPER_ADMIN)),
) -> UserRead:
    try:
        return create_user(db, user_in)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.patch("/{user_id}/role", response_model=UserRead)
def update_user_role_endpoint(
    user_id: UUID,
    update: UserUpdateRole,
    db: Session = Depends(get_db),
    _: None = Depends(require_roles(UserRole.SUPER_ADMIN)),
) -> UserRead:
    user = get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return set_user_role(db, user, update.role)


@router.patch("/{user_id}/active", response_model=UserRead)
def update_user_active_endpoint(
    user_id: UUID,
    update: UserUpdateActive,
    db: Session = Depends(get_db),
    _: None = Depends(require_roles(UserRole.SUPER_ADMIN)),
) -> UserRead:
    user = get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return set_user_active(db, user, update.is_active)

