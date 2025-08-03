# Salary Configuration Guide

## Overview

The salary column has been removed from the users table. The system now calculates employee salaries using **Payroll Rules** with base salary configurations. This provides more flexibility and allows for different salary structures across different employee types.

## How It Works

### Before (Old System)
- Each user had a direct `salary` field in the database
- Payroll calculations used `user.salary` directly
- Limited flexibility for different salary structures

### After (New System)
- Base salary is defined through **Payroll Rules** with `type: 'base'` or `category: 'base_pay'`
- The system looks for active base salary rules assigned to each user
- Falls back to a default base salary (₱25,000) if no rule is found
- Supports different salary structures for different employee groups

## Setting Up Base Salary Rules

### 1. Creating Base Salary Rules

You can create base salary rules through the admin panel or directly in the database. Here are examples:

#### Example 1: Standard Government Employee Salary
```sql
INSERT INTO payroll_rules (id, name, type, amount, "isPercentage", "isActive", description, "applyToAll", "createdAt", "updatedAt")
VALUES (
  'rule_base_standard',
  'Standard Government Salary',
  'base',
  25000.00,
  false,
  true,
  'Base monthly salary for standard government employees',
  true,
  NOW(),
  NOW()
);
```

#### Example 2: Faculty Member Salary
```sql
INSERT INTO payroll_rules (id, name, type, amount, "isPercentage", "isActive", description, "applyToAll", "createdAt", "updatedAt")
VALUES (
  'rule_base_faculty',
  'Faculty Base Salary',
  'base',
  35000.00,
  false,
  true,
  'Base monthly salary for faculty members',
  false,
  NOW(),
  NOW()
);
```

#### Example 3: Administrative Staff Salary
```sql
INSERT INTO payroll_rules (id, name, type, amount, "isPercentage", "isActive", description, "applyToAll", "createdAt", "updatedAt")
VALUES (
  'rule_base_admin',
  'Administrative Staff Salary',
  'base',
  30000.00,
  false,
  true,
  'Base monthly salary for administrative staff',
  false,
  NOW(),
  NOW()
);
```

### 2. Assigning Base Salary Rules to Users

#### Option A: Apply to All Users (Global Rule)
Set `applyToAll = true` in the payroll rule. This will apply to all users who don't have specific rule assignments.

#### Option B: Assign to Specific Users
```sql
-- Assign faculty salary rule to specific faculty members
INSERT INTO payroll_rule_assignments (id, "userId", "payrollRuleId", "createdAt")
SELECT 
  'assignment_' || u.id || '_faculty',
  u.id,
  'rule_base_faculty',
  NOW()
FROM users u 
WHERE u.department = 'Faculty' AND u.role = 'EMPLOYEE';

-- Assign admin salary rule to administrative staff
INSERT INTO payroll_rule_assignments (id, "userId", "payrollRuleId", "createdAt")
SELECT 
  'assignment_' || u.id || '_admin',
  u.id,
  'rule_base_admin',
  NOW()
FROM users u 
WHERE u.department = 'Administration' AND u.role = 'EMPLOYEE';
```

### 3. Configuration Examples by Employee Type

#### A. For Different Academic Ranks
```sql
-- Assistant Professor
INSERT INTO payroll_rules (id, name, type, amount, "isPercentage", "isActive", description, "applyToAll", "createdAt", "updatedAt")
VALUES ('rule_asst_prof', 'Assistant Professor Salary', 'base', 32000.00, false, true, 'Base salary for Assistant Professors', false, NOW(), NOW());

-- Associate Professor  
INSERT INTO payroll_rules (id, name, type, amount, "isPercentage", "isActive", description, "applyToAll", "createdAt", "updatedAt")
VALUES ('rule_assoc_prof', 'Associate Professor Salary', 'base', 40000.00, false, true, 'Base salary for Associate Professors', false, NOW(), NOW());

-- Full Professor
INSERT INTO payroll_rules (id, name, type, amount, "isPercentage", "isActive", description, "applyToAll", "createdAt", "updatedAt")
VALUES ('rule_full_prof', 'Professor Salary', 'base', 50000.00, false, true, 'Base salary for Full Professors', false, NOW(), NOW());
```

#### B. For Different Administrative Positions
```sql
-- Department Head
INSERT INTO payroll_rules (id, name, type, amount, "isPercentage", "isActive", description, "applyToAll", "createdAt", "updatedAt")
VALUES ('rule_dept_head', 'Department Head Salary', 'base', 45000.00, false, true, 'Base salary for Department Heads', false, NOW(), NOW());

-- Administrative Assistant
INSERT INTO payroll_rules (id, name, type, amount, "isPercentage", "isActive", description, "applyToAll", "createdAt", "updatedAt")
VALUES ('rule_admin_asst', 'Admin Assistant Salary', 'base', 22000.00, false, true, 'Base salary for Administrative Assistants', false, NOW(), NOW());
```

## System Behavior

### How Base Salary is Calculated

1. **User-Specific Rules**: The system first looks for payroll rules specifically assigned to the user
2. **Global Rules**: If no user-specific base salary rule exists, it uses global rules (`applyToAll = true`)
3. **Default Fallback**: If no base salary rule is found, it defaults to ₱25,000

### Code Reference
The calculation is handled in `lib/payroll-calculations.ts`:

```typescript
export function calculateBaseSalaryFromRules(appliedRules: any[]): number {
  const baseSalaryRule = appliedRules.find(rule => 
    rule.isActive && 
    (rule.type === 'base' || rule.category === 'base_pay')
  )
  
  if (baseSalaryRule) {
    return Number(baseSalaryRule.amount)
  }
  
  // Default fallback
  return 25000
}
```

## Migration Steps

### 1. Immediate Steps After Migration
- Create at least one global base salary rule for existing employees
- Review all existing employees to ensure they have appropriate salary rules

### 2. Recommended Setup Process

1. **Analyze Current Employee Structure**
   ```sql
   SELECT DISTINCT department, position, COUNT(*) as employee_count
   FROM users 
   WHERE role = 'EMPLOYEE' AND status = 'ACTIVE'
   GROUP BY department, position
   ORDER BY department, position;
   ```

2. **Create Base Salary Rules** for each employee category

3. **Assign Rules to Users** based on department, position, or individual needs

4. **Test Payroll Calculations** to ensure all employees have proper base salary assignment

### 3. Verification Queries

```sql
-- Check employees without base salary rules
SELECT u.id, u."firstName", u."lastName", u.department, u.position
FROM users u
WHERE u.role = 'EMPLOYEE' 
  AND u.status = 'ACTIVE'
  AND u.id NOT IN (
    SELECT pra."userId" 
    FROM payroll_rule_assignments pra
    JOIN payroll_rules pr ON pra."payrollRuleId" = pr.id
    WHERE pr.type = 'base' AND pr."isActive" = true
  )
  AND NOT EXISTS (
    SELECT 1 FROM payroll_rules pr 
    WHERE pr.type = 'base' AND pr."isActive" = true AND pr."applyToAll" = true
  );

-- View all base salary rules and their assignments
SELECT 
  pr.name,
  pr.amount,
  pr."applyToAll",
  COUNT(pra."userId") as assigned_users
FROM payroll_rules pr
LEFT JOIN payroll_rule_assignments pra ON pr.id = pra."payrollRuleId"
WHERE pr.type = 'base' AND pr."isActive" = true
GROUP BY pr.id, pr.name, pr.amount, pr."applyToAll";
```

## Best Practices

### 1. Rule Naming Convention
- Use descriptive names that include the employee category
- Examples: "Faculty Base Salary", "Admin Staff Salary", "Department Head Salary"

### 2. Rule Management
- Keep base salary rules separate from other payroll rules
- Use `type: 'base'` for all base salary rules
- Set `isPercentage: false` for all base salary rules (fixed amounts)

### 3. Assignment Strategy
- Use global rules (`applyToAll: true`) for the most common salary level
- Use specific assignments for special positions or departments
- Regularly audit rule assignments to ensure accuracy

### 4. Testing
- Test payroll calculations for a few employees from each category
- Verify that the employee dashboard shows correct salary information
- Check that payroll generation works properly with the new system

## Admin Panel Integration

### Creating Rules Through Admin Panel
1. Navigate to Admin → Payroll → Rules
2. Click "Add New Rule"
3. Fill in the details:
   - **Name**: Descriptive name (e.g., "Faculty Base Salary")
   - **Type**: "base"
   - **Amount**: Monthly salary amount
   - **Is Percentage**: false
   - **Is Active**: true
   - **Apply to All**: true for global rules, false for specific assignments
   - **Description**: Clear description of what this rule covers

### Assigning Rules to Users
1. Navigate to Admin → Payroll → Rules
2. Select the base salary rule
3. Choose "Assign to Users"
4. Select the employees who should receive this salary
5. Save the assignments

## Troubleshooting

### Common Issues

1. **Employee showing ₱25,000 salary**: No base salary rule assigned
   - Solution: Create and assign appropriate base salary rule

2. **Payroll calculation errors**: Missing or inactive base salary rules
   - Solution: Verify rules are active and properly assigned

3. **Different employees showing same salary**: Global rule applied to all
   - Solution: Create specific rules and assignments for different employee categories

### Support Queries

```sql
-- Find employees with default salary (₱25,000)
-- This indicates they don't have proper base salary rules assigned

-- Check rule priority conflicts
SELECT u.id, u."firstName", u."lastName", 
       COUNT(DISTINCT pr.id) as rule_count,
       STRING_AGG(pr.name, ', ') as assigned_rules
FROM users u
JOIN payroll_rule_assignments pra ON u.id = pra."userId"
JOIN payroll_rules pr ON pra."payrollRuleId" = pr.id
WHERE pr.type = 'base' AND pr."isActive" = true
GROUP BY u.id, u."firstName", u."lastName"
HAVING COUNT(DISTINCT pr.id) > 1;
```

## Summary

The new payroll rule-based salary system provides:
- **Flexibility**: Different salary structures for different employee types
- **Maintainability**: Easy to update salary scales without touching user records
- **Auditability**: Clear tracking of salary changes through rule modifications
- **Scalability**: Easy to add new salary categories or special rates

Configure your base salary rules according to your organization's structure and ensure all employees have appropriate rule assignments for smooth payroll operations.