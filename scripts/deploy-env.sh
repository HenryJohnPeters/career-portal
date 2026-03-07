#!/bin/bash
set -e

echo "🔐 Setting up environment variables"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check for required tools
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI not found. Run ./scripts/deploy-setup.sh first${NC}"
    exit 1
fi

echo -e "${BLUE}Please provide the following values:${NC}"
echo ""

# Collect environment variables
read -p "OpenAI API Key: " OPENAI_API_KEY
read -p "Stripe Secret Key: " STRIPE_SECRET_KEY
read -p "Stripe Price ID: " STRIPE_PRICE_ID
read -p "Stripe Webhook Secret: " STRIPE_WEBHOOK_SECRET
read -p "Supabase URL (optional, press Enter to skip): " SUPABASE_URL
read -p "Supabase JWT Secret (optional, press Enter to skip): " SUPABASE_JWT_SECRET
read -p "Supabase Anon Key (optional, for frontend): " SUPABASE_ANON_KEY

echo ""
echo -e "${BLUE}🗄️ Configuring API service...${NC}"

# Switch to API service and set variables
railway service api

# Get database URL from Railway
echo -e "${YELLOW}Getting DATABASE_URL from Railway Postgres...${NC}"
DATABASE_URL=$(railway variables --json | grep -o '"DATABASE_URL":"[^"]*"' | cut -d'"' -f4 || echo "")

if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}⚠️  Could not auto-detect DATABASE_URL. You'll need to link Postgres manually.${NC}"
    echo "Run: railway service api"
    echo "Then: railway link (select your postgres service)"
fi

# Set API environment variables
railway variables set OPENAI_API_KEY="$OPENAI_API_KEY"
railway variables set STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY"
railway variables set STRIPE_PRICE_ID="$STRIPE_PRICE_ID"
railway variables set STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET"
railway variables set NODE_ENV="production"
railway variables set PORT="3000"

if [ -n "$SUPABASE_URL" ]; then
    railway variables set SUPABASE_URL="$SUPABASE_URL"
fi

if [ -n "$SUPABASE_JWT_SECRET" ]; then
    railway variables set SUPABASE_JWT_SECRET="$SUPABASE_JWT_SECRET"
fi

# Get API URL
echo ""
echo -e "${YELLOW}Generating domain for API service...${NC}"
railway domain

echo ""
echo -e "${BLUE}Please enter the API domain that was generated (e.g., api-production-xxxx.railway.app):${NC}"
read API_DOMAIN
API_URL="https://$API_DOMAIN"

echo ""
echo -e "${BLUE}🎨 Configuring Web service...${NC}"

# Switch to web service
railway service web

# Get web domain
railway domain

echo ""
echo -e "${BLUE}Please enter the Web domain that was generated (e.g., web-production-xxxx.railway.app):${NC}"
read WEB_DOMAIN
WEB_URL="https://$WEB_DOMAIN"

# Set web environment variables (build-time)
railway variables set VITE_API_URL="$API_URL"

if [ -n "$SUPABASE_URL" ]; then
    railway variables set VITE_SUPABASE_URL="$SUPABASE_URL"
fi

if [ -n "$SUPABASE_ANON_KEY" ]; then
    railway variables set VITE_SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY"
fi

echo ""
echo -e "${BLUE}🔄 Updating API with CLIENT_URL...${NC}"
railway service api
railway variables set CLIENT_URL="$WEB_URL"

echo ""
echo -e "${GREEN}✅ Environment variables configured!${NC}"
echo ""
echo -e "${YELLOW}📝 Summary:${NC}"
echo "  API URL: $API_URL"
echo "  Web URL: $WEB_URL"
echo ""
echo -e "${BLUE}Next: Run ./scripts/deploy.sh to deploy both services${NC}"
