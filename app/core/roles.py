from fastapi import Depends, HTTPException
from clerk_auth import get_current_user


def require_roles(allowed_roles: list[str]):
    async def checker(user=Depends(get_current_user)):
        role = user.get("public_metadata", {}).get("role")

        if role not in allowed_roles:
            raise HTTPException(403, "Not authorized")

        return user

    return checker