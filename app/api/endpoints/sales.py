from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import UserRole, require_roles
from app.db.session import get_db
from app.schemas.sale import SaleCreate, SaleRead
from app.services.sales import create_sale


router = APIRouter()


@router.post("/", response_model=SaleRead, status_code=status.HTTP_201_CREATED)
def record_sale(
    sale_in: SaleCreate,
    db: Session = Depends(get_db),
    _: None = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF)),
) -> SaleRead:
    try:
        sale = create_sale(db, sale_in)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return sale


