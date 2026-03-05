from __future__ import annotations

from typing import Iterable
from uuid import UUID

from passlib.context import CryptContext
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.security import UserRole
from app.models.user import User
from app.schemas.user import UserCreate, UserRead


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def list_users(db: Session) -> list[UserRead]:
    users = db.scalars(select(User).order_by(User.created_at.desc())).all()
    return [UserRead.model_validate(u) for u in users]


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(func.lower(User.email) == func.lower(email)))


def get_user(db: Session, user_id: UUID) -> User | None:
    return db.get(User, user_id)


def create_user(db: Session, user_in: UserCreate) -> UserRead:
    existing = get_user_by_email(db, user_in.email)
    if existing:
        raise ValueError("User with this email already exists")

    user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=get_password_hash(user_in.password),
        role=user_in.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserRead.model_validate(user)


def set_user_role(db: Session, user: User, role: UserRole) -> UserRead:
    user.role = role
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserRead.model_validate(user)


def set_user_active(db: Session, user: User, is_active: bool) -> UserRead:
    user.is_active = is_active
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserRead.model_validate(user)


def any_users_exist(db: Session) -> bool:
    return db.scalar(select(func.count(User.id))) > 0

