APP_NAME=ims
IMAGE_NAME?=$(APP_NAME)
IMAGE_TAG?=latest
DOCKER_USER?=beafdocker

PYTHON?=python

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
	alembic revision -m "$(name)"

.PHONY: migrate
migrate:
	alembic upgrade head

.PHONY: downgrade
downgrade:
	alembic downgrade -1

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

.PHONY: down
down:
	docker compose down

