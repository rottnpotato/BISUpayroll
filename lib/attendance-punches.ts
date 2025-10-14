import { Prisma } from "@prisma/client"
import { prisma } from "./database"
import { getManilaHours, getManilaMinutes, manilaStartOfDayUTC, manilaEndOfDayUTC, toManilaDateKey } from "./timezone"

const WORK_START_MINUTES = 8 * 60
const LATE_GRACE_MINUTES = 15

export interface PunchAttendanceFilters {
  startDate?: Date
  endDate?: Date
  userId?: string
  department?: string
}

export interface PunchAttendancePagination {
  page: number
  limit: number
  total: number
  pages: number
}

export interface PunchAttendanceRecord {
  id: string
  userId: string
  date: string
  timeIn: string | null
  timeOut: string | null
  hoursWorked: number | null
  isLate: boolean
  isAbsent: boolean
  status: "APPROVED"
  rejectionReason: null
  approvedById: null
  approvedAt: null
  user: {
    id: string
    firstName: string
    lastName: string
    employeeId: string | null
    department: string | null
    position: string | null
  }
  approvedBy: null
  source: "PUNCH"
}

interface PunchRow {
  user_id: string
  day: string
  time_in: Date | null
  time_out: Date | null
  in_count: number
  out_count: number
  first_name: string
  last_name: string
  employee_id: string | null
  department: string | null
  position: string | null
}

interface PunchCountRow {
  total: number
  unique_employees: number
}

const ORDER_CLAUSE = Prisma.sql`ORDER BY pd.day DESC, u."lastName" ASC, u."firstName" ASC`

const buildPunchDataCte = (filters: PunchAttendanceFilters) => {
  const conditions: Prisma.Sql[] = []

  if (filters.startDate) {
    conditions.push(Prisma.sql`ap."timestamp" >= ${manilaStartOfDayUTC(filters.startDate)}`)
  }

  if (filters.endDate) {
    conditions.push(Prisma.sql`ap."timestamp" <= ${manilaEndOfDayUTC(filters.endDate)}`)
  }

  if (filters.userId) {
    conditions.push(Prisma.sql`ap."userId" = ${filters.userId}`)
  }

  if (filters.department) {
    conditions.push(Prisma.sql`u."department" = ${filters.department}`)
  }

  const whereClause = conditions.length > 0
          ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
    : Prisma.sql``

  return Prisma.sql`
    WITH punch_data AS (
      SELECT
  ap."userId" AS user_id,
  -- Derive the day key in Manila by shifting +8h before DATE()
  DATE(ap."timestamp" + INTERVAL '8 hours') AS day,
        MIN(CASE WHEN ap."type" = 'IN' THEN ap."timestamp" END) AS time_in,
        MAX(CASE WHEN ap."type" = 'OUT' THEN ap."timestamp" END) AS time_out,
        COUNT(*) FILTER (WHERE ap."type" = 'IN') AS in_count,
        COUNT(*) FILTER (WHERE ap."type" = 'OUT') AS out_count
      FROM attendance_punches ap
      JOIN users u ON u.id = ap."userId"
      ${whereClause}
  GROUP BY ap."userId", DATE(ap."timestamp" + INTERVAL '8 hours')
    )
  `
}

const toAttendanceRecord = (row: PunchRow): PunchAttendanceRecord => {
  const timeInDate = row.time_in ? new Date(row.time_in) : null
  const timeOutDate = row.time_out ? new Date(row.time_out) : null

  let hoursWorked: number | null = null
  if (timeInDate && timeOutDate && timeOutDate.getTime() > timeInDate.getTime()) {
    const diffInHours = (timeOutDate.getTime() - timeInDate.getTime()) / (1000 * 60 * 60)
    hoursWorked = Math.round(diffInHours * 100) / 100
  }

  const timeInMinutes = timeInDate ? (getManilaHours(timeInDate) * 60 + getManilaMinutes(timeInDate)) : null
  const isLate = timeInMinutes !== null ? timeInMinutes > (WORK_START_MINUTES + LATE_GRACE_MINUTES) : false
  const isAbsent = !timeInDate

  // Build a date string representing the Manila day at midday UTC for stability
  // row.day is a date (derived via DATE(...)), treat it as UTC midnight of that date, then compose ISO.
  let dateMiddayIso: string
  try {
    const dayDate = new Date(row.day)
    if (isNaN(dayDate.getTime())) throw new Error(`Invalid date: ${row.day}`)
    const year = dayDate.getUTCFullYear()
    const month = String(dayDate.getUTCMonth() + 1).padStart(2, '0')
    const day = String(dayDate.getUTCDate()).padStart(2, '0')
    dateMiddayIso = `${year}-${month}-${day}T12:00:00.000Z`
  } catch (error) {
    console.error('Error parsing date for attendance record:', row.day, error)
    const now = new Date()
    const year = now.getUTCFullYear()
    const month = String(now.getUTCMonth() + 1).padStart(2, '0')
    const day = String(now.getUTCDate()).padStart(2, '0')
    dateMiddayIso = `${year}-${month}-${day}T12:00:00.000Z`
  }

  return {
    id: `punch:${row.user_id}:${row.day}`,
    userId: row.user_id,
    date: dateMiddayIso,
    timeIn: timeInDate ? timeInDate.toISOString() : null,
    timeOut: timeOutDate ? timeOutDate.toISOString() : null,
    hoursWorked,
    isLate,
    isAbsent,
    status: "APPROVED",
    rejectionReason: null,
    approvedById: null,
    approvedAt: null,
    user: {
      id: row.user_id,
      firstName: row.first_name,
      lastName: row.last_name,
      employeeId: row.employee_id,
      department: row.department,
      position: row.position
    },
    approvedBy: null,
    source: "PUNCH"
  }
}

const runPunchDataQuery = async <T = PunchRow>(
  filters: PunchAttendanceFilters,
  body: Prisma.Sql
): Promise<T[]> => {
  const cte = buildPunchDataCte(filters)
  const query = Prisma.sql`${cte} ${body}`
  return prisma.$queryRaw<T[]>(query)
}

export const fetchPunchAttendance = async (
  filters: PunchAttendanceFilters,
  page?: number,
  limit?: number
): Promise<{
  records: PunchAttendanceRecord[]
  pagination: PunchAttendancePagination
  uniqueEmployees: number
}> => {
  const safeLimit = limit && limit > 0 ? limit : 10
  const safePage = page && page > 0 ? page : 1
  const skip = (safePage - 1) * safeLimit

  const paginationClause = Prisma.sql`OFFSET ${skip} LIMIT ${safeLimit}`

  const rows = await runPunchDataQuery<PunchRow>(
    filters,
    Prisma.sql`
      SELECT
        pd.user_id,
        pd.day,
        pd.time_in,
        pd.time_out,
        pd.in_count,
        pd.out_count,
        u."firstName" AS first_name,
        u."lastName" AS last_name,
        u."employeeId" AS employee_id,
        u."department" AS department,
        u."position" AS position
      FROM punch_data pd
      JOIN users u ON u.id = pd.user_id
      ${ORDER_CLAUSE}
      ${paginationClause}
    `
  )

  const counts = await runPunchDataQuery<PunchCountRow>(
    filters,
    Prisma.sql`
      SELECT COUNT(*)::INT AS total, COUNT(DISTINCT user_id)::INT AS unique_employees
      FROM punch_data
    `
  )

  const totalRow = counts?.[0]
  const total = totalRow ? Number(totalRow.total) : 0
  const uniqueEmployees = totalRow ? Number(totalRow.unique_employees) : 0
  const pages = safeLimit > 0 ? Math.ceil(total / safeLimit) : 1

  return {
    records: rows.map(toAttendanceRecord),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      pages
    },
    uniqueEmployees
  }
}

export const fetchAllPunchAttendance = async (
  filters: PunchAttendanceFilters
): Promise<{
  records: PunchAttendanceRecord[]
  uniqueEmployees: number
}> => {
  const rows = await runPunchDataQuery<PunchRow>(
    filters,
    Prisma.sql`
      SELECT
        pd.user_id,
        pd.day,
        pd.time_in,
        pd.time_out,
        pd.in_count,
        pd.out_count,
        u."firstName" AS first_name,
        u."lastName" AS last_name,
        u."employeeId" AS employee_id,
        u."department" AS department,
        u."position" AS position
      FROM punch_data pd
      JOIN users u ON u.id = pd.user_id
      ${ORDER_CLAUSE}
    `
  )

  const counts = await runPunchDataQuery<PunchCountRow>(
    filters,
    Prisma.sql`
      SELECT COUNT(*)::INT AS total, COUNT(DISTINCT user_id)::INT AS unique_employees
      FROM punch_data
    `
  )

  const totalRow = counts?.[0]
  const uniqueEmployees = totalRow ? Number(totalRow.unique_employees) : 0

  return {
    records: rows.map(toAttendanceRecord),
    uniqueEmployees
  }
}
