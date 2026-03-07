#!/bin/bash
set -e

echo "🚀 Career Portal - Complete Deployment Automation"
echo "=================================================="
echo ""
echo "This script will:"
echo "  1. Install Railway CLI"
echo "  2. Set up Railway project with Postgres"
echo "  3. Configure environment variables"
echo "  4. Deploy API and Web services"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

# Run setup
./scripts/deploy-setup.sh

echo ""
echo "=============================================="
echo ""

# Run environment configuration
./scripts/deploy-env.sh

echo ""
echo "=============================================="
echo ""

# Run deployment
./scripts/deploy.sh

echo ""
echo "🎉 Deployment complete!"
