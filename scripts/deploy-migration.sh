#!/bin/bash

# Deployment script for running migrations on production
# This script runs database migrations on the production database

echo "🚀 FIMS Production Migration Deployment"
echo "========================================"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    echo ""
    echo "Please set it to your production database URL:"
    echo "export DATABASE_URL='postgresql://...'"
    exit 1
fi

# Confirm before proceeding
echo "⚠️  You are about to run migrations on the PRODUCTION database:"
echo ""
echo "   Database: $(echo $DATABASE_URL | sed 's/.*@//' | sed 's/\?.*//')"
echo ""
read -p "   Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Deployment cancelled"
    exit 0
fi

echo ""
echo "📦 Running migrations..."
echo ""

# Run Prisma migrate deploy
npx prisma migrate deploy

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migrations deployed successfully!"
    echo ""
    echo "🔄 Restarting your production application is recommended."
else
    echo ""
    echo "❌ Migration deployment failed!"
    echo ""
    echo "Please check the error messages above and try again."
    exit 1
fi
