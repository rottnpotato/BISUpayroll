-- First, let's see what exists
\echo 'Current payroll_rules:'
SELECT id, name, type, amount::text, "isActive", "applyToAll" FROM payroll_rules WHERE type = 'daily_rate';

-- If empty, let's create a test global rule
INSERT INTO payroll_rules (id, name, type, amount, "isActive", "applyToAll", "createdAt", "updatedAt")
VALUES (
    'test_daily_rate_' || gen_random_uuid()::text,
    'Default Daily Rate',
    'daily_rate',
    500.00,
    true,
    true,
    NOW(),
    NOW()
)
ON CONFLICT DO NOTHING;

\echo 'After insert:'
SELECT id, name, type, amount::text, "isActive", "applyToAll" FROM payroll_rules WHERE type = 'daily_rate';
