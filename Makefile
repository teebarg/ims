# --- Variables ---
APP_NAME = ims
IMAGE_TAG ?= latest
DOCKER_USER ?= beafdocker

# Use Compose service names here to match your docker-compose.yml
BACKEND_SERVICE = backend
FRONTEND_SERVICE = frontend

DOCKER_COMPOSE = docker compose -p $(APP_NAME)

.PHONY: help
help:
	@echo "Common commands:"
	@echo "  make migration name=...- create new Alembic migration"
	@echo "  make migrate           - run Alembic migrations (upgrade head)"
	@echo "  make downgrade         - downgrade Alembic one revision"
	@echo "  make build             - build Docker image"
	@echo "  make push              - push Docker image to Docker Hub"
	@echo "  make up                - start app + db via docker-compose"
	@echo "  make stop              - stop docker-compose services"

# --- Environment Controls ---
.PHONY: build
build:
	$(DOCKER_COMPOSE) build

.PHONY: up
up:
	$(DOCKER_COMPOSE) up

.PHONY: up-d
up-d:
	$(DOCKER_COMPOSE) up -d

.PHONY: stop
stop:
	$(DOCKER_COMPOSE) stop

.PHONY: update
update:
	$(DOCKER_COMPOSE) up -d --build --force-recreate $(s)

# --- Database & Migrations (Routed through uv) ---
.PHONY: migration
migration:
	@if [ -z "$(name)" ]; then \
		echo "Error: 'name' is required. Usage: make migration name=add_users_table"; \
		exit 1; \
	fi
	$(DOCKER_COMPOSE) exec $(BACKEND_SERVICE) uv run alembic revision --autogenerate -m "$(name)"

.PHONY: migrate
migrate:
	$(DOCKER_COMPOSE) exec $(BACKEND_SERVICE) uv run alembic upgrade head

.PHONY: downgrade
downgrade:
	$(DOCKER_COMPOSE) exec $(BACKEND_SERVICE) uv run alembic downgrade -1

.PHONY: seed
seed:
	$(DOCKER_COMPOSE) exec $(BACKEND_SERVICE) uv run python app/db/seed.py

# --- Production Image Building & Pushing ---
.PHONY: build-prod
build-prod:
	docker build --platform linux/amd64 -t $(DOCKER_USER)/$(APP_NAME)-backend:$(IMAGE_TAG) ./backend

.PHONY: push
push:
	docker push $(DOCKER_USER)/$(APP_NAME)-backend:$(IMAGE_TAG)
