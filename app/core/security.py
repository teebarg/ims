from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Annotated

from fastapi import Cookie, Depends, HTTPException, status
from jose import JWTError, jwt
from pydantic import BaseModel

from app.core.config import settings


class UserRole(str, Enum):
    ADMIN = "ADMIN"
    STAFF = "STAFF"


class TokenPayload(BaseModel):
    sub: str
    role: UserRole
    exp: int


class CurrentUser(BaseModel):
    id: str
    role: UserRole


ACCESS_TOKEN_COOKIE_NAME = "access_token"
ALGORITHM = "HS256"


def _decode_token(token: str) -> TokenPayload:
    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[ALGORITHM],
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        token_data = TokenPayload.model_validate(payload)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Optional explicit exp check (jose already validates if present, but we enforce type)
    now = int(datetime.now(tz=timezone.utc).timestamp())
    if token_data.exp < now:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return token_data


def get_current_user(
    access_token: Annotated[str | None, Cookie(alias=ACCESS_TOKEN_COOKIE_NAME)] = None,
) -> CurrentUser:
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token_data = _decode_token(access_token)
    return CurrentUser(id=token_data.sub, role=token_data.role)


def require_roles(*roles: UserRole):
    def dependency(
        current_user: Annotated[CurrentUser, Depends(get_current_user)],
    ) -> CurrentUser:
        if roles and current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return current_user

    return dependency

