#!/bin/bash

# Payroll Stored Procedures Migration Script
# This script applies the stored procedures to your PostgreSQL database

echo "=========================================="
echo "Payroll Stored Procedures Migration"
echo "=========================================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    echo "Please create .env file with DATABASE_URL"
    exit 1
fi

# Load DATABASE_URL from .env
export $(grep -v '^#' .env | xargs)

if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL not set in .env"
    exit 1
fi

echo "📊 Database URL found"
echo ""

# Check if migration file exists
MIGRATION_FILE="./prisma/migrations/create_payroll_stored_procedures.sql"
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Error: Migration file not found at $MIGRATION_FILE"
    exit 1
fi

echo "📄 Migration file found"
echo ""

# Confirm with user
echo "⚠️  This will create stored procedures and triggers in your database."
echo "   Make sure you have a backup of your database before proceeding."
echo ""
read -p "Do you want to continue? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Migration cancelled"
    exit 0
fi

echo ""
echo "🚀 Applying migration..."
echo ""

# Apply migration using Prisma
npx prisma db execute --file "$MIGRATION_FILE" --schema ./prisma/schema.prisma

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration applied successfully!"
    echo ""
    echo "📋 Verifying installation..."
    echo ""
    
    # Verify functions and triggers
    npx prisma db execute --stdin <<SQL
SELECT 
    'Functions: ' || COUNT(*)::text as info
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%payroll%'
UNION ALL
SELECT 
    'Triggers: ' || COUNT(*)::text
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND trigger_name LIKE '%payroll%';
SQL
    
    echo ""
    echo "✅ Stored procedures and triggers are now active!"
    echo ""
    echo "📖 Next steps:"
    echo "   1. Test with: POST /api/admin/payroll/recalculate"
    echo "   2. Read documentation: PAYROLL_STORED_PROCEDURES.md"
    echo "   3. Monitor database logs for any issues"
    echo ""
else
    echo ""
    echo "❌ Migration failed!"
    echo "   Check the error messages above"
    echo "   You may need to manually apply the migration using psql"
    exit 1
fi
