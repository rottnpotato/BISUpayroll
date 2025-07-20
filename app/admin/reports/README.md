# Admin Reports Module

This module provides comprehensive payroll generation and report management functionality for the BISU Payroll system. The module is built with a modular architecture for maintainability and reusability.

## 📁 Module Structure

```
app/admin/reports/
├── page.tsx                    # Main page component (orchestrates all modules)
├── components/                 # Reusable UI components
│   ├── ReportsHeader.tsx      # Page header with title and description
│   ├── RecentReportsTable.tsx # Reports table with search and filtering
│   ├── PayrollGenerationCard.tsx # Individual payroll template cards
│   ├── PayrollPreviewDialog.tsx  # Modal for payroll preview and printing
│   └── index.ts               # Component exports
├── hooks/                     # Custom React hooks for business logic
│   ├── useReportsState.ts     # Manages page state and filters
│   ├── usePayrollGeneration.ts # Handles payroll generation logic
│   ├── usePrintPayroll.ts     # Manages print functionality
│   └── index.ts               # Hook exports
├── types/                     # TypeScript type definitions
│   └── index.ts               # All interfaces and types
├── constants/                 # Static data and configuration
│   └── index.ts               # Mock data and template configurations
├── utils/                     # Pure utility functions
│   └── index.ts               # Helper functions for data manipulation
└── README.md                  # This documentation file
```

## 🚀 Features

### Recent Reports Management
- **Search Functionality**: Filter reports by name or ID
- **Type Filtering**: Filter by report type (Payroll, Attendance, Tax, etc.)
- **Date Range Filtering**: Filter reports by generation date
- **Status Management**: Track report generation status
- **Action Buttons**: Download and print capabilities

### Payroll Generation
- **Multiple Templates**: 
  - Monthly Payroll Report
  - Department Payroll Report
  - Custom Period Payroll
  - Tax Withholding Summary
- **Date Range Selection**: Flexible period selection for payroll generation
- **Department Filtering**: Generate reports for specific departments
- **Attendance Integration**: Automatic attendance data fetching and calculation

### Payroll Preview & Printing
- **Professional Format**: BISU-standard payroll layout
- **Detailed Calculations**: Hourly rates, deductions, net pay calculations
- **Certification Section**: Official certification fields
- **Print Optimization**: Landscape format optimized for printing
- **Print Window**: Opens new window for clean printing

## 🛠 Technical Implementation

### State Management
The module uses custom hooks to manage state efficiently:

```typescript
// Page state management
const {
  isLoading,
  reports,
  searchTerm,
  selectedReportType,
  // ... other state
} = useReportsState()

// Payroll generation logic
const {
  isGenerating,
  payrollData,
  generatePayroll,
  testUsers
} = usePayrollGeneration()

// Print functionality
const { printPayroll } = usePrintPayroll()
```

### Component Architecture
Components are designed for reusability and single responsibility:

```typescript
// Clean component composition
return (
  <div className="p-6">
    <ReportsHeader 
      title="Payroll Generation"
      description="Generate comprehensive payroll reports"
    />
    
    <RecentReportsTable
      reports={filteredReports}
      searchTerm={searchTerm}
      onTestUsers={testUsers}
    />
    
    <PayrollPreviewDialog
      isOpen={showPreview}
      payrollData={payrollData}
      onPrint={handlePrint}
    />
  </div>
)
```

### Type Safety
Comprehensive TypeScript definitions ensure type safety:

```typescript
interface PayrollData {
  id: string
  user: {
    firstName: string
    lastName: string
    // ... other user fields
  }
  attendanceData: {
    daysPresent: number | null
    hoursWorked: number | string | null
    // ... other attendance fields
  }
  // ... other payroll fields
}
```

## 📊 Data Flow

### Payroll Generation Process
1. **Template Selection**: User selects payroll template and date range
2. **API Call**: `usePayrollGeneration` hook calls `/api/admin/payroll/generate`
3. **Attendance Fetch**: Fetches attendance data for each employee
4. **Calculations**: Performs rate calculations and deduction breakdowns
5. **Preview**: Shows detailed payroll table in modal dialog
6. **Print**: Generates HTML for printing with professional layout

### State Management Flow
1. **Initial Load**: `useReportsState` loads mock reports data
2. **User Interactions**: Updates search terms, filters, and date selections
3. **Data Processing**: `filterReports` utility processes filtered results
4. **UI Updates**: Components re-render based on state changes

## 🎨 UI Components

### ReportsHeader
- Animated header with title and description
- Responsive design for mobile and desktop

### RecentReportsTable
- Complete table with search, filtering, and pagination
- Status badges for report states
- Action buttons for download/print

### PayrollGenerationCard
- Template-based payroll generation
- Date range picker integration
- Department selection for filtered reports
- Loading states during generation

### PayrollPreviewDialog
- Full-screen modal for payroll preview
- Professional BISU payroll format
- Print button with popup window
- Detailed employee calculations

## 🔧 Utility Functions

### generatePrintHTML
Creates professional HTML for payroll printing:
- Landscape orientation
- BISU-standard formatting
- Certification sections
- Proper table styling

### filterReports
Filters reports based on search criteria:
- Name/ID matching
- Type filtering
- Case-insensitive search

## 🧪 Testing Considerations

The modular structure enables comprehensive testing:

### Component Testing
```typescript
// Example component test
import { ReportsHeader } from './ReportsHeader'

test('renders title and description', () => {
  render(<ReportsHeader title="Test" description="Description" />)
  // Test implementation
})
```

### Hook Testing
```typescript
// Example hook test
import { usePayrollGeneration } from './usePayrollGeneration'

test('generates payroll correctly', () => {
  const { result } = renderHook(() => usePayrollGeneration())
  // Test implementation
})
```

### Utility Testing
```typescript
// Example utility test
import { filterReports } from './utils'

test('filters reports by search term', () => {
  const result = filterReports(mockReports, 'test', 'All Types')
  // Test implementation
})
```

## 🚦 Error Handling

The module implements comprehensive error handling:

- **Network Errors**: API call failures with user-friendly messages
- **Validation Errors**: Date range and form validation
- **Print Errors**: Popup blocker and print failure handling
- **Data Errors**: Graceful handling of missing or invalid data

## 🔄 Future Enhancements

The modular structure enables easy additions:

- **New Report Templates**: Add to `reportTemplateData` array
- **Additional Filters**: Extend `useReportsState` hook
- **Export Formats**: Add new export utilities
- **Advanced Calculations**: Extend `usePayrollGeneration` hook
- **Real-time Updates**: Add WebSocket integration
- **Caching**: Implement report caching mechanism

## 🤝 Contributing

When adding new features to this module:

1. **Follow the existing patterns**: Use the established component/hook/utility structure
2. **Add proper types**: Extend existing interfaces or create new ones
3. **Test your components**: Write unit tests for new functionality
4. **Update documentation**: Keep this README current
5. **Maintain consistency**: Follow the existing naming conventions and code style

This modular architecture ensures the reports module remains maintainable, testable, and extensible as the BISU Payroll system evolves.
