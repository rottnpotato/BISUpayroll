import { jwtVerify, SignJWT } from 'jose'
import { Role } from '@prisma/client'

export interface AuthUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: Role
  employeeId?: string | null
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key'
const JWT_SECRET_BYTES = new TextEncoder().encode(JWT_SECRET)

export async function generateToken(user: AuthUser): Promise<string> {
  return new SignJWT({
    id: user.id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    employeeId: user.employeeId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d')
    .sign(JWT_SECRET_BYTES)
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET_BYTES)
    
    return {
      id: payload.id as string,
      email: payload.email as string,
      firstName: payload.firstName as string,
      lastName: payload.lastName as string,
      role: payload.role as Role,
      employeeId: payload.employeeId as string | undefined,
    }
  } catch (error) {
    console.error('Token verification error:', error)
    return null
  }
}
