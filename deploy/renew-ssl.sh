#!/bin/bash
set -e

cd /home/ec2-user/road_book_backend

CERTBOT_ARGS=()

if [[ "${1:-}" == "--dry-run" ]]; then
    CERTBOT_ARGS+=(--dry-run)
fi

docker run --rm \
    -v road_book_backend_certbot_www:/var/www/certbot \
    -v road_book_backend_certbot_conf:/etc/letsencrypt \
    certbot/certbot renew \
    --webroot \
    --webroot-path=/var/www/certbot \
    "${CERTBOT_ARGS[@]}"

docker compose \
    --env-file .env \
    -f docker-compose.yml \
    exec -T nginx nginx -s reload