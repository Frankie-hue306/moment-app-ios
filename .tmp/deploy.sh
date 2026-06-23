#!/bin/bash
set -e
echo "=== MOMENT SERVER DEPLOY ==="
apt-get update -qq
apt-get install -y -qq nodejs npm nginx git
node -v && npm -v
mkdir -p /opt/moment
echo "DEPLOY-READY"
