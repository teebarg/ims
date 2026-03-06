## Revoque IMS API

FastAPI microservice for managing Revoquue bales, sales, payments, inventory stock, and analytics.

### Features

- **Bales**: track purchased bales with category, cost, and item counts.
- **Sales**: record sales by bale, category, channel, and user or guest.
- **Payments**: support partial and full payments with automatic balance calculation.
- **Inventory stock**: category-level and total stock using inventory movements.
- **Analytics**: profit per bale, weekly/monthly sales trends, and simple stock turnover.

---

### Requirements

- Python **3.11+**
- PostgreSQL **13+**
- `uv` package manager (recommended)

Install `uv` (once) if you don't have it:

```bash
pip install uv
```

---

### Project Structure (monorepo)

- **Backend (FastAPI)**
  - `app/main.py` – FastAPI application factory and router registration.
  - `app/api/endpoints/` – route handlers (`bales.py`, `sales.py`, `payments.py`, `customers.py`, `analytics.py`).
  - `app/models/` – SQLAlchemy models.
  - `app/schemas/` – Pydantic request/response schemas.
  - `app/services/` – business logic for bales, sales, payments, customers, analytics.
  - `app/db/` – DB session and base model.
  - `app/core/` – config and security (JWT + role-based auth).
  - `migrations/` – Alembic migrations (configured with `alembic.ini`).
  - `tests/` – backend tests.

- **Frontend (React + Vite)**
  - `frontend/` – React SPA that talks to the FastAPI API.
  - `frontend/src/App.tsx` – starter dashboard view.
  - `frontend/vite.config.ts` – dev server with `/api` proxy → FastAPI `api` service.

---

### Environment configuration

1. Copy the example env file:

```bash
cp .env.example .env
```

2. Adjust values as needed:

- **DATABASE_URL** – e.g. `postgresql+psycopg2://admin:password@localhost:5432/shop`

---

### Local development setup (with `uv`)

From the project root:

1. **Create and activate a virtual environment**

```bash
uv venv .venv
```

On Linux/macOS:

```bash
source .venv/bin/activate
```

On Windows (PowerShell):

```powershell
.venv\Scripts\Activate.ps1
```

2. **Install dependencies using `uv`**

```bash
uv pip install -e .
```

3. **Create the database (if needed)**

Ensure PostgreSQL is running and the database referenced in `DATABASE_URL` exists.

---

### Running Alembic migrations

With your virtual environment active and `.env` configured:

```bash
alembic upgrade head
```

This applies the example migration in `migrations/versions/0001_initial_tables.py` which creates:

- `bale`
- `sale`
- `payment`
- `inventorystock`

---

### Starting the FastAPI app (local)

With the virtual environment active:

```bash
uvicorn app.main:app --reload
```

The API will be available at:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

Health check:

```bash
curl http://localhost:8000/health
```

---

### Running with Docker and docker-compose (backend + frontend)

1. Ensure Docker and docker-compose are installed.

2. Add host entries (for Traefik routing):

On your host machine’s `hosts` file:

```text
127.0.0.1 ims.localhost
127.0.0.1 ims-ui.localhost
127.0.0.1 adminer.localhost
```

3. Build and start the stack:

```bash
docker-compose up --build
```

This will:

- Start a PostgreSQL container (`db`) with default credentials.
- Build and start the FastAPI app container (`api`).
- Start the React dev server (`frontend`) behind Traefik.

3. Run database migrations inside the API container (optional, if not pre-run):

```bash
docker-compose exec api alembic upgrade head
```

4. Access the stack:

- Backend via Traefik: `http://ims.localhost:6000`
- Frontend via Traefik: `http://ims-ui.localhost:6000`
- Adminer DB UI: `http://adminer.localhost:6000`

---

### Sample endpoints

- **POST `/bales`** – Add a new bale.
- **POST `/sales`** – Record a sale (registered user via `user_id` or guest via `guest_name`/`guest_contact`).
- **POST `/payments`** – Record a partial or full payment towards a sale.
- **GET `/stock`** – Retrieve current stock (total + category level).
- **GET `/analytics`** – Summary (profit, turnover, profit per bale).
- **GET `/analytics/trends?period=weekly|monthly`** – Sales trends over time.

Partial payments and balances are handled automatically based on the total sale amount and cumulative payments. Payments that exceed the remaining balance are rejected.

---

### Running tests

With the virtual environment active:

```bash
pytest
```

This will run basic health-check tests and can be extended with more endpoint tests as you build out the service.

