import { NextRequest } from "next/server"

export interface AuditLogData {
  userId?: string
  action: string
  entityType: string
  entityId?: string
  details?: string
  ipAddress?: string
  userAgent?: string
}

export class AuditLogger {
  /**
   * Log an audit event
   */
  static async log(data: AuditLogData, request?: NextRequest) {
    try {
      let ipAddress = data.ipAddress
      let userAgent = data.userAgent

      // Extract IP and User Agent from request if available
      if (request) {
        ipAddress = ipAddress || this.getClientIP(request)
        userAgent = userAgent || request.headers.get('user-agent') || undefined
      }

      const auditData = {
        ...data,
        ipAddress,
        userAgent
      }

      // Send to audit log API
      const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/admin/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(auditData)
      })

      if (!response.ok) {
        console.error('Failed to create audit log:', await response.text())
      }
    } catch (error) {
      console.error('Error creating audit log:', error)
    }
  }

  /**
   * Log user authentication events
   */
  static async logAuth(userId: string, action: 'login' | 'logout', request?: NextRequest, details?: string) {
    await this.log({
      userId,
      action,
      entityType: 'Auth',
      entityId: userId,
      details: details || `User ${action}`
    }, request)
  }

  /**
   * Log user management events
   */
  static async logUser(userId: string, action: 'create' | 'update' | 'delete', targetUserId: string, request?: NextRequest, details?: string) {
    await this.log({
      userId,
      action,
      entityType: 'User',
      entityId: targetUserId,
      details
    }, request)
  }

  /**
   * Log payroll events
   */
  static async logPayroll(userId: string, action: 'create' | 'update' | 'delete' | 'process', payrollId: string, request?: NextRequest, details?: string) {
    await this.log({
      userId,
      action,
      entityType: 'Payroll',
      entityId: payrollId,
      details
    }, request)
  }

  /**
   * Log attendance events
   */
  static async logAttendance(userId: string, action: 'create' | 'update' | 'delete', attendanceId: string, request?: NextRequest, details?: string) {
    await this.log({
      userId,
      action,
      entityType: 'Attendance',
      entityId: attendanceId,
      details
    }, request)
  }

  /**
   * Log leave request events
   */
  static async logLeave(userId: string, action: 'create' | 'update' | 'approve' | 'reject' | 'delete', leaveId: string, request?: NextRequest, details?: string) {
    await this.log({
      userId,
      action,
      entityType: 'Leave',
      entityId: leaveId,
      details
    }, request)
  }

  /**
   * Log system events
   */
  static async logSystem(userId: string | null, action: string, request?: NextRequest, details?: string) {
    await this.log({
      userId: userId || undefined,
      action,
      entityType: 'System',
      details
    }, request)
  }

  /**
   * Extract client IP address from request
   */
  private static getClientIP(request: NextRequest): string {
    // Check various headers that might contain the real IP
    const forwarded = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    const clientIP = request.headers.get('x-client-ip')
    
    if (forwarded) {
      // x-forwarded-for can contain multiple IPs, take the first one
      return forwarded.split(',')[0].trim()
    }
    
    if (realIP) {
      return realIP
    }
    
    if (clientIP) {
      return clientIP
    }
    
    // Fallback - try to get from connection info or return unknown
    return 'unknown'
  }
}

// Export commonly used action types
export const AuditActions = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LOGIN: 'login',
  LOGOUT: 'logout',
  APPROVE: 'approve',
  REJECT: 'reject',
  PROCESS: 'process',
  VIEW: 'view',
  EXPORT: 'export'
} as const

export const EntityTypes = {
  USER: 'User',
  PAYROLL: 'Payroll',
  ATTENDANCE: 'Attendance',
  LEAVE: 'Leave',
  SYSTEM: 'System',
  AUTH: 'Auth'
} as const
