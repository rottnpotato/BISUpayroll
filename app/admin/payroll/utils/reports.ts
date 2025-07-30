import { PayrollData } from '../types'
import { format } from "date-fns"
import { DateRange } from "react-day-picker"

export const generatePrintHTML = (data: PayrollData[], dateRange: DateRange) => {
  const sortedData = data.sort((a, b) => 
    `${a.user.lastName}, ${a.user.firstName}`.localeCompare(`${b.user.lastName}, ${b.user.firstName}`)
  )

  const tableRows = sortedData.map((employee, index) => {
    const salary = parseFloat(employee.user.salary?.toString() || '0')
    const baseSalary = parseFloat(employee.baseSalary?.toString() || '0')
    const deductions = parseFloat(employee.deductions?.toString() || '0')
    const netPay = parseFloat(employee.netPay?.toString() || '0')
    const hoursWorked = parseFloat(employee.attendanceData?.hoursWorked?.toString() || '0')
    const lateHours = parseFloat(employee.attendanceData?.lateHours?.toString() || '0')
    const withholdingTax = parseFloat(employee.deductionBreakdown?.withholdingTax?.toString() || '0')
    const citySavingsLoan = parseFloat(employee.deductionBreakdown?.citySavingsLoan?.toString() || '0')
    const pagibigContribution = parseFloat(employee.deductionBreakdown?.pagibigContribution?.toString() || '0')

    const hourlyRate = salary > 0 ? salary / (30 * 8) : 0
    const dailyRate = salary > 0 ? salary / 30 : 0
    const earnedForPeriod = baseSalary
    const undertimeDeduction = lateHours * hourlyRate * 0.5
    const grossAmount = earnedForPeriod - undertimeDeduction

    return `
      <tr style="border-bottom: 1px solid #ccc;">
        <td style="border-right: 1px solid #000; padding: 4px; text-align: center;">${index + 1}</td>
        <td style="border-right: 1px solid #000; padding: 4px;">${employee.user.lastName}, ${employee.user.firstName}</td>
        <td style="border-right: 1px solid #000; padding: 4px;">${employee.user.position || 'N/A'}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: center;">${employee.user.employeeId || 'N/A'}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">₱${hourlyRate.toFixed(2)}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">₱${dailyRate.toFixed(2)}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: center;">${employee.attendanceData?.daysPresent || 0}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: center;">${hoursWorked.toFixed(1)}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">₱${earnedForPeriod.toFixed(2)}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">₱${undertimeDeduction.toFixed(2)}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">₱${grossAmount.toFixed(2)}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">₱${withholdingTax.toFixed(2)}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">₱${citySavingsLoan.toFixed(2)}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">₱${pagibigContribution.toFixed(2)}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">₱${deductions.toFixed(2)}</td>
        <td style="border-right: 1px solid #000; padding: 4px; text-align: right;">₱${netPay.toFixed(2)}</td>
        <td style="padding: 4px;"></td>
      </tr>
    `
  }).join('')

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
          font-size: 10px;
          margin: 0;
          padding: 0;
          color: black;
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
        }
        .header h1 {
          font-size: 16px;
          margin: 0 0 10px 0;
          font-weight: bold;
        }
        .header h2 {
          font-size: 14px;
          margin: 0 0 20px 0;
          font-weight: normal;
        }
        .info-section {
          display: flex;
          justify-content: space-between;
          margin-bottom: 15px;
        }
        .acknowledgment {
          margin-bottom: 15px;
          font-size: 10px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #000;
        }
        th, td {
          border: 1px solid #000;
          padding: 2px;
          font-size: 8px;
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
        <h1>PAYROLL - CONTRACT OF SERVICE INSTRUCTORS - of BISU Balilihan Campus</h1>
        <h2>For the Period: ${format(dateRange.from!, 'MMMM dd, yyyy')} - ${format(dateRange.to!, 'MMMM dd, yyyy')}</h2>
      </div>

      <div class="info-section">
        <div>
          <p><strong>Entity Name:</strong> BISU Balilihan Campus</p>
          <p><strong>Fund Cluster:</strong> 05-Internally Generated Funds</p>
        </div>
        <div style="text-align: right;">
          <p><strong>Payroll no.:</strong> _________________________</p>
          <p><strong>Sheet no.:</strong> 1 of 1</p>
        </div>
      </div>

      <div class="acknowledgment">
        <p>We acknowledge the receipt of cash shown opposite to our name as full compensation for services rendered for the period covered ${format(dateRange.from!, 'MMMM dd, yyyy')} - ${format(dateRange.to!, 'MMMM dd, yyyy')}.</p>
      </div>

      <table>
        <thead>
          <tr>
            <th rowspan="2">Serial No.</th>
            <th rowspan="2">Name</th>
            <th rowspan="2">Position</th>
            <th rowspan="2">Employee No.</th>
            <th colspan="7">Compensations</th>
            <th colspan="4">Deductions/Contributions</th>
            <th rowspan="2">Net Amount Due</th>
            
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
            <th>City Savings Loan</th>
            <th>Pag-ibig Contribution</th>
            <th>Total Deductions</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>

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

      <div style="margin-top: 20px;">
        <div class="cert-box">
          <div class="cert-content">
            <p><strong>Additional Certifiers:</strong></p>
            <p><strong>Junrey Poyos</strong> - Dean of CTAS</p>
            <p><strong>Mary Joyce Gudmalin</strong> - Dean of CCJ</p>
          </div>
        </div>
      </div>
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