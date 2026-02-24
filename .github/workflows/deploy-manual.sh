#!/bin/bash
# Manual deployment script for Web/Frontend
# Usage: ./deploy-manual.sh

set -e  # Exit on error

echo "🚀 Starting manual Web deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Navigate to Web directory
cd /srv/docker/web/FrontEnd

echo -e "${YELLOW}📥 Pulling latest code from production branch...${NC}"
git fetch origin
git reset --hard origin/production

# Navigate to docker directory
cd /srv/docker

echo -e "${YELLOW}🔨 Rebuilding Web Docker image...${NC}"
docker compose build web

echo -e "${YELLOW}♻️ Restarting Web container...${NC}"
docker compose up -d web

# Wait for health check
echo -e "${YELLOW}⏳ Waiting for Web to become healthy...${NC}"
for i in {1..30}; do
  if docker compose ps web | grep -q "healthy"; then
    echo -e "${GREEN}✅ Web is healthy and running!${NC}"
    break
  fi
  echo "Waiting... ($i/30)"
  sleep 2
done

# Show final status
echo -e "${YELLOW}📊 Deployment Status:${NC}"
docker compose ps web

# Check if healthy
if docker compose ps web | grep -q "healthy"; then
  echo -e "${GREEN}✨ Deployment completed successfully!${NC}"
  exit 0
else
  echo -e "${RED}❌ Deployment may have issues. Check logs:${NC}"
  echo "docker compose logs web --tail 100"
  exit 1
fi
