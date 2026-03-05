from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import UserRole, require_roles
from app.db.session import get_db
from app.schemas.bale import BaleCreate, BaleRead
from app.services.bales import create_bale, list_bales


router = APIRouter()


@router.post("/", response_model=BaleRead, status_code=status.HTTP_201_CREATED)
def add_bale(
    bale_in: BaleCreate,
    db: Session = Depends(get_db),
    _: None = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF)),
) -> BaleRead:
    bale = create_bale(db, bale_in)
    if not bale:
        raise HTTPException(status_code=400, detail="Unable to create bale")
    return bale


@router.get("/", response_model=list[BaleRead])
def get_bales(db: Session = Depends(get_db)) -> list[BaleRead]:
    return list_bales(db)

