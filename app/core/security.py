from __future__ import annotations

from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Annotated, Any

from fastapi import Cookie, Depends, HTTPException, status
from jose import JWTError, jwt
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.core.deps import get_current_user


class UserRole(str, Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    ADMIN = "ADMIN"
    STAFF = "STAFF"


class TokenPayload(BaseModel):
    sub: str
    role: UserRole
    exp: int


class CurrentUser(BaseModel):
    id: str
    email: str
    role: UserRole


ACCESS_TOKEN_COOKIE_NAME = "access_token"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRES_MINUTES = 60 * 24


def require_roles(*roles: UserRole):
    def dependency(
        current_user: Annotated[Any, Depends(get_current_user)],
    ) -> Any:
        print("🚀 ~ file: security.py:44 ~ current_user:", current_user)
        if roles and current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return current_user

    return dependency

