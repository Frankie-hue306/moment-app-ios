#!/bin/bash
# Updates the tunnel URL on GitHub Pages every 5 minutes
while true; do
  DOMAIN=$(grep -oE '[a-z0-9]+\.lhr\.life' /tmp/tunnel_v4.txt 2>/dev/null | tail -1)
  if [ -n "$DOMAIN" ]; then
    echo "{\"url\": \"https://$DOMAIN\"}" > /tmp/tunnel.json
    cd /Users/zz/.easyclaw/workspace
    cp /tmp/tunnel.json tunnel.json
    git add tunnel.json 2>/dev/null
    git commit -m "Update tunnel URL" 2>/dev/null
    git push origin main 2>/dev/null
  fi
  sleep 300
done
