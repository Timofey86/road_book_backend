#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

if [[ -z "${SSL_EMAIL:-}" ]]; then
    echo "ERROR: SSL_EMAIL is not set."
    echo "Usage: SSL_EMAIL=your@email.com ./deploy/init-ssl.sh"
    exit 1
fi

set -a
source .env
set +a

if [[ -z "${API_DOMAIN:-}" ]]; then
    echo "ERROR: API_DOMAIN is not set in .env"
    exit 1
fi

echo "Initializing SSL for ${API_DOMAIN}..."

echo "Starting nginx with temporary HTTP configuration..."

docker compose \
    --env-file .env \
    -f docker-compose.yml \
    run -d \
    --name roadbook_nginx_ssl_init \
    --no-deps \
    -p 80:80 \
    -v "$PROJECT_DIR/docker/nginx/init-ssl.conf.template:/etc/nginx/templates/default.conf.template:ro" \
    nginx

cleanup() {
    echo "Removing temporary nginx..."
    docker rm -f roadbook_nginx_ssl_init >/dev/null 2>&1 || true
}

trap cleanup EXIT

echo "Requesting Let's Encrypt certificate..."

docker run --rm \
    -v road_book_backend_certbot_www:/var/www/certbot \
    -v road_book_backend_certbot_conf:/etc/letsencrypt \
    certbot/certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --domain "$API_DOMAIN" \
    --email "$SSL_EMAIL" \
    --agree-tos \
    --no-eff-email \
    --non-interactive

cleanup
trap - EXIT

echo "Starting production nginx with HTTPS..."

docker compose \
    --env-file .env \
    -f docker-compose.yml \
    up -d nginx

echo "SSL initialized successfully."
echo "https://${API_DOMAIN}"