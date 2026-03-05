from fastapi import FastAPI

from app.api.endpoints import analytics, auth, bales, customers, payments, sales, users


def create_application() -> FastAPI:
    app = FastAPI(
        title="Thrift Shop Inventory API",
        version="0.1.0",
        description=(
            "FastAPI microservice for thrift shop inventory, bales, sales, "
            "customers, payments, and analytics."
        ),
    )

    app.include_router(auth.router, prefix="/auth", tags=["auth"])
    app.include_router(users.router, prefix="/users", tags=["users"])
    app.include_router(customers.router, prefix="/customers", tags=["customers"])
    app.include_router(bales.router, prefix="/bales", tags=["bales"])
    app.include_router(sales.router, prefix="/sales", tags=["sales"])
    app.include_router(payments.router, prefix="/payments", tags=["payments"])
    app.include_router(analytics.router, prefix="/analytics", tags=["analytics"])

    app.add_api_route(
        "/stock",
        analytics.analytics_stock,
        methods=["GET"],
        tags=["stock"],
        name="get_stock",
    )

    @app.get("/health", tags=["health"])
    def health_check() -> dict:
        return {"status": "ok"}

    return app


app = create_application()

