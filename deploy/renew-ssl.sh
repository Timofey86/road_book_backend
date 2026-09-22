#!/bin/bash
set -e

cd /home/ec2-user/road_book_backend

docker run --rm \
  -v road_book_backend_certbot_www:/var/www/certbot \
  -v road_book_backend_certbot_conf:/etc/letsencrypt \
  certbot/certbot renew \
  --webroot \
  --webroot-path=/var/www/certbot

docker compose \
  --env-file .env \
  -f docker-compose.yml \
  exec -T nginx nginx -s reload