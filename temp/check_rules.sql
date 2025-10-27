SELECT id, name, type, amount, "isPercentage", "isActive", "applyToAll" 
FROM payroll_rules 
WHERE type = 'daily_rate';
