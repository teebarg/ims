from fastapi import Depends, HTTPException
from app.core.deps import get_current_user


async def require_user(user=Depends(get_current_user)):
    return user


async def require_admin(user=Depends(get_current_user)):
    role = user.get("public_metadata", {}).get("role")

    if role not in ["admin", "super-admin"]:
        raise HTTPException(403, "Admin required")

    return user


async def require_super_admin(user=Depends(get_current_user)):
    role = user.get("public_metadata", {}).get("role")

    if role != "super-admin":
        raise HTTPException(403, "Super admin required")

    return user