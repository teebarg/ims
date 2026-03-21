APP_NAME=ims
IMAGE_NAME?=$(APP_NAME)
IMAGE_TAG?=latest
DOCKER_USER?=beafdocker
DOCKER_COMPOSE = docker compose
CONTAINER_NAME = ims-api

.PHONY: help
help:
	@echo "Common commands:"
	@echo "  make venv              - create virtual environment with uv"
	@echo "  make install           - install dependencies with uv"
	@echo "  make run               - run FastAPI app with uvicorn"
	@echo "  make test              - run tests"
	@echo "  make migration name=...- create new Alembic migration"
	@echo "  make migrate           - run Alembic migrations (upgrade head)"
	@echo "  make downgrade         - downgrade Alembic one revision"
	@echo "  make build             - build Docker image"
	@echo "  make push              - push Docker image to Docker Hub"
	@echo "  make up                - start app + db via docker-compose"
	@echo "  make down              - stop docker-compose services"
	@echo ""
	@echo "Frontend (Vite/React):"
	@echo "  make fe-install        - install frontend dependencies (npm install)"
	@echo "  make fe-dev            - run frontend dev server (vite)"
	@echo "  make fe-build          - build frontend for production"
	@echo "  make fe-preview        - preview production frontend build"
	@echo "  make fe-lint           - run frontend lint"

.PHONY: venv
venv:
	uv venv .venv

.PHONY: install
install:
	uv pip install -e .

.PHONY: run
run:
	uvicorn app.main:app --reload

.PHONY: test
test:
	pytest

.PHONY: migration
migration:
	@if [ -z "$(name)" ]; then \
		echo "Usage: make migration name=short_description"; \
		exit 1; \
	fi
	$(DOCKER_COMPOSE) -p $(APP_NAME) exec $(CONTAINER_NAME) alembic revision -m "$(name)"

.PHONY: migrate
migrate:
	$(DOCKER_COMPOSE) -p $(APP_NAME) exec $(CONTAINER_NAME) alembic upgrade head

.PHONY: downgrade
downgrade:
	$(DOCKER_COMPOSE) -p $(APP_NAME) exec $(CONTAINER_NAME) alembic downgrade -1

.PHONY: seed
seed:
	$(DOCKER_COMPOSE) -p $(APP_NAME) exec $(CONTAINER_NAME) python app/db/seed.py

.PHONY: build
build:
	docker build -t $(IMAGE_NAME):$(IMAGE_TAG) .

.PHONY: push
push:
	@if [ -z "$(DOCKER_USER)" ]; then \
		echo "Set DOCKER_USER to your Docker Hub username, e.g. 'make push DOCKER_USER=myuser'"; \
		exit 1; \
	fi
	docker tag $(IMAGE_NAME):$(IMAGE_TAG) $(DOCKER_USER)/$(IMAGE_NAME):$(IMAGE_TAG)
	docker push $(DOCKER_USER)/$(IMAGE_NAME):$(IMAGE_TAG)

.PHONY: up
up:
	docker compose up --build

.PHONY: update
update:
	docker compose -p $(APP_NAME) up -d --force-recreate $(s)

.PHONY: down
down:
	docker compose down

# Frontend (Vite/React)
FE_DIR = frontend

.PHONY: fe-install
fe-install:
	cd $(FE_DIR) && npm install

.PHONY: fe-dev
fe-dev:
	cd $(FE_DIR) && npm run dev

.PHONY: fe-build
fe-build:
	cd $(FE_DIR) && npm run build

.PHONY: fe-preview
fe-preview:
	cd $(FE_DIR) && npm run preview

.PHONY: fe-lint
fe-lint:
	cd $(FE_DIR) && npm run lint

