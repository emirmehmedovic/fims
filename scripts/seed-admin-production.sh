#!/bin/bash

# Production Admin Seed Script
# Creates/resets SUPER_ADMIN user for production

set -e  # Exit on any error

echo "=========================================="
echo "🔐 PRODUCTION ADMIN USER SEED"
echo "=========================================="
echo ""
echo "⚠️  WARNING: This will create/reset admin user"
echo ""
echo "Database: $DATABASE_URL"
echo ""
read -p "Are you sure you want to continue? (type 'YES' to confirm): " confirmation

if [ "$confirmation" != "YES" ]; then
    echo "❌ Seed cancelled."
    exit 0
fi

echo ""
echo "🚀 Starting seed process..."
echo ""

# Run the TypeScript seed script
npx tsx scripts/seed-admin-production.ts

echo ""
echo "✅ Admin seed completed successfully!"
echo ""
