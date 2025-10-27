-- Get a sample user ID
DO $$
DECLARE
    v_user_id TEXT;
    v_daily_rate DECIMAL;
BEGIN
    -- Get first employee
    SELECT id INTO v_user_id FROM users WHERE role = 'EMPLOYEE' LIMIT 1;
    
    RAISE NOTICE 'Testing with user ID: %', v_user_id;
    
    -- Test user-specific query
    SELECT COALESCE(SUM(CAST(pr.amount AS DECIMAL)), 0) INTO v_daily_rate
    FROM "payroll_rule_assignments" pra
    JOIN "payroll_rules" pr ON pra."payrollRuleId" = pr.id
    WHERE pra."userId" = v_user_id
    AND pr."isActive" = true
    AND pr.type = 'daily_rate';
    
    RAISE NOTICE 'User-specific daily_rate: %', v_daily_rate;
    
    -- Test global query
    SELECT COALESCE(SUM(CAST(amount AS DECIMAL)), 0) INTO v_daily_rate
    FROM "payroll_rules"
    WHERE "applyToAll" = true
    AND "isActive" = true
    AND type = 'daily_rate';
    
    RAISE NOTICE 'Global daily_rate: %', v_daily_rate;
    
    -- Count all rules
    RAISE NOTICE 'Total active payroll_rules: %', (SELECT COUNT(*) FROM payroll_rules WHERE "isActive" = true);
    RAISE NOTICE 'Total daily_rate rules: %', (SELECT COUNT(*) FROM payroll_rules WHERE type = 'daily_rate');
    RAISE NOTICE 'Global daily_rate rules: %', (SELECT COUNT(*) FROM payroll_rules WHERE type = 'daily_rate' AND "applyToAll" = true AND "isActive" = true);
END $$;
