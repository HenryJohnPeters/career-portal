#!/bin/bash
set -e

echo "🚀 Career Portal - Railway Deployment (Modern CLI)"
echo "==================================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}Railway's CLI has changed. Here's the modern deployment approach:${NC}"
echo ""
echo "Railway now primarily uses GitHub/GitLab integration for deployments."
echo "However, we can still deploy via CLI with some manual setup."
echo ""

# Check if logged in
if ! railway whoami &> /dev/null; then
    echo -e "${RED}Not logged in to Railway${NC}"
    echo "Run: railway login --browserless"
    exit 1
fi

echo -e "${GREEN}✓ Logged in to Railway${NC}"
echo ""

# Get project info
echo -e "${BLUE}Current Railway Configuration:${NC}"
railway status
echo ""

# Check if we need environment variables
echo -e "${YELLOW}Setting up environment variables...${NC}"
echo ""

read -p "Do you want to configure environment variables now? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${BLUE}Please provide the following values:${NC}"
    
    read -p "OpenAI API Key: " OPENAI_API_KEY
    read -p "Stripe Secret Key: " STRIPE_SECRET_KEY
    read -p "Stripe Price ID: " STRIPE_PRICE_ID
    read -p "Stripe Webhook Secret: " STRIPE_WEBHOOK_SECRET
    read -p "Supabase URL (optional, press Enter to skip): " SUPABASE_URL
    read -p "Supabase JWT Secret (optional, press Enter to skip): " SUPABASE_JWT_SECRET
    read -p "Supabase Anon Key (optional): " SUPABASE_ANON_KEY
    
    echo ""
    echo -e "${BLUE}Setting environment variables...${NC}"
    
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
    
    echo -e "${GREEN}✓ Environment variables set${NC}"
fi

echo ""
echo -e "${BLUE}Deploying application...${NC}"
railway up --detach

echo ""
echo -e "${GREEN}✅ Deployment initiated!${NC}"
echo ""
echo -e "${YELLOW}📊 Next steps:${NC}"
echo "1. Check deployment status: railway status"
echo "2. View logs: railway logs"
echo "3. Open Railway dashboard: railway open"
echo ""
echo -e "${YELLOW}⚠️  Important:${NC}"
echo "Railway's modern CLI works best with their web dashboard for managing multiple services."
echo "Consider connecting your GitHub repository to Railway for easier deployments."
echo ""
echo -e "${BLUE}Alternative: GitHub Integration (Recommended)${NC}"
echo "1. Push your code to GitHub"
echo "2. Go to railway.app"
echo "3. Create services from the dashboard (API, Web)"
echo "4. Connect each service to your GitHub repo"
echo "5. Configure root directory and Dockerfile for each service"
