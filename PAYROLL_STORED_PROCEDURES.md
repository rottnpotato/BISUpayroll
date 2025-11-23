# Database-Level Payroll Calculation System

This system uses PostgreSQL stored procedures and triggers to calculate payroll at the database level, providing automatic recalculation when data changes.

## Features

✅ **Automatic Recalculation**: Payroll updates automatically when:
- Attendance records are approved
- Overload/overtime records are approved
- Payroll rules are modified
- System configurations change
- Tax/contribution rates are updated

✅ **Real-time Tracking**: View payroll calculations throughout the month as attendance is recorded

✅ **Performance**: Calculations happen at database level (faster than application-level)

✅ **Consistency**: Single source of truth for all payroll calculations

✅ **Idempotent**: Safe to recalculate multiple times without side effects

## Database Setup

### 1. Run the Migration

```bash
# Apply the stored procedures to your database
npm run prisma db execute -- --file ./prisma/migrations/create_payroll_stored_procedures.sql

# Or using psql directly
psql -U your_username -d your_database -f ./prisma/migrations/create_payroll_stored_procedures.sql
```

### 2. Verify Installation

```sql
-- Check if functions are created
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%payroll%';

-- Check if triggers are created
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND trigger_name LIKE '%payroll%';
```

## Usage

### API Endpoints

#### 1. Recalculate Payroll for a Single User

```bash
POST /api/admin/payroll/recalculate
Content-Type: application/json

{
  "scope": "user",
  "userId": "clx1234567890abcdef",
  "payPeriodStart": "2025-10-01",
  "payPeriodEnd": "2025-10-31"
}
```

#### 2. Recalculate Payroll for All Employees

```bash
POST /api/admin/payroll/recalculate
Content-Type: application/json

{
  "scope": "all",
  "payPeriodStart": "2025-10-01",
  "payPeriodEnd": "2025-10-31"
}
```

#### 3. Recalculate Current Month

```bash
POST /api/admin/payroll/recalculate
Content-Type: application/json

{
  "scope": "current_month"
}
```

#### 4. Get Current Month Summary

```bash
GET /api/admin/payroll/recalculate
```

Response:
```json
{
  "success": true,
  "currentMonth": {
    "totalEmployees": 150,
    "totalGrossPay": 3500000.00,
    "totalNetPay": 2800000.00,
    "totalDeductions": 700000.00,
    "avgNetPay": 18666.67
  },
  "period": {
    "start": "2025-10-01T00:00:00.000Z",
    "end": "2025-10-31T23:59:59.999Z"
  }
}
```

### Direct Database Usage

#### Calculate Payroll for One User

```sql
-- Calculate payroll for a specific user and period
SELECT * FROM calculate_payroll_for_period(
    'user_id_here',
    '2025-10-01'::date,
    '2025-10-31'::date
);
```

Returns complete payroll breakdown:
- Base salary, rates
- Attendance data (days/hours worked, overtime, late, etc.)
- All earnings (regular pay, overtime, holiday, allowances, bonuses)
- All deductions (GSIS, PhilHealth, Pag-IBIG, tax, late, loans)
- Net pay

#### Recalculate All Employees

```sql
-- Recalculate and update payroll_results for all employees
SELECT * FROM recalculate_all_payroll_for_period(
    '2025-10-01'::date,
    '2025-10-31'::date
);
```

Returns:
```
users_processed | users_updated | users_failed
----------------|---------------|-------------
      150       |      148      |      2
```

#### Get Current Month Summary

```sql
SELECT * FROM get_current_month_payroll_summary();
```

## Automatic Triggers

### 1. Attendance Import/Update Trigger

When attendance records are imported or updated, payroll is automatically recalculated:

```sql
-- Trigger: auto_recalculate_payroll_on_attendance
-- Fires: AFTER INSERT OR UPDATE on attendance_records
-- Action: Recalculates payroll when attendance data changes
```

**Example Flow:**
1. Admin imports attendance CSV
2. Attendance records created with status='APPROVED' (auto-approved on import)
3. **Trigger fires automatically**
4. Payroll results are updated in real-time
5. Dashboard shows updated payroll data

### 1b. Overload Record Approval Trigger

When overload/overtime records are approved, payroll is automatically recalculated:

```sql
-- Trigger: auto_recalculate_payroll_on_overload
-- Fires: AFTER INSERT OR UPDATE on overload_records
-- Action: Recalculates payroll when overload records are approved
```

**Example Flow:**
1. Employee submits overload record for extra hours worked
2. Admin reviews and approves overload record (status='APPROVED')
3. **Trigger fires automatically**
4. Payroll results updated with overload hours and pay
5. Dashboard reflects additional earnings from approved overload

### 2. Configuration Change Trigger

When system settings affecting payroll are modified:

```sql
-- Trigger: auto_recalculate_payroll_on_config
-- Fires: AFTER UPDATE on system_settings
-- Action: Logs notice when rates/hours settings change
```

**Affected Settings:**
- `rates_overtimeRate1`
- `rates_overtimeRate2`
- `rates_regularHolidayRate`
- `rates_specialHolidayRate`
- `working_hours_dailyHours`
- `working_hours_lateDeductionAmount`
- `working_hours_lateDeductionBasis`

**Recommended Action:** After changing configs, manually trigger recalculation:
```bash
POST /api/admin/payroll/recalculate
{ "scope": "current_month" }
```

### 3. Payroll Rule Change Trigger

When payroll rules are modified:

```sql
-- Trigger: auto_recalculate_payroll_on_rule
-- Fires: AFTER INSERT OR UPDATE on payroll_rules
-- Action: Recalculates affected users' payroll
```

**Example Flow:**
1. Admin adds new allowance rule for IT department
2. **Trigger fires automatically**
3. All users with this rule are recalculated
4. Payroll results reflect new allowance immediately

## Calculation Components

### The "Singular Way" for Contributions & Tax

To ensure consistency and avoid double deductions, the system enforces a strict separation of concerns:

1.  **Mandatory Contributions (GSIS, PhilHealth, Pag-IBIG) & Tax**:
    *   **Source**: Always calculated using the official `contribution_brackets` and `tax_bracket_configs` tables.
    *   **Configuration**: Managed via the "Contributions" and "Tax" tabs in Payroll Configuration.
    *   **Enforcement**: Any generic Payroll Rules named "GSIS", "PhilHealth", "Pag-IBIG", or "Tax" are **ignored** by the calculation engine to prevent conflicts.

2.  **Other Earnings & Deductions**:
    *   **Source**: Calculated from the `payroll_rules` table.
    *   **Configuration**: Managed via the "Payroll Rules" section.
    *   **Percentage Basis**:
        *   **Allowances/Bonuses**: Percentage rules are calculated based on **Regular Pay** (Basic Pay for the period).
        *   **Deductions**: Percentage rules are calculated based on **Gross Pay** (Total Earnings for the period).

### Helper Functions

| Function | Purpose | Parameters |
|----------|---------|------------|
| `calculate_hourly_rate()` | Convert daily to hourly rate | daily_rate, daily_hours |
| `calculate_overtime_pay()` | Compute overtime earnings | overtime_hours, hourly_rate, rates |
| `calculate_overload_pay()` | Compute approved overload earnings | user_id, period_start, period_end |
| `calculate_holiday_pay()` | Compute holiday premium | holiday_hours, hourly_rate, type |
| `calculate_late_deductions()` | Compute late penalties | late_hours, rates, basis |
| `calculate_gsis_contribution()` | Compute GSIS deduction | salary_base, rate, limits |
| `calculate_philhealth_contribution()` | Compute PhilHealth | salary_base, rate, limits |
| `calculate_pagibig_contribution()` | Compute Pag-IBIG | salary_base, rate, limits |
| `calculate_withholding_tax()` | Compute income tax | annual_taxable_income |

### Calculation Flow

```
1. Load System Configurations
   ├─ Daily hours (default: 8)
   ├─ Overtime rates (1.25x, 1.5x)
   ├─ Holiday rates (2.0x, 1.3x)
   └─ Late deduction settings

2. Get Base Salary from Payroll Rules
   ├─ User-specific rules
   └─ Global rules (applyToAll=true)

3. Calculate Rates
   ├─ Daily rate = base salary
   └─ Hourly rate = daily rate / daily hours

4. Aggregate Attendance Data
   ├─ Days worked
   ├─ Total hours worked
   ├─ Overtime hours (> daily hours)
   ├─ Undertime hours (< daily hours)
   ├─ Late hours
   └─ Holiday hours

5. Calculate Earnings
   ├─ Regular pay = (hours - overtime - holiday) × hourly_rate
   ├─ Overtime pay = overtime formula
   ├─ Holiday pay = holiday formula
   ├─ Overload pay = sum of approved overload records
   ├─ Allowances from payroll rules (Percentage based on Regular Pay)
   ├─ Bonuses from payroll rules (Percentage based on Regular Pay)
   ├─ 13th month pay
   ├─ Service incentive leave
   └─ Total earnings = sum of all

6. Calculate Contributions
   ├─ Contribution base = daily_rate × days_worked
   ├─ GSIS = contribution formula (from contribution_brackets)
   ├─ PhilHealth = contribution formula (from contribution_brackets)
   └─ Pag-IBIG = contribution formula (from contribution_brackets)

7. Calculate Tax
   ├─ Taxable income = gross - contributions - exempt benefits
   ├─ Annualized taxable = taxable × 12
   └─ Withholding tax = tax bracket formula / 12 (from tax_bracket_configs)

8. Calculate Deductions
   ├─ Late deductions
   ├─ Undertime deductions
   ├─ Loan deductions from payroll rules (Percentage based on Gross Pay)
   └─ Other deductions

9. Calculate Net Pay
   └─ Net pay = gross pay - total deductions
```

## Benefits Over Application-Level Calculation

### ✅ Performance
- **Database**: Calculations use optimized SQL queries
- **Application**: Multiple round-trips, data transfer overhead

### ✅ Real-time Updates
- **Database**: Triggers auto-update when data changes
- **Application**: Manual recalculation required

### ✅ Consistency
- **Database**: Single source of truth, no version conflicts
- **Application**: Multiple codebases may have different logic

### ✅ Auditability
- **Database**: All calculations logged in database
- **Application**: Logs scattered across services

### ✅ Scalability
- **Database**: Parallel processing, connection pooling
- **Application**: Limited by application server resources

## Maintenance

### Update Tax Brackets

Currently using simplified tax brackets in `calculate_withholding_tax()`. For production:

```sql
-- TODO: Replace hardcoded brackets with table lookup
CREATE OR REPLACE FUNCTION calculate_withholding_tax(
    p_annual_taxable_income DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
    v_bracket RECORD;
    v_monthly_tax DECIMAL := 0;
BEGIN
    -- Load from tax_bracket_configs table
    SELECT * INTO v_bracket
    FROM "tax_bracket_configs"
    WHERE "isActive" = true
    AND p_annual_taxable_income > "salaryMin"
    AND p_annual_taxable_income <= "salaryMax"
    ORDER BY priority DESC
    LIMIT 1;
    
    IF v_bracket IS NOT NULL THEN
        v_monthly_tax := (v_bracket."fixedAmount" + 
            ((p_annual_taxable_income - v_bracket."salaryMin") * 
             v_bracket."taxRate")) / 12;
    END IF;
    
    RETURN ROUND(v_monthly_tax, 2);
END;
$$ LANGUAGE plpgsql;
```

### Update Contribution Formulas

To use bracket-based contributions from `contribution_brackets` table:

```sql
-- TODO: Enhance to use contribution_brackets table
-- Example for GSIS:
SELECT "employeeRate" INTO v_rate
FROM "contribution_brackets"
WHERE "contributionType" = 'gsis'
AND "isActive" = true
AND p_salary_base >= "salaryMin"
AND p_salary_base <= "salaryMax"
ORDER BY priority DESC
LIMIT 1;
```

## Troubleshooting

### Issue: Payroll not updating after attendance approval

**Check:**
```sql
-- Verify trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'auto_recalculate_payroll_on_attendance';

-- Check trigger function
\df trigger_recalculate_payroll_on_attendance
```

**Solution:**
```sql
-- Recreate trigger
DROP TRIGGER IF EXISTS auto_recalculate_payroll_on_attendance ON "attendance_records";
CREATE TRIGGER auto_recalculate_payroll_on_attendance
    AFTER INSERT OR UPDATE ON "attendance_records"
    FOR EACH ROW
    EXECUTE FUNCTION trigger_recalculate_payroll_on_attendance();
```

### Issue: Calculations seem incorrect

**Debug:**
```sql
-- Test calculation for one user
SELECT * FROM calculate_payroll_for_period(
    'problematic_user_id',
    '2025-10-01'::date,
    '2025-10-31'::date
);

-- Check system settings
SELECT * FROM "system_settings" WHERE key LIKE 'rates_%' OR key LIKE 'working_hours_%';

-- Check payroll rules
SELECT * FROM "payroll_rules" WHERE "isActive" = true;
```

### Issue: Performance degradation

**Optimize:**
```sql
-- Add indexes if missing
CREATE INDEX IF NOT EXISTS idx_attendance_userid_date ON "attendance_records"("userId", date);
CREATE INDEX IF NOT EXISTS idx_payroll_rules_active ON "payroll_rules"("isActive", "applyToAll");
CREATE INDEX IF NOT EXISTS idx_payroll_results_period ON "payroll_results"("payPeriodStart", "payPeriodEnd");

-- Analyze tables
ANALYZE "attendance_records";
ANALYZE "payroll_rules";
ANALYZE "payroll_results";
```

## Migration from Application-Level Calculation

### Step 1: Deploy Stored Procedures
```bash
npm run prisma db execute -- --file ./prisma/migrations/create_payroll_stored_procedures.sql
```

### Step 2: Backfill Existing Data
```bash
POST /api/admin/payroll/recalculate
{
  "scope": "all",
  "payPeriodStart": "2025-01-01",
  "payPeriodEnd": "2025-01-31"
}
```

### Step 3: Enable Triggers
Already enabled by migration. Verify:
```sql
SELECT * FROM pg_trigger WHERE tgname LIKE '%payroll%';
```

### Step 4: Test
1. Approve an attendance record
2. Check if payroll_results updated
3. Verify calculations match expected values

### Step 5: Monitor
```sql
-- Check for failed calculations (warnings in logs)
-- Monitor query performance
SELECT * FROM pg_stat_user_functions WHERE funcname LIKE '%payroll%';
```

## Next Steps

1. **Scheduled Recalculation**: Set up cron job for nightly recalculation
2. **Advanced Tax Brackets**: Integrate `tax_bracket_configs` table
3. **Contribution Brackets**: Integrate `contribution_brackets` table
4. **Audit Trail**: Log all recalculations with timestamps and triggers
5. **Notifications**: Alert admins when payroll changes significantly
6. **Batch Processing**: Optimize for large employee counts (1000+)

## Overload/Overtime Pay System

### What is Overload Pay?

Overload pay is compensation for additional hours worked beyond regular working hours, typically for teaching or special assignments. Unlike regular overtime (which is calculated automatically from attendance), overload must be explicitly recorded and approved.

### How It Works

1. **Employee Records Overload**
   - Employee views attendance record showing >8 hours worked
   - Employee clicks "Add Overload" and enters:
     - Start time and end time of overload work
     - Description/reason for overload
   - System calculates hours and amount based on overload rate
   - Overload record created with status='PENDING'

2. **Admin Approval**
   - Admin reviews overload requests
   - Admin approves or rejects with optional notes
   - On approval, status changes to 'APPROVED'

3. **Automatic Payroll Update**
   - When overload is approved, trigger fires automatically
   - `calculate_overload_pay()` aggregates all approved overload records
   - Payroll results updated with:
     - `overloadHours`: Total approved overload hours
     - `overloadPay`: Total approved overload amount
     - `totalEarnings` and `grossPay`: Increased by overload pay
     - `netPay`: Recalculated including overload

### Overload vs Overtime

| Feature | Overtime | Overload |
|---------|----------|----------|
| **Calculation** | Automatic from hours worked > 8 | Manual entry + approval |
| **Rate** | 1.25x-1.5x hourly rate | Fixed hourly rate from payroll rules |
| **Approval** | Auto-approved with attendance | Requires admin approval |
| **Use Case** | Regular extra hours | Special assignments, teaching loads |
| **Recording** | Derived from time in/out | Explicitly entered by employee |

### Database Schema

```sql
-- Overload records table
CREATE TABLE "overload_records" (
  id TEXT PRIMARY KEY,
  "attendanceId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "startTime" TIMESTAMP NOT NULL,
  "endTime" TIMESTAMP NOT NULL,
  "hoursWorked" DECIMAL(6,2) NOT NULL,
  "hourlyRate" DECIMAL(10,2) NOT NULL,
  "totalAmount" DECIMAL(10,2) NOT NULL,
  description TEXT,
  status "OverloadStatus" DEFAULT 'PENDING',
  "approvedAt" TIMESTAMP,
  "approvedById" TEXT,
  "rejectionReason" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Enum for overload status
CREATE TYPE "OverloadStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
```

### API Endpoints

#### Create Overload Record
```bash
POST /api/employee/overload
{
  "attendanceId": "clx123...",
  "startTime": "17:00",
  "endTime": "19:00",
  "description": "Extra teaching hours for night class",
  "date": "2025-11-01"
}
```

#### Get Overload Records
```bash
# Get all for current user
GET /api/employee/overload

# Get for specific attendance
GET /api/employee/overload?attendanceId=clx123...
```

#### Get Overload Rate
```bash
GET /api/employee/overload/rate
# Returns: { "rate": 150.00 }
```

### Configuration

Set overload hourly rate in payroll rules:
1. Go to Admin → Payroll → Rules
2. Create rule with:
   - Name: "Overload Rate" (or similar, containing "overload")
   - Type: "earnings"
   - Amount: hourly rate (e.g., 150.00)
   - Active: true

The system will use this rate for calculating overload pay. Default is 100 PHP/hour if no rule is configured.

### Validation Rules

- Employee must have worked >8 hours on the attendance date
- Overload start/end times must be valid
- Overload hours must be > 0
- Only approved records are included in payroll
- Cannot create overload for inactive attendance records

### Troubleshooting

**Issue: Overload pay not showing in payroll**

Check:
```sql
-- Verify overload records are approved
SELECT * FROM "overload_records" 
WHERE "userId" = 'user_id_here' 
AND status = 'APPROVED';

-- Test calculate_overload_pay function
SELECT * FROM calculate_overload_pay(
  'user_id_here',
  '2025-11-01'::date,
  '2025-11-30'::date
);

-- Check if trigger fired
SELECT * FROM "payroll_results"
WHERE "userId" = 'user_id_here'
AND "overloadPay" > 0;
```

**Issue: Overload trigger not firing**

Verify trigger exists:
```sql
SELECT * FROM pg_trigger 
WHERE tgname = 'auto_recalculate_payroll_on_overload';
```

Recreate if needed:
```sql
DROP TRIGGER IF EXISTS auto_recalculate_payroll_on_overload ON "overload_records";
CREATE TRIGGER auto_recalculate_payroll_on_overload
    AFTER INSERT OR UPDATE ON "overload_records"
    FOR EACH ROW
    WHEN (NEW."status" = 'APPROVED')
    EXECUTE FUNCTION trigger_recalculate_payroll_on_overload();
```

## Support

For issues or questions:
1. Check database logs: `SELECT * FROM pg_stat_activity WHERE query LIKE '%payroll%';`
2. Review trigger logs: Stored procedure emits NOTICE/WARNING messages
3. Test calculations: Use helper functions directly to debug
