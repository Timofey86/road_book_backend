# RoadBook Backend

Backend API for **RoadBook** --- a web application for planning and
sharing road trips.

RoadBook allows users to create routes, add and reorder stops,
automatically build routes using an external routing service, upload
photos, comment on routes, like them, and save them to favorites.

## Tech Stack

-   NestJS
-   TypeScript
-   Prisma ORM
-   MySQL
-   Redis
-   Docker / Docker Compose
-   MinIO for local S3-compatible object storage
-   AWS S3 for production object storage
-   OpenRouteService / HeiGIT APIs for geocoding and routing
-   JWT authentication with HTTP-only cookies
-   Swagger / OpenAPI
-   `nestjs-i18n`

## Features

-   User registration and authentication
-   Access and refresh tokens via HTTP-only cookies
-   User profiles and avatars
-   Route CRUD
-   Unique route slugs
-   Route tags
-   Route stops and stop reordering
-   Place search and geocoding
-   Automatic route calculation
-   Distance and duration calculation
-   Route geometry storage
-   Route cover images and photo gallery
-   Comments
-   Likes
-   Favorites
-   Pagination, filtering and sorting
-   RU / EN error localization
-   Request IDs and structured HTTP logging
-   Swagger API documentation
-   Postman collection
-   Demo data seeding

## API Documentation

After starting the application, Swagger UI is available at:

``` text
http://localhost:${APP_EXTERNAL_PORT}/api/docs
```

## Docker Setup

### First setup

Create local environment files from the provided examples:

``` bash
cp .env.example .env
cp .env.local.example .env.local
```

The included `prisma/schema.prisma` is already configured for MySQL.
There is no need to run `prisma init`.

### Local development

``` bash
make local-up
make local-logs
```

Other useful commands:

``` bash
make local-build
make local-ps
make local-down
make local-restart
make local-config
make local-reset
```

> `make local-reset` removes Docker volumes, including local database
> data.

Available locally:

-   NestJS: `http://localhost:${APP_EXTERNAL_PORT}`
-   MySQL: `localhost:${MYSQL_EXTERNAL_PORT}`
-   Redis: `localhost:${REDIS_EXTERNAL_PORT}`
-   MinIO API: `http://localhost:${MINIO_EXTERNAL_PORT}`
-   MinIO Console: `http://localhost:${MINIO_CONSOLE_EXTERNAL_PORT}`
-   Swagger: `http://localhost:${APP_EXTERNAL_PORT}/api/docs`

The exact ports are configured in the environment files.

### Application shell

``` bash
make app-shell
```

Root shell:

``` bash
make app-shell-root
```

## Prisma

Generate Prisma Client:

``` bash
make prisma-generate
```

Create/apply a development migration:

``` bash
make migrate-dev
```

Run Prisma Studio:

``` bash
make prisma-studio
```

Then open:

``` text
http://localhost:${PRISMA_STUDIO_EXTERNAL_PORT}
```

Seed the development database with demo data:

``` bash
make prisma-seed
```

> **Warning:** the seed script recreates demo data and should only be
> used with a development database.

Commit both the Prisma schema and migrations to Git:

``` text
prisma/schema.prisma
prisma/migrations/
```

## Demo Data

The Prisma seed creates demo users, tags, routes, stops, comments, likes
and favorites, and uploads demo images to the configured S3-compatible
storage.

Seed image assets are stored under:

``` text
prisma/seed-assets/
├── avatars/
└── routes/
```

Run the seed with:

``` bash
make prisma-seed
```

## Postman

A Postman collection with prepared API requests is included in the
repository.

Import the collection into Postman and configure its collection
variable:

``` text
base_url = http://localhost:${APP_EXTERNAL_PORT}/api
```

Additional variables such as `route_id` and `user_id` can be used for
requests that work with specific resources.

Authentication uses HTTP-only cookies. After a successful login, Postman
stores the `access_token` and `refresh_token` cookies automatically.

## Authentication

RoadBook uses JWT authentication with HTTP-only cookies:

-   `access_token` --- short-lived access token
-   `refresh_token` --- refresh token used to obtain a new access token

Protected endpoints require a valid authentication cookie.

## Internationalization

API error messages support English (`en`) and Russian (`ru`).

The language can be selected using the `Accept-Language` request header.
English is used as the fallback language.

## File Storage

For local development, RoadBook uses **MinIO** as an S3-compatible
object storage service.

It stores user avatars, route cover images and route photos.

Production uses **AWS S3** instead of MinIO.

## External Services

RoadBook integrates with external services for place search/geocoding
and route calculation.

The required API URLs and keys are configured through environment
variables.

Do not commit real API keys or production secrets to Git.

## Production

The production Docker Compose configuration runs the NestJS application,
MySQL and Redis.

MinIO is not included in production; object storage is provided by AWS
S3.

``` bash
make prod-up
make prod-logs
make prod-ps
```

To restart or stop production containers:

``` bash
make prod-restart
make prod-down
```

For production, replace all example secrets in `.env`.

For AWS S3, using an EC2 IAM role is preferable to permanent S3 access
keys.

## Environment Variables

Environment configuration includes settings for:

-   application and exposed ports
-   MySQL
-   Redis
-   JWT access and refresh tokens
-   S3 / MinIO
-   OpenRouteService API
-   default language

Use `.env.example` and `.env.local.example` as templates.

Never commit real secrets, API keys, passwords or production
credentials.

## Development Status

The main RoadBook backend functionality is implemented and tested.

The current development focus is frontend integration.

Centralized Elasticsearch/Kibana logging is planned as a later
infrastructure step.
