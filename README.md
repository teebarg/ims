# Revoque IMS

A production-ready inventory management system for thrift shop operations, built with FastAPI and React. This monorepo application manages bale purchases, sales, payments, customer relationships, and provides comprehensive analytics for multi-channel retail operations.

## Overview

Revoque IMS is designed to streamline thrift shop inventory management by tracking bale purchases (bulk inventory acquisitions), recording sales across multiple channels (Shop, TikTok, Instagram, Website), managing customer relationships, and providing real-time analytics on revenue, costs, and stock levels. The system supports partial payments, delivery tracking, and role-based access control for staff operations.

## Key Features

- **Bale Management**: Track bulk inventory purchases with cost tracking and item categorization
- **Multi-Channel Sales**: Record and manage sales across Shop, TikTok, Instagram, and Website channels
- **Payment Processing**: Support partial and full payments with automatic balance calculation and validation
- **Customer Management**: Customer profiles with multiple identifier types (TikTok, Instagram, Street, Website)
- **Inventory Tracking**: Real-time stock levels at category and total levels with movement tracking
- **Delivery Workflow**: Track delivery status from processing to delivered with assignment and notes
- **Analytics Dashboard**: Sales trends (weekly/monthly), cost vs revenue analysis, top customers, channel distribution
- **Role-Based Access Control**: Three-tier permission system (super-admin, admin, staff)
- **PWA Support**: Progressive Web App capabilities for mobile accessibility

## Technology Stack

### Backend
| Component | Technology |
|-----------|-----------|
| Framework | FastAPI 0.114+ |
| ORM | SQLAlchemy 2.0 |
| Database | PostgreSQL 13+ |
| Migrations | Alembic |
| Authentication | Clerk JWT (RS256) |
| Validation | Pydantic v2 |
| Package Manager | uv |
| Python Version | 3.11+ |

### Frontend
| Component | Technology |
|-----------|-----------|
| Framework | React 18.3 |
| Build Tool | Vite 7 |
| Language | TypeScript |
| Styling | TailwindCSS |
| UI Components | shadcn/ui (Radix UI) |
| State Management | TanStack Query |
| Routing | React Router |
| Authentication | Clerk React |
| Charts | Recharts |
| PWA | vite-plugin-pwa |

### Infrastructure
| Component | Technology |
|-----------|-----------|
| Containerization | Docker |
| Orchestration | docker-compose |
| Reverse Proxy | Traefik |
| Health Checks | HTTP endpoint |
| Process Management | uvicorn |

### Backend Structure

```
backend/
├── app/
│   ├── api/endpoints/    # Route handlers (bales, sales, payments, customers, analytics)
│   ├── core/             # Configuration, security, dependencies, roles
│   ├── db/               # Database session, base model, seed data
│   ├── models/           # SQLAlchemy ORM models
│   ├── schemas/          # Pydantic request/response schemas
│   ├── services/         # Business logic layer
│   └── main.py           # FastAPI application factory
├── alembic.ini           # Migration configuration
├── pyproject.toml        # Python dependencies (uv)
└── Dockerfile*          # Production and dev variants
```

### Frontend Structure

```
frontend/
├── src/
│   ├── components/       # Reusable UI components (shadcn/ui)
│   ├── pages/            # Page-level components (Dashboard, Sales, Analytics)
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions and API client
│   ├── types/            # TypeScript type definitions
│   └── App.tsx           # Root component with routing
├── public/               # Static assets
├── vite.config.ts        # Vite configuration with PWA
└── package.json          # Node.js dependencies
```

## Installation & Local Setup

### Prerequisites

- Python 3.11+
- PostgreSQL 13+
- Node.js 22+
- Docker & docker-compose (for containerized setup)
- uv package manager (recommended for Python)

### Backend Setup

1. **Clone the repository and navigate to the backend**

```bash
cd backend
```

2. **Create and activate virtual environment**

```bash
uv venv .venv
source .venv/bin/activate  # Linux/macOS
.venv\Scripts\Activate.ps1  # Windows PowerShell
```

3. **Install dependencies**

```bash
uv pip install -e .
```

4. **Configure environment variables**

```bash
cp .env.example .env
```

Edit `.env` with your database URL and Clerk configuration:

```env
DATABASE_URL=postgresql+psycopg2://admin:password@localhost:5432/ims
BACKEND_CORS_ORIGINS=["http://localhost:5173"]
CLERK_JWKS_URL="https://your-domain.clerk.accounts.dev/.well-known/jwks.json"
CLERK_ISSUER_URL="https://your-domain.clerk.accounts.dev"
```

5. **Run database migrations**

```bash
alembic upgrade head
```

6. **Start the development server**

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000` with interactive docs at `/docs`.

### Frontend Setup

1. **Navigate to the frontend directory**

```bash
cd frontend
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

```bash
cp .env.example .env
```

Edit `.env` with your Clerk publishable key and API URL:

```env
VITE_CLERK_PUBLISHABLE_KEY="your_clerk_key"
VITE_API_URL="http://localhost:8000"
VITE_APP_NAME="Revoque IMS"
```

4. **Start the development server**

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`.

## Running with Docker

The project includes docker-compose configuration for running the full stack with Traefik reverse proxy.

### Prerequisites

1. **Create external network for Traefik**

```bash
docker network create dev-net
```

2. **Add host entries** (for local development routing)

Add to your `/etc/hosts` (Linux/macOS) or `C:\Windows\System32\drivers\etc\hosts` (Windows):

```
127.0.0.1 ims.localhost
127.0.0.1 api.ims.localhost
```

3. **Build and start the stack**

```bash
docker-compose up --build
```

Or use the Makefile:

```bash
make up
```

4. **Run migrations** (first time setup)

```bash
docker-compose exec backend uv run alembic upgrade head
```

Or use the Makefile:

```bash
make migrate
```

### Access Points

- **Frontend**: `http://ims.localhost:6000`
- **Backend API**: `http://api.ims.localhost:6000`
- **API Documentation**: `http://api.ims.localhost:6000/docs`

### Docker Commands

| Command | Description |
|---------|-------------|
| `make up` | Start all services |
| `make stop` | Stop all services |
| `make build` | Rebuild containers |
| `make migration name=...` | Create new migration |
| `make migrate` | Apply migrations |
| `make downgrade` | Rollback one migration |

## API Overview

The RESTful API is organized by domain with the following main endpoints:

### Core Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check endpoint |
| `/customers` | POST/GET | Create/list customers |
| `/customers/{id}` | GET | Get customer profile with sales history |
| `/categories` | POST/GET | Create/list categories |
| `/bales` | POST/GET | Create/list bale purchases |
| `/sales` | POST/GET/PUT | Create/list/update sales |
| `/sales/{id}/delivery` | PUT | Update delivery status |
| `/payments` | POST | Record payment against sale |
| `/analytics` | GET | Revenue summary |
| `/analytics/trends` | GET | Sales trends (weekly/monthly) |
| `/analytics/stock` | GET | Current stock snapshot |
| `/analytics/top-customers` | GET | Top customers by spend |
| `/analytics/channels` | GET | Sales distribution by channel |
| `/stock` | GET | Real-time inventory levels |

### Authentication

All endpoints (except `/health`) require Clerk JWT authentication via the `Authorization` header:

```
Authorization: Bearer <clerk_jwt_token>
```

The backend validates tokens using JWKS from Clerk with RS256 algorithm and supports role-based access control.

### Response Format

All responses follow consistent JSON structure with appropriate HTTP status codes. The API uses Pydantic for request/response validation ensuring type safety and data integrity.

## Performance & Scalability Considerations

### Database Optimization
- **Indexed Fields**: Primary keys, foreign keys, and frequently queried fields (customer identifiers, sale dates, categories) are indexed
- **Query Optimization**: Service layer uses efficient SQLAlchemy queries with joins and aggregations
- **Connection Pooling**: SQLAlchemy session management with proper connection handling

### Caching Strategy
- **JWKS Caching**: Clerk public keys cached for 1 hour to reduce external API calls
- **PWA Caching**: Service worker implements NetworkFirst strategy for API calls with 24-hour cache for production API
- **React Query**: Frontend implements intelligent caching and background refetching

### Frontend Performance
- **Code Splitting**: Vite provides automatic code splitting and lazy loading
- **Tree Shaking**: Unused code eliminated during build process
- **Asset Optimization**: PWA assets generated with optimal sizes

### Docker Optimization
- **Multi-stage Builds**: Backend uses multi-stage Docker builds to minimize image size
- **Layer Caching**: uv cache mounted to speed up dependency installation
- **Health Checks**: Container health checks ensure reliable service discovery

## Security Features

### Authentication & Authorization
- **Clerk Integration**: Industry-standard JWT authentication with RS256 signing
- **JWKS Validation**: Dynamic public key verification with caching
- **Role-Based Access Control**: Three-tier permission system (super-admin, admin, staff)
- **Protected Routes**: Frontend route guards for role-based UI access

### Data Security
- **Environment Variables**: Sensitive configuration stored in environment files
- **SQL Injection Prevention**: SQLAlchemy ORM with parameterized queries
- **Input Validation**: Pydantic schemas validate all incoming data
- **CORS Configuration**: Configurable allowed origins for cross-origin requests

### Infrastructure Security
- **HTTPS Enforcement**: Traefik redirects HTTP to HTTPS in production
- **Container Isolation**: Docker containers run with minimal privileges
- **Secrets Management**: Environment-based configuration without hardcoded secrets

## Testing

The project includes pytest for backend testing:

```bash
cd backend
pytest
```

Current test coverage includes:
- Health check endpoint validation
- Analytics endpoint testing

Test infrastructure can be extended with:
- Database fixtures for isolated test environments
- API endpoint integration tests
- Service layer unit tests

## Future Improvements

### Backend Enhancements
- [ ] Comprehensive test coverage with pytest fixtures
- [ ] API rate limiting and throttling
- [ ] Async database operations for improved concurrency
- [ ] Background task processing (Celery/Redis)
- [ ] Audit logging for sensitive operations
- [ ] Database read replicas for analytics queries

### Frontend Enhancements
- [ ] E2E testing with Playwright
- [ ] Offline-first capabilities with enhanced PWA features
- [ ] Real-time updates with WebSocket integration
- [ ] Advanced analytics visualizations
- [ ] Mobile app development (React Native)

### Infrastructure Enhancements
- [ ] CI/CD pipeline with GitHub Actions
- [ ] Production deployment configuration (Kubernetes/Docker Swarm)
- [ ] Monitoring and observability (Prometheus/Grafana)
- [ ] Centralized logging (ELK stack)
- [ ] Automated backups and disaster recovery

## License

This project is proprietary software. All rights reserved.

## Contributing

This is a private project. For questions or support, please contact the development team directly.
