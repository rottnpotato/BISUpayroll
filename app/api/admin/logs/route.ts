import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    console.log('Fetching audit logs...')
    
    // Test basic database connection first
    await prisma.$connect()
    console.log('Database connected successfully')
    
    // Check if auditLog table exists
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'audit_logs'
      );
    `
    console.log('Audit logs table exists:', tableExists)
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const entityType = searchParams.get("entityType")
    const action = searchParams.get("action")
    const userId = searchParams.get("userId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const search = searchParams.get("search")
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") || "desc"

    console.log('Search params:', { page, limit, entityType, action, userId, startDate, endDate, search, sortBy, sortOrder })

    const skip = (page - 1) * limit

    const where: any = {}

    if (entityType) {
      where.entityType = entityType
    }

    if (action) {
      where.action = action
    }

    if (userId) {
      where.userId = userId
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate)
      }
    }

    // Add search functionality
    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { entityType: { contains: search, mode: 'insensitive' } },
        { details: { contains: search, mode: 'insensitive' } },
        { ipAddress: { contains: search, mode: 'insensitive' } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } }
      ]
    }

    console.log('Where clause:', where)

    // Build orderBy clause
    const orderBy: any = {}
    const validSortFields = ['createdAt', 'action', 'entityType']
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt'
    orderBy[sortField] = sortOrder === 'asc' ? 'asc' : 'desc'

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true
            }
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      prisma.auditLog.count({ where })
    ])

    console.log(`Found ${logs.length} logs out of ${total} total`)

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })
  } catch (error) {
    console.error("Error fetching audit logs:", error)
    return NextResponse.json(
      { error: "Failed to fetch audit logs", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, action, entityType, entityId, details, ipAddress, userAgent } = body

    if (!action || !entityType) {
      return NextResponse.json(
        { error: "Action and entityType are required" },
        { status: 400 }
      )
    }

    const auditLog = await prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        details,
        ipAddress,
        userAgent
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        }
      }
    })

    return NextResponse.json({ auditLog }, { status: 201 })
  } catch (error) {
    console.error("Error creating audit log:", error)
    return NextResponse.json(
      { error: "Failed to create audit log" },
      { status: 500 }
    )
  }
}
