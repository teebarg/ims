# import jwt
from fastapi import Depends, HTTPException
from app.core.config import settings
import time
import httpx
from jose import jwt
from fastapi import Request, HTTPException

CLERK_JWKS_URL = "https://pretty-shrew-80.clerk.accounts.dev/.well-known/jwks.json"

JWKS_CACHE = None
JWKS_CACHE_EXP = 0


async def get_jwks():
    global JWKS_CACHE, JWKS_CACHE_EXP

    # refresh every hour
    if JWKS_CACHE and time.time() < JWKS_CACHE_EXP:
        return JWKS_CACHE

    async with httpx.AsyncClient() as client:
        resp = await client.get(CLERK_JWKS_URL)
        JWKS_CACHE = resp.json()
        JWKS_CACHE_EXP = time.time() + 3600

    return JWKS_CACHE


async def get_current_user(request: Request):
    auth = request.headers.get("Authorization")
    if not auth:
        raise HTTPException(401, "Missing Authorization header")

    token = auth.split(" ")[1]

    jwks = await get_jwks()

    try:
        payload = jwt.decode(
            token,
            jwks,
            algorithms=["RS256"],
            issuer="https://pretty-shrew-80.clerk.accounts.dev",
            options={"verify_aud": False},
        )
        print("🚀 ~ file: deps.py:41 ~ payload:", payload)
    except Exception:
        raise HTTPException(401, "Invalid or expired token")

    return payload

# CurrentUser = Depends(get_current_user)
# AdminUser = Depends(require_roles(["admin", "super-admin"]))
# SuperAdminUser = Depends(require_roles(["super-admin"]))
