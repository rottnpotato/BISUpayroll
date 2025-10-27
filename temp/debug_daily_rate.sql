-- Check all payroll rules
SELECT * FROM payroll_rules WHERE type = 'daily_rate';

-- Check if any assignments exist
SELECT COUNT(*) as assignment_count FROM payroll_rule_assignments;

-- Test the stored procedure with a sample user
SELECT * FROM calculate_payroll_for_period(
    (SELECT id FROM users WHERE role = 'EMPLOYEE' LIMIT 1),
    '2025-10-01'::DATE,
    '2025-10-31'::DATE
);
