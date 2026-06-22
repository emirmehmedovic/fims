#!/bin/bash

# Production-safe stations seeding script
# This script requires explicit confirmation before running

set -e  # Exit on any error

echo "=================================="
echo "🏭 PRODUCTION STATIONS SEED"
echo "=================================="
echo ""
echo "⚠️  WARNING: You are about to seed stations data to the database."
echo ""
echo "Database URL: $DATABASE_URL"
echo ""
echo "This script will:"
echo "  - Create new stations if they don't exist"
echo "  - Update existing stations with new data"
echo "  - NOT delete any existing data"
echo ""
read -p "Are you sure you want to continue? (type 'YES' to confirm): " confirmation

if [ "$confirmation" != "YES" ]; then
    echo "❌ Seeding cancelled."
    exit 0
fi

echo ""
echo "🚀 Starting seed process..."
echo ""

# Run the seed script
npm run seed:stations

echo ""
echo "✅ Production seed completed successfully!"
echo ""
