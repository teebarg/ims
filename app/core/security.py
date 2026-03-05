from __future__ import annotations

from enum import Enum
from typing import Annotated, Any

from fastapi import Cookie, Depends, HTTPException, status
from pydantic import BaseModel
from app.core.deps import get_current_user


class UserRole(str, Enum):
    SUPER_ADMIN = "super-admin"
    ADMIN = "admin"
    STAFF = "staff"

class CurrentUser(BaseModel):
    user_id: str
    email: str | None = None
    role: str | None = None


def require_roles(*roles: UserRole):
    def dependency(
        current_user: Annotated[dict, Depends(get_current_user)],
    ) -> Any:
        if roles and current_user["role"] not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return current_user

    return dependency

