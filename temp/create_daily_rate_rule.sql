-- Check current daily_rate rules
SELECT id, name, type, amount::text, "isActive", "applyToAll" FROM payroll_rules WHERE type = 'daily_rate';

-- Create a test global rule if none exists
INSERT INTO payroll_rules (id, name, type, amount, "isActive", "applyToAll", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text,
    'Default Daily Rate',
    'daily_rate',
    500.00,
    true,
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM payroll_rules WHERE type = 'daily_rate' AND "applyToAll" = true AND "isActive" = true);

-- Show final state
SELECT id, name, type, amount::text, "isActive", "applyToAll" FROM payroll_rules WHERE type = 'daily_rate';
