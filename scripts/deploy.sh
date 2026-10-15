#!/usr/bin/env bash
# Deploy the current working tree to Railway with the CLI (v3+).
# Usually unnecessary: with the GitHub integration Railway deploys on push.
#
#   ./scripts/deploy.sh            # API, then web
#   ./scripts/deploy.sh api        # one service
#
# Prerequisites: `railway login` and `railway link` (pick the project), and
# services named "api" and "web" configured as described in DEPLOYMENT.md.
set -euo pipefail

if ! command -v railway >/dev/null 2>&1; then
  echo "Railway CLI not found. Install it: npm install -g @railway/cli" >&2
  exit 1
fi

services=("$@")
if [ ${#services[@]} -eq 0 ]; then
  services=(api web)
fi

for service in "${services[@]}"; do
  case "$service" in
    api | web) ;;
    *)
      echo "Unknown service '$service' (expected api or web)" >&2
      exit 1
      ;;
  esac
  echo "Deploying $service..."
  # Uploads the repo (minus .railwayignore) and builds it with the service's
  # config file. The API runs migrations and syncs the interview question
  # bank in its pre-deploy step.
  railway up --service "$service" --detach
done

echo "Deployment started. Follow it with: railway logs --service <api|web>"
echo "Then verify: ./scripts/health-check.sh <api-url> <web-url>"
