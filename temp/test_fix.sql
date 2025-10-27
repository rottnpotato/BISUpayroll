-- 1. Check if global daily_rate rule exists
SELECT id, name, type, amount, "isActive", "applyToAll"
FROM payroll_rules 
WHERE type = 'daily_rate';

-- 2. Test with a user
SELECT * FROM calculate_payroll_for_period(
    (SELECT id FROM users WHERE role = 'EMPLOYEE' LIMIT 1),
    '2025-10-01'::DATE,
    '2025-10-31'::DATE
) LIMIT 1;
