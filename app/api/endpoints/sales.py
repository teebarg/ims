from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import UserRole, require_roles
from app.db.session import get_db
from app.schemas.sale import SaleCreate, SaleDeliveryUpdate, SaleRead
from app.services.sales import (
    create_sale,
    enrich_sales_with_payments,
    get_sale,
    list_sales,
    update_sale_delivery,
)


router = APIRouter()


@router.get("/", response_model=list[SaleRead])
def get_sales(db: Session = Depends(get_db)) -> list[SaleRead]:
    return list_sales(db)


@router.get("/{sale_id}", response_model=SaleRead)
def get_sale_by_id(
    sale_id: int,
    db: Session = Depends(get_db),
) -> SaleRead:
    sale = get_sale(db, sale_id)
    if sale is None:
        raise HTTPException(status_code=404, detail="Sale not found")
    return enrich_sales_with_payments(db, [sale])[0]


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


@router.patch("/{sale_id}/delivery", response_model=SaleRead)
def update_delivery(
    sale_id: int,
    delivery_in: SaleDeliveryUpdate,
    db: Session = Depends(get_db),
    _: None = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF)),
) -> SaleRead:
    try:
        return update_sale_delivery(db, sale_id, delivery_in)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


