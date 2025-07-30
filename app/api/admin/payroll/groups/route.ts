import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')
    const scheduleId = searchParams.get('scheduleId')

    // Build where clause
    const whereClause: any = {}
    if (scheduleId) {
      whereClause.payrollScheduleId = scheduleId
    }

    // Get payroll results grouped by schedule and pay period
    const payrollResultsQuery = await prisma.payrollResult.groupBy({
      by: ['payrollScheduleId', 'payPeriodStart', 'payPeriodEnd'],
      where: whereClause,
      _count: {
        userId: true
      },
      _sum: {
        grossPay: true,
        netPay: true,
        totalDeductions: true
      },
      orderBy: {
        payPeriodStart: 'desc'
      },
      take: limit,
      skip: offset
    })

    // Get schedule information and user details for each group
    const groups = await Promise.all(
      payrollResultsQuery.map(async (group: any) => {
        // Get schedule info
        const schedule = group.payrollScheduleId 
          ? await prisma.payrollSchedule.findUnique({
              where: { id: group.payrollScheduleId }
            })
          : null

        // Get department breakdown and latest generated date
        const payrollDetails = await prisma.payrollResult.findMany({
          where: {
            payrollScheduleId: group.payrollScheduleId,
            payPeriodStart: group.payPeriodStart,
            payPeriodEnd: group.payPeriodEnd
          },
          include: {
            user: {
              select: {
                department: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        })

        // Get unique departments
        const departments = [...new Set(
          payrollDetails
            .map((p: any) => p.user.department)
            .filter((dept: any) => dept !== null)
        )] as string[]

        // Get file count for this group
        const fileCount = await prisma.payrollFile.count({
          where: {
            payPeriodStart: group.payPeriodStart,
            payPeriodEnd: group.payPeriodEnd,
            scheduleId: group.payrollScheduleId || undefined
          }
        })

        // Determine status based on approval and payment status
        const allApproved = payrollDetails.every((p: any) => p.isApproved)
        const allPaid = payrollDetails.every((p: any) => p.isPaid)
        
        let status: 'GENERATED' | 'PROCESSING' | 'COMPLETED' | 'APPROVED'
        if (allPaid) {
          status = 'COMPLETED'
        } else if (allApproved) {
          status = 'APPROVED'
        } else if (payrollDetails.some((p: any) => p.status === 'GENERATED')) {
          status = 'GENERATED'
        } else {
          status = 'PROCESSING'
        }

        const latestRecord = payrollDetails[0]
        const generatedBy = latestRecord?.user

        return {
          id: `${group.payrollScheduleId || 'no-schedule'}-${group.payPeriodStart.toISOString()}-${group.payPeriodEnd.toISOString()}`,
          scheduleId: group.payrollScheduleId || 'no-schedule',
          scheduleName: schedule?.name || 'No Schedule',
          payPeriodStart: group.payPeriodStart,
          payPeriodEnd: group.payPeriodEnd,
          employeeCount: group._count.userId,
          totalGrossPay: Number(group._sum.grossPay || 0),
          totalNetPay: Number(group._sum.netPay || 0),
          totalDeductions: Number(group._sum.totalDeductions || 0),
          status,
          generatedAt: latestRecord?.createdAt || new Date(),
          generatedBy: latestRecord?.user.firstName && latestRecord?.user.lastName 
            ? `${latestRecord.user.firstName} ${latestRecord.user.lastName}`
            : undefined,
          departments,
          fileCount
        }
      })
    )

    // Get total count for pagination
    const totalGroups = await prisma.payrollResult.groupBy({
      by: ['payrollScheduleId', 'payPeriodStart', 'payPeriodEnd'],
      where: whereClause,
      _count: {
        userId: true
      }
    })

    return NextResponse.json({
      groups,
      pagination: {
        total: totalGroups.length,
        limit,
        offset,
        hasMore: totalGroups.length > offset + limit
      }
    })

  } catch (error) {
    console.error('Error fetching payroll groups:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payroll groups' },
      { status: 500 }
    )
  }
} 