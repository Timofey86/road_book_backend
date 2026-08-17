.ONESHELL:
SHELL := /bin/bash

DIR := $(shell dirname $(realpath $(firstword $(MAKEFILE_LIST))))

include $(DIR)/.env
-include $(DIR)/.env.local

export

LOCAL_COMPOSE := docker compose -f $(DIR)/docker-compose.local.yml
PROD_COMPOSE := docker compose -f $(DIR)/docker-compose.yml

.PHONY: local-up local-down local-restart local-logs local-ps local-reset \
        app-shell prisma-generate prisma-studio migrate-dev migrate-deploy \
        prod-up prod-down prod-restart prod-logs prod-ps local-config app-shell-root \
        local-build


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

app-shell:
	$(LOCAL_COMPOSE) exec app sh

app-shell-root:
	$(LOCAL_COMPOSE) exec -u root app sh

prisma-generate:
	$(LOCAL_COMPOSE) exec app npm run prisma:generate

prisma-studio:
	$(LOCAL_COMPOSE) exec app npx prisma studio --hostname 0.0.0.0 --port $(PRISMA_STUDIO_PORT)

migrate-dev:
	$(LOCAL_COMPOSE) exec app npm prisma:migrate:dev

migrate-deploy:
	$(PROD_COMPOSE) exec app npm prisma:migrate:deploy

prod-up:
	$(PROD_COMPOSE) up -d --build

prod-down:
	$(PROD_COMPOSE) down

prod-restart:
	$(PROD_COMPOSE) down
	$(PROD_COMPOSE) up -d --build

prod-logs:
	$(PROD_COMPOSE) logs -f app

prod-ps:
	$(PROD_COMPOSE) ps
