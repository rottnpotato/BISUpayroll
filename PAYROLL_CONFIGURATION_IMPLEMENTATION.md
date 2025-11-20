# Payroll Configuration System Implementation

## Overview
This document describes the comprehensive payroll configuration system with scope-based application, status tracking, and read-only display in the payroll calculations page.

## Features Implemented

### 1. Configuration Scope System
All payroll configurations now support flexible application scopes:

- **All Employees**: Default configuration applied organization-wide
- **Department**: Configuration specific to a department
- **Individual**: Configuration for a specific employee
- **Role**: Configuration for employees with a specific role
- **Position**: Configuration for employees in a specific position

#### Priority System
- Configurations with higher priority override lower priority ones
- Priority range: 0 (default) to 5 (highest)
- Individual configurations typically have higher priority than department-wide

### 2. Configuration Types

#### Working Hours Configuration
- Daily working hours
- Weekly working hours
- Overtime threshold
- Late grace minutes
- Late deduction basis and amount
- **Status**: Active/Inactive tracking
- **Scope**: Application scope selector

#### Pay Rates Configuration
- Overtime rate (first 2 hours)
- Overtime rate (beyond 2 hours)
- Regular holiday rate
- Special holiday rate
- Currency (PHP)
- **Status**: Active/Inactive tracking
- **Scope**: Application scope selector

#### Leave Benefits Configuration
- Vacation leave days
- Sick leave days
- Service incentive leave days
- Maternity leave days
- Paternity leave days
- **Status**: Active/Inactive tracking
- **Scope**: Application scope selector

#### Government Contributions Configuration
- GSIS employee & employer rates
- PhilHealth employee & employer rates
- Pag-IBIG employee & employer rates
- Contribution brackets with salary ranges
- **Status**: Active/Inactive tracking
- **Scope**: Application scope selector

#### Tax Configuration
- Tax brackets with salary ranges
- Withholding tax settings
- Auto-compute tax option
- Breakdown display on payslip
- **Status**: Active/Inactive tracking
- **Scope**: Application scope selector

### 3. Configuration Status Card (Read-Only Display)

Created `ConfigurationStatusCard` component that displays all active configurations on the Payroll Calculations page:

#### Features:
- **Visual Status Indicators**: 
  - Green checkmark for active configurations
  - Gray X for inactive configurations
  
- **Scope Display**: 
  - Badge showing application scope (All Employees, Department, Individual, etc.)
  - Shows target name for scoped configurations

- **Configuration Summary**:
  - Quick view of key configuration values
  - Organized by configuration type with icons
  - Color-coded cards for easy identification

- **Navigation**:
  - "Edit Configurations" button linking to configuration page
  - Note explaining read-only nature and scope priority

#### Display Structure:
```
┌─────────────────────────────────────────────────────────┐
│ Active Payroll Configurations     [Edit Configurations] │
├─────────────────────────────────────────────────────────┤
│ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐  │
│ │ Working Hours │ │   Pay Rates   │ │Leave Benefits │  │
│ │    ✓ Active   │ │    ✓ Active   │ │    ✓ Active   │  │
│ │ All Employees │ │ Dept: IT      │ │ All Employees │  │
│ │               │ │               │ │               │  │
│ │ Daily: 8h     │ │ OT 1st: 1.25x │ │ Vacation: 15  │  │
│ │ Weekly: 40h   │ │ OT 2nd: 1.5x  │ │ Sick: 7       │  │
│ └───────────────┘ └───────────────┘ └───────────────┘  │
│                                                          │
│ Note: Configurations are read-only here...              │
└─────────────────────────────────────────────────────────┘
```

### 4. Database Schema Updates

#### SystemSettings Table
- Added `scopes` relation to `ConfigurationScope`
- Stores configuration key-value pairs
- Includes `isActive` flag for status tracking

#### ConfigurationScope Table
```prisma
model ConfigurationScope {
  id               String         @id @default(cuid())
  settingsId       String
  applicationType  ApplicationType @default(ALL)
  targetId         String?        // Department ID, User ID, etc.
  targetName       String?        // Department name, User name, etc.
  priority         Int            @default(0)
  isActive         Boolean        @default(true)
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt
  
  settings         SystemSettings @relation(...)
}

enum ApplicationType {
  ALL
  DEPARTMENT
  INDIVIDUAL
  ROLE
  POSITION
}
```

### 5. Service Layer Enhancements

#### PayrollConfigurationService
Updated to handle scoped configurations:

```typescript
static async saveConfiguration(type: ConfigType, config: any): Promise<SaveConfigResponse> {
  // Saves settings with associated configuration scopes
  // Deactivates old scopes when new ones are created
  // Maintains configuration history
}

static async loadBundle(): Promise<PayrollConfigurationBundle> {
  // Loads settings with active scopes
  // Includes scope information in returned configurations
  // Supports priority-based configuration resolution
}
```

### 6. Configuration Mapping

Enhanced `mapSettingsToConfiguration` function to:
- Map configuration scopes from database
- Associate scopes with appropriate configuration sections
- Set `isActive` status for all configurations
- Support priority-based configuration resolution

### 7. User Interface Components

#### ConfigurationScopeSelector
Reusable component for selecting configuration scope:
- Dropdown for application type selection
- Dynamic target selection based on type
- Priority setting
- Visual feedback with icons and badges

#### ConfigurationStatusCard
Display component for payroll calculations page:
- Grid layout for multiple configurations
- Status indicators (active/inactive)
- Scope badges with icons
- Key configuration values
- Link to edit configurations

### 8. File Structure

```
app/admin/payroll/
├── calculations/
│   └── page.tsx                          # Updated with ConfigurationStatusCard
├── configuration/
│   ├── page.tsx                          # Configuration management page
│   ├── service.ts                        # Updated with scope support
│   └── index.ts                          # Updated mapping functions
├── components/
│   ├── ConfigurationStatusCard.tsx       # NEW: Read-only display
│   ├── ConfigurationScopeSelector.tsx    # Scope selection UI
│   ├── ConfigurationLayout.tsx           # Updated (removed comments)
│   ├── WorkingHoursCard.tsx              # With scope selector
│   ├── RatesConfigCard.tsx               # With scope selector
│   ├── LeaveBenefitsCard.tsx             # With scope selector
│   ├── ContributionsConfigCard.tsx       # With scope selector
│   ├── TaxBracketsConfigCard.tsx         # With scope selector
│   └── index.ts                          # Updated exports
├── hooks/
│   └── usePayrollConfig.ts               # Enhanced with scope support
└── types/
    └── index.ts                          # Existing types (already had scope support)
```

## Usage Guide

### For Administrators

#### Setting Up Configurations

1. **Navigate to Configuration Page**
   - Go to Admin > Payroll > Configuration
   - Select the configuration type from the sidebar

2. **Configure Settings**
   - Adjust values as needed
   - Click the settings gear icon to open scope selector
   - Choose application scope (All Employees, Department, etc.)
   - Set priority if needed
   - Click "Save Configuration"

3. **View Active Configurations**
   - Go to Admin > Payroll > Calculations
   - View all active configurations in the status card
   - Configurations are read-only here
   - Click "Edit Configurations" to make changes

#### Configuration Priority Example

```
Priority Resolution:
1. Individual (Priority 5) → Highest
2. Position (Priority 3)
3. Department (Priority 2)
4. Role (Priority 1)
5. All Employees (Priority 0) → Default
```

If an employee has multiple applicable configurations, the system uses the one with the highest priority.

### For Developers

#### Adding a New Configuration Type

1. **Update Types** (`types/index.ts`)
```typescript
export interface NewConfig {
  field1: number
  field2: string
  applicationScope?: ConfigurationScope
  isActive?: boolean
}
```

2. **Add to Configuration Bundle** (`configuration/index.ts`)
```typescript
export interface PayrollConfigurationBundle {
  // ... existing configs
  newConfig: NewConfig
}
```

3. **Create Configuration Card** (`components/NewConfigCard.tsx`)
```typescript
export function NewConfigCard({ config, onConfigChange, onSave }: Props) {
  // Include ConfigurationScopeSelector
  // Add status indicator
  // Implement save with scope
}
```

4. **Add to Configuration Layout** (`components/ConfigurationLayout.tsx`)
```typescript
const menuItems: MenuItem[] = [
  // ... existing items
  {
    id: 'new-config',
    title: 'New Configuration',
    description: 'Description of new config',
    icon: IconComponent
  }
]
```

5. **Update Service Layer** (`configuration/service.ts`)
```typescript
// Add loading and saving logic for new configuration type
```

## API Endpoints

### GET `/api/admin/payroll/config`
Loads all payroll configurations with scopes

**Response:**
```json
{
  "configurations": {
    "workingHours": { ... },
    "rates": { ... },
    "leaveBenefits": { ... },
    "contributions": { ... },
    "taxBrackets": { ... }
  }
}
```

### POST `/api/admin/payroll/config`
Saves configuration with scope

**Request:**
```json
{
  "type": "rates",
  "config": {
    "overtimeRate1": 1.25,
    "applicationScope": {
      "applicationType": "DEPARTMENT",
      "targetId": "dept-123",
      "targetName": "IT Department",
      "priority": 2
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "rates configuration saved"
}
```

## Testing Checklist

- [ ] Save Working Hours configuration with different scopes
- [ ] Save Pay Rates configuration with different scopes
- [ ] Save Leave Benefits configuration with different scopes
- [ ] Save Contributions configuration with different scopes
- [ ] Save Tax configuration with different scopes
- [ ] Verify configurations display correctly in status card
- [ ] Verify scope badges show correct information
- [ ] Verify active/inactive status indicators work
- [ ] Verify priority-based configuration resolution
- [ ] Test editing configurations from calculations page link
- [ ] Verify unsaved changes tracking
- [ ] Test auto-save functionality
- [ ] Verify database persistence
- [ ] Test configuration loading on page refresh

## Benefits

1. **Flexibility**: Different configurations for different groups
2. **Granularity**: From organization-wide to individual employee
3. **Visibility**: Clear display of active configurations
4. **Maintainability**: Centralized configuration management
5. **Audit Trail**: Track changes and priorities
6. **User Experience**: Read-only display prevents accidental edits
7. **Consistency**: Unified scope selection across all configurations

## Future Enhancements

1. **Configuration History**: Track all configuration changes over time
2. **Effective Dates**: Schedule configuration changes for future dates
3. **Bulk Operations**: Apply configurations to multiple targets at once
4. **Configuration Templates**: Reusable configuration presets
5. **Approval Workflow**: Require approval for configuration changes
6. **Audit Logs**: Detailed logging of who changed what and when
7. **Configuration Comparison**: Compare configurations across scopes
8. **Export/Import**: Configuration backup and restore

## Conclusion

The payroll configuration system is now fully implemented with scope-based application, status tracking, and comprehensive display capabilities. All configurations can be applied to specific groups or individuals while maintaining a default organization-wide setting. The read-only display in the payroll calculations page provides visibility without the risk of accidental modifications.
