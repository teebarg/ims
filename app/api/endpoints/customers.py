from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import UserRole, require_roles
from app.db.session import get_db
from app.schemas.customer import CustomerCreate, CustomerResponse
from app.schemas.sale import SaleRead
from app.services.customers import (
    calculate_customer_balance,
    calculate_customer_lifetime_value,
    create_customer,
    get_customer,
    get_customer_sales,
    list_customers,
)


router = APIRouter()


@router.post("/", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer_endpoint(
    customer_in: CustomerCreate,
    db: Session = Depends(get_db),
    _: None = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF)),
) -> CustomerResponse:
    try:
        return create_customer(db, customer_in)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/", response_model=list[CustomerResponse])
def list_customers_endpoint(db: Session = Depends(get_db)) -> list[CustomerResponse]:
    return list_customers(db)


@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer_endpoint(
    customer_id: UUID, db: Session = Depends(get_db)
) -> CustomerResponse:
    customer = get_customer(db, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.get("/{customer_id}/sales", response_model=list[SaleRead])
def get_customer_sales_endpoint(
    customer_id: UUID, db: Session = Depends(get_db)
) -> list[SaleRead]:
    return get_customer_sales(db, customer_id)


@router.get("/{customer_id}/balance")
def get_customer_balance_endpoint(
    customer_id: UUID, db: Session = Depends(get_db)
) -> dict:
    balance = calculate_customer_balance(db, customer_id)
    return {"customer_id": str(customer_id), "balance": balance}


@router.get("/{customer_id}/lifetime_value")
def get_customer_ltv_endpoint(
    customer_id: UUID, db: Session = Depends(get_db)
) -> dict:
    ltv = calculate_customer_lifetime_value(db, customer_id)
    return {"customer_id": str(customer_id), "lifetime_value": ltv}

