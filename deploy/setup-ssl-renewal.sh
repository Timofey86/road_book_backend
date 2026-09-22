#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Installing RoadBook SSL renewal service..."

sudo cp "$PROJECT_DIR/deploy/roadbook-certbot.service" \
    /etc/systemd/system/roadbook-certbot.service

sudo cp "$PROJECT_DIR/deploy/roadbook-certbot.timer" \
    /etc/systemd/system/roadbook-certbot.timer

sudo systemctl daemon-reload
sudo systemctl enable --now roadbook-certbot.timer

echo "SSL renewal timer installed successfully."