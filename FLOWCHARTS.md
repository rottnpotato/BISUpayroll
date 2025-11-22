# System Flowcharts

These flowcharts describe the logic of the BISUpayroll system, divided into logical sections suitable for printing on letter-sized paper.

## Part 1: Authentication & User Management

```mermaid
graph TD
    %% Page 1: Auth & Users
    Start([Start]) --> Login[User Login]
    Login --> AuthCheck{Authenticated?}
    
    AuthCheck -- No --> Error[Show Error] --> Login
    AuthCheck -- Yes --> RoleCheck{Check Role}
    
    RoleCheck -- Admin --> AdminDash[Admin Dashboard]
    RoleCheck -- Employee --> EmpDash[Employee Dashboard]
    
    subgraph Admin_Functions [Admin Functions]
        AdminDash --> UserMgmt[User Management]
        UserMgmt --> CreateUser[Create Employee]
        UserMgmt --> EditUser[Edit Employee]
        UserMgmt --> AssignRole[Assign Payroll Role]
        
        AdminDash --> SysConfig[System Configuration]
        SysConfig --> SetRates[Set Rates & Rules]
        SysConfig --> SetSched[Set Payroll Schedule]
    end
    
    subgraph Employee_Functions [Employee Functions]
        EmpDash --> ViewProfile[View Profile]
        EmpDash --> ReqUpdate[Request Profile Update]
        EmpDash --> ViewNotifs[View Notifications]
    end
```

## Part 2: Attendance Tracking System

```mermaid
graph TD
    %% Page 2: Attendance
    StartAtt([Start Attendance Process])
    
    subgraph Inputs
        BioLogs[Biometric Logs CSV]
        Manual[Manual Entry]
    end
    
    BioLogs --> Import[Admin Imports CSV]
    Import --> Parse[Parse CSV Data]
    Parse --> CreatePunches[Create AttendancePunch Records]
    
    Manual --> CreatePunches
    
    CreatePunches --> Aggregation[Aggregate Daily Logs]
    Aggregation --> CalcDaily{Calculate Daily Stats}
    
    CalcDaily --> DetTimeIn[Determine Time In/Out]
    CalcDaily --> CalcHours[Calculate Hours Worked]
    CalcDaily --> CheckLate[Check Late/Undertime]
    CalcDaily --> CheckAbsent[Check Absence]
    
    CalcDaily --> CreateRecord[Create/Update AttendanceRecord]
    
    CreateRecord --> Approval{Admin Approval?}
    Approval -- No --> Pending[Status: PENDING]
    Approval -- Yes --> Approved[Status: APPROVED]
    
    Approved --> TriggerPayroll[[Trigger Payroll Recalculation]]
    
    subgraph Overload_Process [Overload/Overtime]
        EmpReq[Employee Request Overload] --> AdminRev[Admin Review]
        AdminRev -- Approve --> OverloadApproved[Overload Record Approved]
        OverloadApproved --> TriggerPayroll
    end
```

## Part 3: Payroll Calculation Logic (Database Level)

```mermaid
graph TD
    %% Page 3: Payroll Calculation
    Trigger[[Start Calculation Trigger]] --> LoadConfig[1. Load System Configs]
    LoadConfig --> GetBase[2. Get Base Salary & Rules]
    
    GetBase --> CalcRates[3. Calculate Daily/Hourly Rates]
    
    CalcRates --> AggData[4. Aggregate Attendance Data]
    AggData --> SumHours[Sum Regular/OT/Late Hours]
    
    subgraph Earnings_Calculation [5. Calculate Earnings]
        SumHours --> CalcReg[Regular Pay]
        SumHours --> CalcOT[Overtime Pay]
        SumHours --> CalcHol[Holiday Pay]
        SumHours --> CalcOverload[Overload Pay]
        
        CalcReg & CalcOT & CalcHol & CalcOverload --> AddAllow[Add Allowances/Bonuses]
        AddAllow --> GrossPay[= GROSS PAY]
    end
    
    subgraph Deductions_Calculation [6-8. Calculate Deductions]
        GrossPay --> CalcGov[Calculate Gov Contributions]
        CalcGov --> GSIS[GSIS]
        CalcGov --> PH[PhilHealth]
        CalcGov --> PagIBIG[Pag-IBIG]
        
        GrossPay --> CalcTax[Calculate Withholding Tax]
        
        GrossPay --> CalcOther[Other Deductions]
        CalcOther --> LateDed[Late/Undertime]
        CalcOther --> Loans[Loans]
    end
    
    GrossPay --> NetCalc{Calculate Net Pay}
    GSIS & PH & PagIBIG & CalcTax & LateDed & Loans --> TotalDed[= TOTAL DEDUCTIONS]
    
    TotalDed --> NetCalc
    NetCalc --> FinalNet[= NET PAY]
    
    FinalNet --> SaveResult[Save to PayrollResult Table]
```

## Part 4: Reporting & Output

```mermaid
graph TD
    %% Page 4: Reporting
    StartRep([Start Reporting])
    
    subgraph Admin_Reports
        AdminView[Admin Payroll View] --> Filter[Filter by Period/Dept]
        Filter --> GenFile[Generate Payroll File]
        
        GenFile --> FormatSelect{Select Format}
        FormatSelect -- PDF --> GenPDF[Generate PDF Report]
        FormatSelect -- Excel --> GenExcel[Generate Excel Sheet]
        FormatSelect -- Bank --> GenBank[Generate Bank Advice]
        
        GenPDF & GenExcel & GenBank --> Download[Download File]
    end
    
    subgraph Employee_Access
        EmpView[Employee Payroll View] --> CheckPaid{Status: PAID?}
        
        CheckPaid -- No --> Wait[Wait for Release]
        CheckPaid -- Yes --> ViewSlip[View Payslip]
        
        ViewSlip --> PrintSlip[Print/Download Payslip]
    end
    
    SaveResult[[PayrollResult Available]] --> AdminView
    SaveResult --> EmpView
```
