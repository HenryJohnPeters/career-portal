#!/bin/bash
set -e

echo "🔄 Rolling back deployment"
echo "=========================="
echo ""

# Colors
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

read -p "Rollback API or Web? (api/web): " SERVICE

if [ "$SERVICE" != "api" ] && [ "$SERVICE" != "web" ]; then
    echo "Invalid service. Use 'api' or 'web'"
    exit 1
fi

echo -e "${BLUE}Rolling back $SERVICE service...${NC}"
railway service "$SERVICE"
railway up --detach

echo ""
echo -e "${YELLOW}Note: Railway doesn't have a built-in rollback command.${NC}"
echo "This redeploys the current code. To rollback to a previous version:"
echo "  1. Use git to checkout the previous commit"
echo "  2. Run this script again"
echo "  Or use Railway dashboard to redeploy a previous deployment"
