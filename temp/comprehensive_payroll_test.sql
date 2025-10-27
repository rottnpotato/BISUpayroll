-- Comprehensive test showing all calculation components

-- 1. Check system settings (rates and deduction settings)
SELECT 
    '=== SYSTEM SETTINGS ===' as section,
    key,
    value,
    "isActive"
FROM "system_settings"
WHERE key IN (
    'default_daily_rate',
    'working_hours_per_day',
    'overtime_rate',
    'holiday_rate',
    'late_deduction_amount',
    'late_deduction_basis'
)
ORDER BY key;

-- 2. Check payroll rules and their types
SELECT 
    '=== PAYROLL RULES ===' as section,
    pr.id,
    pr.name,
    pr.type,
    pr.amount,
    pr."isPercentage",
    pr."isActive",
    pr."applyToAll",
    pr."createdByRole",
    CASE 
        WHEN pr."isPercentage" THEN CONCAT(pr.amount, '%')
        ELSE CONCAT('₱', pr.amount)
    END as display_amount
FROM "payroll_rules" pr
WHERE pr."isActive" = true
ORDER BY pr.type, pr.name;

-- 3. Check rule assignments per user
SELECT 
    '=== RULE ASSIGNMENTS ===' as section,
    u.name as user_name,
    u.email,
    pr.name as rule_name,
    pr.type,
    CASE 
        WHEN pr."isPercentage" THEN CONCAT(pr.amount, '%')
        ELSE CONCAT('₱', pr.amount)
    END as amount,
    pr."createdByRole" as added_by
FROM "payroll_rule_assignments" pra
JOIN "users" u ON pra."userId" = u.id
JOIN "payroll_rules" pr ON pra."payrollRuleId" = pr.id
WHERE pr."isActive" = true
ORDER BY u.name, pr.type, pr.name;

-- 4. Sample payroll calculation for an employee
SELECT 
    '=== SAMPLE CALCULATION ===' as section,
    *
FROM calculate_payroll_for_period(
    (SELECT id FROM "users" WHERE role = 'EMPLOYEE' LIMIT 1),
    '2025-10-01'::DATE,
    '2025-10-15'::DATE
)
WHERE EXISTS (SELECT 1 FROM "users" WHERE role = 'EMPLOYEE' LIMIT 1);
