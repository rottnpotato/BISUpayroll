-- Check payroll rules and their assignments
SELECT 
    pr.id,
    pr.name,
    pr.type,
    pr.amount,
    pr."isActive",
    pra."userId",
    u.name as user_name,
    u.email
FROM "payroll_rules" pr
LEFT JOIN "payroll_rule_assignments" pra ON pr.id = pra."payrollRuleId"
LEFT JOIN "users" u ON pra."userId" = u.id
WHERE pr."isActive" = true
ORDER BY pr.type, pr.name;

-- Check system settings for rates
SELECT 
    key,
    value,
    "isActive"
FROM "system_settings"
WHERE key LIKE '%rate%' OR key LIKE '%deduction%' OR key LIKE '%hours%'
ORDER BY key;
