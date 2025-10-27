-- Check all rules
SELECT 
    id, 
    name, 
    type, 
    amount, 
    "isActive", 
    "applyToAll",
    "createdAt"
FROM payroll_rules 
ORDER BY type, name;

-- Count rules by type
SELECT type, COUNT(*) as count, SUM(CASE WHEN "applyToAll" THEN 1 ELSE 0 END) as global_count
FROM payroll_rules
WHERE "isActive" = true
GROUP BY type;

-- Check if there are any user assignments
SELECT COUNT(*) as total_assignments
FROM payroll_rule_assignments;
