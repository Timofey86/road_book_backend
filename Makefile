.ONESHELL:
SHELL := /bin/bash

DIR := $(shell dirname $(realpath $(firstword $(MAKEFILE_LIST))))

LOCAL_COMPOSE := docker compose \
	--env-file $(DIR)/.env \
	--env-file $(DIR)/.env.local \
	-f $(DIR)/docker-compose.local.yml

PROD_COMPOSE := docker compose \
	--env-file $(DIR)/.env \
	-f $(DIR)/docker-compose.yml

.PHONY: \
	local-build local-up local-down local-restart local-logs local-ps local-reset local-config \
	app-shell app-shell-root \
	prisma-generate prisma-studio prisma-seed migrate-dev migrate-deploy seed-deploy prod-reset \
	prod-build prod-up prod-down prod-restart prod-logs prod-ps prod-config prod-db-up

# =========================
# Local
# =========================

local-build:
	$(LOCAL_COMPOSE) up -d --build
local-up:
	$(LOCAL_COMPOSE) up -d

local-down:
	$(LOCAL_COMPOSE) down

local-restart:
	$(LOCAL_COMPOSE) down
	$(LOCAL_COMPOSE) up -d --build

local-logs:
	$(LOCAL_COMPOSE) logs -f app

local-ps:
	$(LOCAL_COMPOSE) ps

local-reset:
	$(LOCAL_COMPOSE) down -v

local-config:
	$(LOCAL_COMPOSE) config

# =========================
# App
# =========================

app-shell:
	$(LOCAL_COMPOSE) exec app sh

app-shell-root:
	$(LOCAL_COMPOSE) exec -u root app sh

# =========================
# Prisma
# =========================

prisma-generate:
	$(LOCAL_COMPOSE) exec app npm run prisma:generate

prisma-studio:
	$(LOCAL_COMPOSE) exec app npx prisma studio --hostname 0.0.0.0 --port $(PRISMA_STUDIO_PORT)

prisma-seed:
	$(LOCAL_COMPOSE) exec app npx prisma db seed

migrate-dev:
	$(LOCAL_COMPOSE) exec app npm run prisma:migrate:dev

migrate-deploy:
	$(PROD_COMPOSE) run --rm app npm run prisma:migrate:deploy

seed-deploy:
	$(PROD_COMPOSE) run --rm \
    		-e ALLOW_PRODUCTION_SEED=true \
    		-e SEED_USER_PASSWORD="$(SEED_USER_PASSWORD)" \
    		app node dist/prisma/seed.js

# =========================
# Production
# =========================

prod-build:
	$(PROD_COMPOSE) build

prod-db-up:
	$(PROD_COMPOSE) up -d mysql redis

prod-up:
	$(PROD_COMPOSE) up -d --build

prod-down:
	$(PROD_COMPOSE) down

prod-reset:
	$(PROD_COMPOSE) down -v

prod-restart:
	$(PROD_COMPOSE) down
	$(PROD_COMPOSE) up -d --build

prod-logs:
	$(PROD_COMPOSE) logs -f app

prod-ps:
	$(PROD_COMPOSE) ps

prod-config:
	$(PROD_COMPOSE) config
