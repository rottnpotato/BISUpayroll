# Payroll Stored Procedures - Quick Reference

## 🚀 Installation

```powershell
# Windows (PowerShell)
.\scripts\migrate-payroll-procedures.ps1

# Linux/Mac (Bash)
bash ./scripts/migrate-payroll-procedures.sh
```

## ✅ Verify Installation

```powershell
# Run test suite
npx prisma db execute --file .\scripts\test-payroll-procedures.sql --schema .\prisma\schema.prisma
```

## 📊 Common Operations

### 1. Recalculate Payroll for Current Month

```bash
curl -X POST http://localhost:3000/api/admin/payroll/recalculate \
  -H "Content-Type: application/json" \
  -d '{"scope":"current_month"}'
```

### 2. Recalculate Payroll for Specific User

```bash
curl -X POST http://localhost:3000/api/admin/payroll/recalculate \
  -H "Content-Type: application/json" \
  -d '{
    "scope": "user",
    "userId": "clx1234567890abcdef",
    "payPeriodStart": "2025-10-01",
    "payPeriodEnd": "2025-10-31"
  }'
```

### 3. Recalculate All Employees for Period

```bash
curl -X POST http://localhost:3000/api/admin/payroll/recalculate \
  -H "Content-Type: application/json" \
  -d '{
    "scope": "all",
    "payPeriodStart": "2025-10-01",
    "payPeriodEnd": "2025-10-31"
  }'
```

### 4. Get Current Month Summary

```bash
curl http://localhost:3000/api/admin/payroll/recalculate
```

## 🔧 Direct Database Queries

### Calculate Payroll for One User

```sql
SELECT * FROM calculate_payroll_for_period(
    'user_id_here',
    '2025-10-01'::date,
    '2025-10-31'::date
);
```

### Recalculate All Employees

```sql
SELECT * FROM recalculate_all_payroll_for_period(
    '2025-10-01'::date,
    '2025-10-31'::date
);
```

### Get Summary for Current Month

```sql
SELECT * FROM get_current_month_payroll_summary();
```

### Test Individual Calculations

```sql
-- Test hourly rate
SELECT calculate_hourly_rate(800, 8); -- Returns 100

-- Test overtime pay
SELECT calculate_overtime_pay(3, 100, 1.25, 1.5); -- Returns 400

-- Test holiday pay
SELECT calculate_holiday_pay(8, 100, 'REGULAR', 2.0, 1.3); -- Returns 800

-- Test GSIS contribution
SELECT calculate_gsis_contribution(20000, 9.0); -- Returns 1800

-- Test PhilHealth contribution
SELECT calculate_philhealth_contribution(20000, 2.5, 500, 5000); -- Returns 500

-- Test Pag-IBIG contribution
SELECT calculate_pagibig_contribution(5000, 2.0, 100, 200); -- Returns 100

-- Test withholding tax
SELECT calculate_withholding_tax(500000); -- Returns monthly tax
```

## 🔄 Automatic Triggers

### When Attendance is Imported

```
1. Admin imports attendance CSV
2. Records created with status = 'APPROVED' (auto-approved)
3. Trigger fires automatically
4. Payroll recalculated for affected users' period
5. payroll_results table updated
```

### When Payroll Rules Change

```
1. Admin updates payroll rule
2. Trigger identifies affected users
3. Payroll recalculated for current month
4. All affected users updated
```

### When System Config Changes

```
1. Admin updates rates or working hours
2. Trigger logs notification
3. Manual recalculation recommended:
   POST /api/admin/payroll/recalculate {"scope":"current_month"}
```

## 🐛 Troubleshooting

### Check if Triggers are Active

```sql
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND trigger_name LIKE '%payroll%';
```

### Check Recent Calculations

```sql
SELECT 
    u."firstName" || ' ' || u."lastName" as employee,
    pr."payPeriodStart",
    pr."payPeriodEnd",
    pr."grossPay",
    pr."netPay",
    pr."updatedAt"
FROM "payroll_results" pr
JOIN "users" u ON pr."userId" = u.id
ORDER BY pr."updatedAt" DESC
LIMIT 10;
```

### Debug User Calculation

```sql
-- Check attendance data
SELECT 
    date,
    "timeIn",
    "timeOut",
    "hoursWorked",
    "isLate",
    status
FROM "attendance_records"
WHERE "userId" = 'user_id_here'
AND date >= '2025-10-01'
AND date <= '2025-10-31';

-- Check payroll rules
SELECT pr.*
FROM "payroll_rule_assignments" pra
JOIN "payroll_rules" pr ON pra."payrollRuleId" = pr.id
WHERE pra."userId" = 'user_id_here'
AND pr."isActive" = true;

-- Check system settings
SELECT key, value
FROM "system_settings"
WHERE (key LIKE 'rates_%' OR key LIKE 'working_hours_%')
AND "isActive" = true;
```

### Manually Trigger Recalculation

```sql
-- For one user
SELECT * FROM calculate_payroll_for_period(
    'user_id_here',
    DATE_TRUNC('month', CURRENT_DATE)::date,
    (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date
);

-- For all users
SELECT * FROM recalculate_all_payroll_for_period(
    DATE_TRUNC('month', CURRENT_DATE)::date,
    (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date
);
```

## 📈 Performance Monitoring

### Check Function Performance

```sql
SELECT 
    funcname,
    calls,
    total_time,
    self_time,
    avg_self_time
FROM pg_stat_user_functions
WHERE funcname LIKE '%payroll%'
ORDER BY total_time DESC;
```

### Check Active Queries

```sql
SELECT 
    pid,
    usename,
    application_name,
    state,
    query,
    query_start
FROM pg_stat_activity
WHERE query LIKE '%payroll%'
AND state != 'idle';
```

## 🎯 Best Practices

### 1. Always Have Current Attendance Approved

```
- Import attendance CSV
- Review and approve records
- Payroll auto-calculates upon approval
```

### 2. Configure System Settings First

```sql
-- Before calculating payroll, ensure these are set:
UPDATE "system_settings" SET value = '8' WHERE key = 'working_hours_dailyHours';
UPDATE "system_settings" SET value = '1.25' WHERE key = 'rates_overtimeRate1';
UPDATE "system_settings" SET value = '1.5' WHERE key = 'rates_overtimeRate2';
UPDATE "system_settings" SET value = '2.0' WHERE key = 'rates_regularHolidayRate';
```

### 3. Set Up Payroll Rules

```sql
-- Create base salary rules for users
INSERT INTO "payroll_rules" (id, name, type, amount, "isPercentage", "applyToAll")
VALUES (gen_random_uuid()::text, 'Base Salary', 'base', 800, false, false);
```

### 4. Regular Monitoring

```sql
-- Daily check: Current month summary
SELECT * FROM get_current_month_payroll_summary();

-- Weekly check: Recent updates
SELECT COUNT(*), MAX("updatedAt")
FROM "payroll_results"
WHERE "updatedAt" >= NOW() - INTERVAL '7 days';
```

## 📋 Workflow Example

### Monthly Payroll Processing

```
Day 1-15: 
- Employees work, attendance auto-recorded via biometric

Day 16:
- Import attendance CSV
- ✅ Attendance auto-approved and payroll auto-calculates via triggers

Day 17:
- Review payroll results in dashboard
- Verify calculations spot-check
- Adjust any errors (triggers auto-recalculate)

Day 18:
- Generate payroll reports
- Export for payment processing

Day 20:
- Mark payroll as paid
- Archive previous month data
```

### After Configuration Changes

```bash
# 1. Update configuration in admin panel
# 2. Recalculate affected periods
curl -X POST http://localhost:3000/api/admin/payroll/recalculate \
  -H "Content-Type: application/json" \
  -d '{"scope":"current_month"}'

# 3. Verify results
curl http://localhost:3000/api/admin/payroll/recalculate
```

## 🔗 Related Documentation

- Full Guide: [PAYROLL_STORED_PROCEDURES.md](./PAYROLL_STORED_PROCEDURES.md)
- Migration SQL: [prisma/migrations/create_payroll_stored_procedures.sql](./prisma/migrations/create_payroll_stored_procedures.sql)
- API Endpoint: [app/api/admin/payroll/recalculate/route.ts](./app/api/admin/payroll/recalculate/route.ts)
