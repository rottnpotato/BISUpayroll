import { PayrollData, ReportTemplate } from '../types'
import { format } from "date-fns"
import { DateRange } from "react-day-picker"
 
// Build report title mirroring the preview dialog logic
const getReportTitle = (selectedTemplate: ReportTemplate | null, payrollData: PayrollData[]) => {
  switch (selectedTemplate?.type) {
    case 'department':
      return `DEPARTMENT PAYROLL REPORT - ${payrollData[0]?.user?.department || 'UNKNOWN'} DEPARTMENT`
    case 'tax':
      return 'TAX WITHHOLDING & CONTRIBUTIONS SUMMARY REPORT'
    case 'custom':
      return 'CUSTOM PERIOD PAYROLL REPORT'
    default:
      return 'PAYROLL - CONTRACT OF SERVICE INSTRUCTORS - of BISU Balilihan Campus'
  }
}

// Rows for the standard payroll table (parity with preview calculations/columns)
const buildStandardRows = (sortedData: PayrollData[]) => {
  return sortedData.map((employee, index) => {
    const salary = parseFloat(employee.baseSalary?.toString() || '0')

    const regularPay = parseFloat(employee.earningsBreakdown?.regularPay?.toString() || employee.baseSalary?.toString() || '0')
    const overtimePay = parseFloat(employee.earningsBreakdown?.overtimePay?.toString() || employee.overtime?.toString() || '0')
    const holidayPay = parseFloat(employee.earningsBreakdown?.holidayPay?.toString() || '0')
    const allowances = parseFloat(employee.earningsBreakdown?.allowances?.toString() || '0')
    const bonuses = parseFloat(employee.earningsBreakdown?.bonuses?.toString() || employee.bonuses?.toString() || '0')
    const thirteenthMonthPay = parseFloat(employee.earningsBreakdown?.thirteenthMonthPay?.toString() || '0')
    const serviceIncentiveLeave = parseFloat(employee.earningsBreakdown?.serviceIncentiveLeave?.toString() || '0')

    const grossPay = parseFloat(employee.grossPay?.toString() || '0')
    const netPay = parseFloat(employee.netPay?.toString() || '0')

    const gsisContribution = parseFloat(employee.deductionBreakdown?.gsisContribution?.toString() || '0')
    const philHealthContribution = parseFloat(employee.deductionBreakdown?.philHealthContribution?.toString() || '0')
    const pagibigContribution = parseFloat(employee.deductionBreakdown?.pagibigContribution?.toString() || '0')
    const withholdingTax = parseFloat(employee.deductionBreakdown?.withholdingTax?.toString() || '0')
    const lateDeductions = parseFloat(employee.deductionBreakdown?.lateDeductions?.toString() || '0')
    const loanDeductions = parseFloat(employee.deductionBreakdown?.loanDeductions?.toString() || '0')
    const otherDeductions = parseFloat(employee.deductionBreakdown?.otherDeductions?.toString() || '0')

    const hoursWorked = parseFloat(employee.attendanceData?.hoursWorked?.toString() || '0')
    const daysWorked = parseFloat(employee.attendanceData?.daysPresent?.toString() || '0')

    const dailyRate = employee.dailyRate ? parseFloat(employee.dailyRate.toString()) : (salary > 0 ? salary / 22 : 0)
    const hourlyRate = employee.hourlyRate ? parseFloat(employee.hourlyRate.toString()) : (salary > 0 ? salary / (22 * 8) : 0)

    const totalEarnings = regularPay + overtimePay + holidayPay + allowances + bonuses + thirteenthMonthPay + serviceIncentiveLeave
    const totalDeductions = gsisContribution + philHealthContribution + pagibigContribution + withholdingTax + lateDeductions + loanDeductions + otherDeductions

    return `
      <tr style="border-bottom: 1px solid #ccc;">
        <td style="border-right: 1px solid #000; padding: 4px; text-align: center;">${index + 1}</td>
        <td style="border-right: 1px solid #000; padding: 4px;">${employee.user.lastName}, ${employee.user.firstName}</td>
        <td style="border-right: 1px solid #000; padding: 4px;">${employee.user.position || 'N/A'}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: center;">${employee.user.employeeId || 'N/A'}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">₱${hourlyRate.toFixed(2)}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">₱${dailyRate.toFixed(2)}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: center;">${daysWorked.toFixed(1)}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: center;">${hoursWorked.toFixed(1)}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">₱${totalEarnings.toFixed(2)}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">₱${lateDeductions.toFixed(2)}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">₱${grossPay.toFixed(2)}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">₱${withholdingTax.toFixed(2)}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">₱${gsisContribution.toFixed(2)}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">₱${philHealthContribution.toFixed(2)}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">₱${pagibigContribution.toFixed(2)}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">₱${totalDeductions.toFixed(2)}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">₱${netPay.toFixed(2)}</td>
        <td style="padding: 4px;"></td>
      </tr>
    `
  }).join('')
}

// Rows for tax withholding summary
const buildTaxRows = (sortedData: PayrollData[]) => {
  return sortedData.map((employee, index) => {
    const grossPay = parseFloat(employee.grossPay?.toString() || '0')
    const netPay = parseFloat(employee.netPay?.toString() || '0')
    const withholdingTax = employee.taxBreakdown?.withholdingTax || parseFloat(employee.deductionBreakdown?.withholdingTax?.toString() || '0')
    const pagibigContribution = employee.taxBreakdown?.pagibigContribution || parseFloat(employee.deductionBreakdown?.pagibigContribution?.toString() || '0')
    const sssContribution = employee.taxBreakdown?.sssContribution || parseFloat(employee.deductionBreakdown?.sssContribution?.toString() || '0')
    const philHealthContribution = employee.taxBreakdown?.philHealthContribution || parseFloat(employee.deductionBreakdown?.philHealthContribution?.toString() || '0')
    const totalContributions = employee.taxBreakdown?.totalContributions || (withholdingTax + pagibigContribution + sssContribution + philHealthContribution)

    return `
      <tr style="border-bottom: 1px solid #ccc;">
        <td style="border-right: 1px solid #000; padding: 4px; text-align: center;">${index + 1}</td>
        <td style="border-right: 1px solid #000; padding: 4px;">${employee.user.lastName}, ${employee.user.firstName}</td>
        <td style="border-right: 1px solid #000; padding: 4px;">${employee.user.position || 'N/A'}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: center;">${employee.user.employeeId || 'N/A'}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: center;">${employee.user.department || 'N/A'}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">₱${grossPay.toFixed(2)}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">₱${withholdingTax.toFixed(2)}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">₱${pagibigContribution.toFixed(2)}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">₱${sssContribution.toFixed(2)}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">₱${philHealthContribution.toFixed(2)}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">₱${totalContributions.toFixed(2)}</td>
        <td style="padding: 4px; text-align: right;">₱${netPay.toFixed(2)}</td>
      </tr>
    `
  }).join('')
}

// Rows for department payroll
const buildDepartmentRows = (sortedData: PayrollData[]) => {
  return sortedData.map((employee, index) => {
    const salary = parseFloat(employee.baseSalary?.toString() || '0')
    const grossPay = parseFloat(employee.grossPay?.toString() || '0')
    const deductions = parseFloat(employee.deductions?.toString() || '0')
    const netPay = parseFloat(employee.netPay?.toString() || '0')
    const hoursWorked = parseFloat(employee.attendanceData?.hoursWorked?.toString() || '0')

    return `
      <tr style="border-bottom: 1px solid #ccc;">
        <td style="border-right: 1px solid #000; padding: 4px; text-align: center;">${index + 1}</td>
        <td style="border-right: 1px solid #000; padding: 4px;">${employee.user.lastName}, ${employee.user.firstName}</td>
        <td style="border-right: 1px solid #000; padding: 4px;">${employee.user.position || 'N/A'}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: center;">${employee.user.employeeId || 'N/A'}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">₱${salary.toFixed(2)}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: center;">${employee.attendanceData?.daysPresent || 0}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: center;">${hoursWorked.toFixed(1)}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">₱${grossPay.toFixed(2)}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">₱${deductions.toFixed(2)}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">₱${netPay.toFixed(2)}</td>
        <td style="padding: 4px;"></td>
      </tr>
    `
  }).join('')
}

export const generatePrintHTML = (data: PayrollData[], dateRange: DateRange, selectedTemplate: ReportTemplate | null) => {
  const sortedData = data.sort((a, b) => 
    `${a.user.lastName}, ${a.user.firstName}`.localeCompare(`${b.user.lastName}, ${b.user.firstName}`)
  )

  const reportTitle = getReportTitle(selectedTemplate, data)

  const isTax = selectedTemplate?.type === 'tax'
  const isDepartment = selectedTemplate?.type === 'department'

  const tableHead = isTax
    ? `
      <thead>
        <tr>
          <th>Serial No.</th>
          <th>Name</th>
          <th>Position</th>
          <th>Employee No.</th>
          <th>Department</th>
          <th>Gross Pay</th>
          <th>Withholding Tax (12%)</th>
          <th>Pag-IBIG (2%)</th>
          <th>SSS (4.5%)</th>
          <th>PhilHealth (2.75%)</th>
          <th>Total Contributions</th>
          <th>Net Pay</th>
        </tr>
      </thead>
    `
    : isDepartment
    ? `
      <thead>
        <tr>
          <th>Serial No.</th>
          <th>Name</th>
          <th>Position</th>
          <th>Employee No.</th>
          <th>Monthly Salary</th>
          <th>Days Present</th>
          <th>Hours Worked</th>
          <th>Gross Pay</th>
          <th>Total Deductions</th>
          <th>Net Pay</th>
          <th>Signature</th>
        </tr>
      </thead>
    `
    : `
      <thead>
        <tr>
          <th rowspan="2">Serial No.</th>
          <th rowspan="2">Name</th>
          <th rowspan="2">Position</th>
          <th rowspan="2">Employee No.</th>
          <th colspan="7">Compensations</th>
          <th colspan="5">Deductions/Contributions</th>
          <th rowspan="2">Net Amount Due</th>
          <th rowspan="2">Signature</th>
        </tr>
        <tr>
          <th>Rate per Hour</th>
          <th>Rate per Day</th>
          <th>No. of Days</th>
          <th>No. of Hours</th>
          <th>Earned for Period</th>
          <th>Less: Undertime</th>
          <th>Gross Amount Earned</th>
          <th>Withholding Tax</th>
          <th>GSIS Contribution</th>
          <th>PhilHealth Contribution</th>
          <th>Pag-ibig Contribution</th>
          <th>Total Deductions</th>
        </tr>
      </thead>
    `

  const tableBody = data.length === 0
    ? (isTax
      ? `<tr><td colspan="12" style="padding: 16px; text-align: center; color: #6b7280;">No tax withholding data available. Please generate report first.</td></tr>`
      : isDepartment
      ? `<tr><td colspan="11" style="padding: 16px; text-align: center; color: #6b7280;">No department payroll data available. Please generate report first.</td></tr>`
      : `<tr><td colspan="18" style="padding: 16px; text-align: center; color: #6b7280;">No employee data available. Please generate payroll first.</td></tr>`)
    : (isTax ? buildTaxRows(sortedData) : isDepartment ? buildDepartmentRows(sortedData) : buildStandardRows(sortedData))

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>BISU Payroll Report</title>
      <style>
        @page {
          size: landscape;
          margin: 0.5in;
        }
        body {
          font-family: Arial, sans-serif;
          font-size: 12px;
          margin: 0;
          padding: 0;
          color: black;
        }
        .header {
          text-align: center;
          margin-bottom: 16px;
        }
        .header h1 {
          font-size: 20px;
          margin: 0 0 10px 0;
          font-weight: bold;
        }
        .header h2 {
          font-size: 16px;
          margin: 0 0 16px 0;
          font-weight: normal;
        }
        .info-section {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .acknowledgment {
          margin-bottom: 12px;
          font-size: 12px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #000;
        }
        th, td {
          border: 1px solid #000;
          padding: 4px;
          font-size: 10px;
        }
        th {
          background-color: #f5f5f5;
          font-weight: bold;
          text-align: center;
        }
        .cert-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-top: 30px;
        }
        .cert-box {
          border: 1px solid #000;
          padding: 10px;
          position: relative;
          min-height: 60px;
        }
        .cert-letter {
          position: absolute;
          top: 2px;
          right: 5px;
          width: 15px;
          height: 15px;
          border: 1px solid #000;
          text-align: center;
          font-weight: bold;
          font-size: 10px;
        }
        .cert-content {
          font-size: 9px;
        }
        @media print {
          body { -webkit-print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${reportTitle}</h1>
        <h2>For the Period: ${format(dateRange.from!, 'MMMM dd, yyyy')} - ${format(dateRange.to!, 'MMMM dd, yyyy')}</h2>
      </div>

      <div class="info-section">
        <div>
          <p><strong>Entity Name:</strong> BISU Balilihan Campus</p>
          <p><strong>Fund Cluster:</strong> 05-Internally Generated Funds</p>
          ${selectedTemplate?.type === 'department' && data?.[0]?.user?.department ? `<p><strong>Department:</strong> ${data[0].user.department}</p>` : ''}
        </div>
        <div style="text-align: right;">
          <p><strong>Report no.:</strong> _________________________</p>
          <p><strong>Sheet no.:</strong> 1 of 1</p>
          <p><strong>Generated:</strong> ${format(new Date(), 'MMMM dd, yyyy HH:mm')}</p>
        </div>
      </div>

      ${selectedTemplate?.type !== 'tax' ? `
        <div class="acknowledgment">
          <p>We acknowledge the receipt of cash shown opposite to our name as full compensation for services rendered for the period covered ${format(dateRange.from!, 'MMMM dd, yyyy')} - ${format(dateRange.to!, 'MMMM dd, yyyy')}.</p>
        </div>
      ` : ''}

      <table>
        ${tableHead}
        <tbody>
          ${tableBody}
        </tbody>
      </table>

      ${selectedTemplate?.type !== 'tax' ? `
        <div class="cert-section">
          <div class="cert-box">
            <div class="cert-letter">A</div>
            <div class="cert-content">
              <p><strong>Certified:</strong></p>
              <p><strong>Shiela Olaguir</strong></p>
              <p>Dean of CCIS</p>
            </div>
          </div>
          <div class="cert-box">
            <div class="cert-letter">B</div>
            <div class="cert-content">
              <p><strong>Certified:</strong></p>
              <p><strong>Jean F. Nebrea</strong></p>
              <p>Campus Director</p>
            </div>
          </div>
          <div class="cert-box">
            <div class="cert-letter">C</div>
            <div class="cert-content">
              <p><strong>Certified:</strong></p>
              <p><strong>Julie Mae Sembrano</strong></p>
              <p>Accountant II</p>
            </div>
          </div>
          <div class="cert-box">
            <div class="cert-letter">D</div>
            <div class="cert-content">
              <p><strong>Certified:</strong></p>
              <p><strong>Anneli Uy</strong></p>
              <p>Disbursing Officer</p>
            </div>
          </div>
        </div>
      ` : ''}

      ${selectedTemplate?.type !== 'tax' ? `
        <div style="margin-top: 16px;">
          <div class="cert-box">
            <div class="cert-content">
              <p><strong>Additional Certifiers:</strong></p>
              <p><strong>Junrey Poyos</strong> - Dean of CTAS</p>
              <p><strong>Mary Joyce Gudmalin</strong> - Dean of CCJ</p>
            </div>
          </div>
        </div>
      ` : ''}
    </body>
    </html>
  `
}

export const filterReports = (reports: any[], searchTerm: string, selectedReportType: string) => {
  return reports.filter(report => {
    const matchesSearch = 
      report.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      report.id.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = 
      selectedReportType === "All Types" || 
      report.type.toLowerCase() === selectedReportType.toLowerCase()
    
    return matchesSearch && matchesType
  })
} 

// Parse saved JSON ledger content into PayrollData[] and DateRange
export const parseSavedLedgerJsonToPayrollData = (
  content: string
): { payrollData: PayrollData[]; dateRange: DateRange } => {
  let parsed: any
  try {
    parsed = JSON.parse(content)
  } catch (error) {
    throw new Error("Invalid JSON content for saved ledger")
  }

  const from = parsed.payPeriodStart ? new Date(parsed.payPeriodStart) : undefined
  const to = parsed.payPeriodEnd ? new Date(parsed.payPeriodEnd) : undefined

  if (!from || !to || isNaN(from.getTime()) || isNaN(to.getTime())) {
    throw new Error("Saved ledger is missing a valid pay period range")
  }

  const employees: any[] = Array.isArray(parsed.employees) ? parsed.employees : []

  const payrollData: PayrollData[] = employees.map((emp: any, index: number) => {
    const name: string = emp.name || "Unknown"
    let firstName = name
    let lastName = ""
    if (name.includes(",")) {
      const parts = name.split(",")
      lastName = (parts[0] || "").trim()
      firstName = (parts.slice(1).join(",") || "").trim()
    } else {
      const parts = name.trim().split(/\s+/)
      if (parts.length > 1) {
        lastName = parts.pop() as string
        firstName = parts.join(" ")
      }
    }

    const deductions = emp.deductions || {}

    return {
      id: String(index + 1),
      userId: emp.employeeId || String(index + 1),
      user: {
        id: emp.employeeId || String(index + 1),
        firstName,
        lastName,
        employeeId: emp.employeeId || null,
        department: emp.department || parsed.department || null,
        position: emp.position || null
      },
      baseSalary: Number(emp.baseSalary || 0),
      grossPay: Number(emp.grossPay || 0),
      netPay: Number(emp.netPay || 0),
      totalDeductions: Number(emp.totalDeductions || 0),
      earningsBreakdown: {
        regularPay: Number(emp.regularPay || 0),
        overtimePay: Number(emp.overtimePay || 0),
        holidayPay: Number(emp.holidayPay || 0),
        allowances: Number(emp.allowances || 0),
        bonuses: Number(emp.bonuses || 0),
        thirteenthMonthPay: Number(emp.thirteenthMonthPay || 0),
        serviceIncentiveLeave: Number(emp.serviceIncentiveLeave || 0),
        otherEarnings: Number(emp.otherEarnings || 0)
      },
      deductionBreakdown: {
        withholdingTax: deductions.withholdingTax ?? 0,
        gsisContribution: deductions.gsisContribution ?? 0,
        philHealthContribution: deductions.philHealthContribution ?? 0,
        pagibigContribution: deductions.pagibigContribution ?? 0,
        lateDeductions: deductions.lateDeductions ?? 0,
        loanDeductions: deductions.loanDeductions ?? 0,
        otherDeductions: deductions.otherDeductions ?? 0,
        citySavingsLoan: deductions.citySavingsLoan ?? 0,
        sssContribution: deductions.sssContribution ?? 0
      },
      attendanceData: {
        daysPresent: Number(emp.daysPresent || 0),
        hoursWorked: Number(emp.hoursWorked || 0),
        lateHours: Number(emp.lateHours || 0)
      },
      payPeriodStart: parsed.payPeriodStart,
      payPeriodEnd: parsed.payPeriodEnd
    }
  })

  const dateRange: DateRange = { from, to }

  return { payrollData, dateRange }
}