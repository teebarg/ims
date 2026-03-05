from __future__ import annotations

from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.core.security import (
    ACCESS_TOKEN_COOKIE_NAME,
    ACCESS_TOKEN_EXPIRES_MINUTES,
    UserRole,
    create_access_token,
    get_current_user,
)
from app.db.session import get_db
from app.schemas.user import UserCreate, UserLoginRequest, UserRead
from app.services.users import (
    any_users_exist,
    create_user,
    get_user_by_email,
    verify_password,
)


router = APIRouter()


@router.post("/login", response_model=UserRead)
def login(
    credentials: UserLoginRequest,
    response: Response,
    db: Session = Depends(get_db),
) -> UserRead:
    user = get_user_by_email(db, credentials.email)
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user",
        )

    access_token = create_access_token(
        subject=str(user.id),
        role=user.role,
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRES_MINUTES),
    )

    response.set_cookie(
        key=ACCESS_TOKEN_COOKIE_NAME,
        value=access_token,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=ACCESS_TOKEN_EXPIRES_MINUTES * 60,
    )

    return UserRead.model_validate(user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response) -> None:
    response.delete_cookie(ACCESS_TOKEN_COOKIE_NAME)


@router.get("/me", response_model=UserRead)
def get_me(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserRead:
    from app.models.user import User  # local import to avoid circular

    user = db.get(User, current_user.id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return UserRead.model_validate(user)


@router.post(
    "/bootstrap-super-admin",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
)
def bootstrap_super_admin(
    user_in: UserCreate,
    db: Session = Depends(get_db),
) -> UserRead:
    """
    One-time endpoint to create the first SUPER_ADMIN user.
    It is open only while no users exist; afterwards it returns 403.
    """

    if any_users_exist(db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bootstrap already completed",
        )

    user_in.role = UserRole.SUPER_ADMIN
    return create_user(db, user_in)

