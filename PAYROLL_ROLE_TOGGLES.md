# Payroll Role Toggles System

## Overview

The Payroll Role Toggles system allows administrators to create granular role-based payroll configurations where different employee roles can have different payroll rule eligibilities. This system enables fine-grained control over which payroll benefits, deductions, and calculations apply to different types of employees.

## Features

### 1. Database Schema
- **PayrollRole Model**: Stores role definitions with eligibility flags
- **UserPayrollRole Model**: Links users to their assigned payroll roles
- **Integration**: Seamlessly integrates with existing User and PayrollRule models

### 2. Role Eligibility Toggles
Each payroll role can be configured with eligibility for:
- **Overtime Pay**: Whether the role is eligible for overtime compensation
- **Night Differential**: Eligibility for night shift premium pay
- **Holiday Pay**: Access to holiday pay multipliers
- **Government Contributions**:
  - GSIS (Government Service Insurance System)
  - PhilHealth (Philippine Health Insurance)
  - Pag-IBIG (Home Development Mutual Fund)
- **Withholding Tax**: Tax deduction applicability
- **13th Month Pay**: Mandatory year-end benefit eligibility
- **Leave Benefits**: Access to leave benefit calculations

### 3. User Interface
- **Role Toggle Card**: Comprehensive UI for managing payroll roles
- **Configuration Layout Integration**: Seamlessly integrated into the payroll configuration system
- **Real-time Updates**: Immediate saving and retrieval from database
- **Search and Filtering**: Easy role management with department/position filters

## How It Works

### 1. Role Creation
Administrators can create payroll roles with:
```typescript
interface PayrollRole {
  name: string                        // e.g., "Senior Professor"
  description: string                 // Role description
  department: string                  // e.g., "Faculty"
  position: string                    // e.g., "Professor"
  baseSalary: number                  // Base salary amount
  isActive: boolean                   // Role status
  
  // Eligibility flags
  overtimeEligible: boolean
  nightDifferentialEligible: boolean
  holidayPayEligible: boolean
  gsisEligible: boolean
  philHealthEligible: boolean
  pagibigEligible: boolean
  withholdingTaxEligible: boolean
  thirteenthMonthEligible: boolean
  leaveEligible: boolean
}
```

### 2. User Assignment
Users can be assigned to multiple payroll roles, with the system supporting:
- Multiple role assignments per user
- Role hierarchy and precedence
- Active/inactive role management

### 3. Payroll Rule Application
The system includes utility functions to determine rule applicability:

```typescript
// Get applicable rules for a user based on their roles
const applicableRules = getApplicableRulesForUser(context, allRules)

// Calculate role-based base salary
const baseSalary = calculateRoleBasedSalary(userRoles)

// Get eligibility matrix
const eligibility = getRoleEligibilityMatrix(userRoles)
```

## API Endpoints

### Role Management
- `GET /api/admin/payroll/roles` - List all payroll roles
- `POST /api/admin/payroll/roles` - Create new payroll role
- `PUT /api/admin/payroll/roles/[id]` - Update payroll role
- `DELETE /api/admin/payroll/roles/[id]` - Delete payroll role

### User Assignment
- `GET /api/admin/payroll/roles/[id]/users` - Get users assigned to role
- `POST /api/admin/payroll/roles/[id]/users` - Assign users to role

## Usage Examples

### 1. Creating Faculty Roles
```typescript
// Professor role with full benefits
{
  name: "Professor",
  department: "Faculty",
  position: "Professor",
  baseSalary: 65000,
  overtimeEligible: true,
  holidayPayEligible: true,
  gsisEligible: true,
  philHealthEligible: true,
  thirteenthMonthEligible: true
}

// Part-time Instructor with limited benefits
{
  name: "Part-time Instructor",
  department: "Faculty", 
  position: "Instructor",
  baseSalary: 25000,
  overtimeEligible: false,
  holidayPayEligible: false,
  gsisEligible: false,
  thirteenthMonthEligible: false
}
```

### 2. IT Department Roles
```typescript
// Senior Developer with night differential
{
  name: "Senior Developer",
  department: "Information Technology",
  position: "Software Developer",
  baseSalary: 55000,
  overtimeEligible: true,
  nightDifferentialEligible: true,
  holidayPayEligible: true
}

// IT Support with basic benefits
{
  name: "IT Support",
  department: "Information Technology",
  position: "IT Support",
  baseSalary: 35000,
  overtimeEligible: true,
  nightDifferentialEligible: true,
  holidayPayEligible: false
}
```

## Integration with Payroll Rules

The role toggles system integrates with existing payroll rules by:

1. **Rule Eligibility Check**: Before applying any payroll rule, the system checks if the user's roles make them eligible
2. **Base Salary Override**: Role-based base salaries can override default values
3. **Conditional Application**: Rules are only applied if at least one of the user's active roles allows it
4. **Precedence Handling**: Multiple roles are handled with "most permissive" logic

## Database Migration

To set up the system, run the migration:
```sql
-- This creates the payroll_roles and user_payroll_roles tables
-- and populates with default roles based on existing positions
```

## Benefits

1. **Granular Control**: Fine-grained control over payroll rule application
2. **Flexibility**: Easy to modify role eligibilities without changing code
3. **Scalability**: Support for unlimited roles and complex organizational structures  
4. **Audit Trail**: All role changes are logged for compliance
5. **User-Friendly**: Intuitive interface for administrators
6. **Database-Driven**: All configurations stored in database for persistence

## Future Enhancements

- **Role Templates**: Pre-defined role templates for common positions
- **Bulk Operations**: Mass assignment of users to roles
- **Role Inheritance**: Hierarchical role structures
- **Time-based Roles**: Temporary role assignments with expiration
- **Role Approval Workflow**: Multi-step approval for role changes

This system provides a robust foundation for role-based payroll management while maintaining compatibility with the existing payroll infrastructure.