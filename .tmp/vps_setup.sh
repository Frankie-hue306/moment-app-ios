#!/bin/bash
exec > /root/deploy.log 2>&1
set -e
echo "=== MOMENT SERVER SETUP ==="
echo "Update packages..."
apt-get update -qq
echo "Install Node.js, NPM, Nginx, Git..."
apt-get install -y -qq nodejs npm nginx git
echo "Node: $(node -v)"
echo "NPM: $(npm -v)"
echo "DEPLOY-COMPLETE"
