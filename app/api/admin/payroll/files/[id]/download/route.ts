import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/database"
import { decryptPayrollFile, cleanupDecryptedFile } from "@/lib/crypto-utils"
import fs from 'fs'
import path from 'path'
import * as XLSX from 'xlsx'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const fileId = params.id

    // Get file record from database
    const payrollFile = await prisma.payrollFile.findUnique({
      where: { id: fileId },
      include: {
        generatedByUser: {
          select: {
            firstName: true,
            lastName: true,
            employeeId: true
          }
        }
      }
    })

    if (!payrollFile) {
      return NextResponse.json(
        { error: 'Payroll file not found' },
        { status: 404 }
      )
    }

    // Check if file exists on filesystem
    if (!fs.existsSync(payrollFile.filePath)) {
      return NextResponse.json(
        { error: 'File not found on filesystem' },
        { status: 404 }
      )
    }

    let fileBuffer: Buffer
    let fileName = payrollFile.fileName

    // Check if file is encrypted (ends with .enc)
    if (payrollFile.filePath.endsWith('.enc')) {
      try {
        // Decrypt the file
        const decryptResult = await decryptPayrollFile(
          payrollFile.filePath,
          payrollFile.fileName
        )

        // Read the decrypted file
        fileBuffer = await fs.promises.readFile(decryptResult.decryptedFilePath)
        fileName = decryptResult.originalFileName

        // Clean up the temporary decrypted file
        await cleanupDecryptedFile(decryptResult.decryptedFilePath)
        
        console.log(`Admin accessed encrypted payroll file: ${fileName}`)
      } catch (decryptError) {
        console.error('Error decrypting payroll file:', decryptError)
        return NextResponse.json(
          { error: 'Failed to decrypt file' },
          { status: 500 }
        )
      }
    } else {
      // Read unencrypted file directly
      fileBuffer = await fs.promises.readFile(payrollFile.filePath)
      console.log(`Admin accessed unencrypted payroll file: ${fileName}`)
    }

    // Update download count and last download time
    await prisma.payrollFile.update({
      where: { id: fileId },
      data: {
        downloadCount: { increment: 1 },
        lastDownloadAt: new Date()
      }
    })

    // Determine content type based on file extension
    const ext = path.extname(fileName).toLowerCase()
    let contentType = 'application/octet-stream'
    
    // Convert JSON payroll files to Excel automatically
    if (ext === '.json') {
      try {
        const jsonContent = JSON.parse(fileBuffer.toString('utf8'))
        
        if (jsonContent.employees && Array.isArray(jsonContent.employees)) {
          // Flatten the data for Excel
          const rows = jsonContent.employees.map((emp: any) => ({
            'Employee ID': emp.employeeId,
            'Name': emp.name,
            'Department': emp.department,
            'Position': emp.position,
            'Daily Rate': emp.dailyRate,
            'Days Present': emp.daysPresent,
            'Hours Worked': emp.hoursWorked,
            'Regular Pay': emp.regularPay,
            'Overtime Pay': emp.overtimePay,
            'Holiday Pay': emp.holidayPay,
            'Allowances': emp.allowances,
            'Bonuses': emp.bonuses,
            '13th Month Pay': emp.thirteenthMonthPay,
            'Service Incentive Leave': emp.serviceIncentiveLeave,
            'Other Earnings': emp.otherEarnings,
            'Gross Pay': emp.grossPay,
            'Withholding Tax': emp.deductions?.withholdingTax || 0,
            'GSIS': emp.deductions?.gsisContribution || 0,
            'PhilHealth': emp.deductions?.philHealthContribution || 0,
            'Pag-IBIG': emp.deductions?.pagibigContribution || 0,
            'Late Deductions': emp.deductions?.lateDeductions || 0,
            'Loan Deductions': emp.deductions?.loanDeductions || 0,
            'Other Deductions': emp.deductions?.otherDeductions || 0,
            'Total Deductions': emp.totalDeductions,
            'Net Pay': emp.netPay
          }))

          // Create workbook and worksheet
          const worksheet = XLSX.utils.json_to_sheet(rows)
          const workbook = XLSX.utils.book_new()
          XLSX.utils.book_append_sheet(workbook, worksheet, "Payroll Ledger")

          // Generate Excel buffer
          fileBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
          
          // Update filename and content type
          fileName = fileName.replace('.json', '.xlsx')
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        } else {
          // Fallback for non-standard JSON
          contentType = 'application/json'
        }
      } catch (e) {
        console.error('Error converting JSON to Excel:', e)
        contentType = 'application/json'
      }
    } else {
      switch (ext) {
        case '.pdf':
          contentType = 'application/pdf'
          break
        case '.xlsx':
        case '.xls':
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          break
        case '.csv':
          contentType = 'text/csv'
          break
        case '.txt':
          contentType = 'text/plain'
          break
      }
    }

    // Create response with file using Uint8Array for correct BodyInit typing
    const uint8Array = Uint8Array.from(fileBuffer)
    const response = new NextResponse(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

    return response

  } catch (error) {
    console.error('Error downloading payroll file:', error)
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const fileId = params.id
    const body = await request.json()
    const { action } = body

    if (action === 'view') {
      // For viewing, we'll return the file content for preview
      const payrollFile = await prisma.payrollFile.findUnique({
        where: { id: fileId }
      })

      if (!payrollFile) {
        return NextResponse.json(
          { error: 'Payroll file not found' },
          { status: 404 }
        )
      }

      if (!fs.existsSync(payrollFile.filePath)) {
        return NextResponse.json(
          { error: 'File not found on filesystem' },
          { status: 404 }
        )
      }

      // For encrypted files, decrypt for viewing
      if (payrollFile.filePath.endsWith('.enc')) {
        try {
          const decryptResult = await decryptPayrollFile(
            payrollFile.filePath,
            payrollFile.fileName
          )

          // Read the decrypted file content
          const fileContent = await fs.promises.readFile(decryptResult.decryptedFilePath, 'utf8')
          
          // Clean up the temporary decrypted file
          await cleanupDecryptedFile(decryptResult.decryptedFilePath)

          return NextResponse.json({
            fileName: decryptResult.originalFileName,
            content: fileContent,
            checksum: decryptResult.checksum,
            isEncrypted: true
          })
        } catch (decryptError) {
          console.error('Error decrypting file for viewing:', decryptError)
          return NextResponse.json(
            { error: 'Failed to decrypt file for viewing' },
            { status: 500 }
          )
        }
      } else {
        // Read unencrypted file
        const fileContent = await fs.promises.readFile(payrollFile.filePath, 'utf8')
        
        return NextResponse.json({
          fileName: payrollFile.fileName,
          content: fileContent,
          isEncrypted: false
        })
      }
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error processing file action:', error)
    return NextResponse.json(
      { error: 'Failed to process file action' },
      { status: 500 }
    )
  }
}