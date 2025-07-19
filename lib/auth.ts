import { jwtVerify, SignJWT } from 'jose'
import bcrypt from 'bcryptjs'
import { prisma } from './database'
import { User, Role } from '@prisma/client'

export interface AuthUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: Role
  employeeId?: string | null
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthResult {
  success: boolean
  user?: AuthUser
  token?: string
  message?: string
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key'
// Convert JWT_SECRET string to Uint8Array for jose library
const JWT_SECRET_BYTES = new TextEncoder().encode(JWT_SECRET)

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export async function generateToken(user: AuthUser): Promise<string> {
  // Use jose's SignJWT instead of jsonwebtoken
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
    .setExpirationTime('7d')
    .sign(JWT_SECRET_BYTES)
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    // Use jose's jwtVerify instead of jsonwebtoken.verify
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

export async function authenticateUser(credentials: LoginCredentials): Promise<AuthResult> {
  try {
    const { email, password } = credentials

    if (!email || !password) {
      return {
        success: false,
        message: 'Email and password are required',
      }
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        employeeId: true,
      },
    })

    if (!user) {
      return {
        success: false,
        message: 'Invalid email or password',
      }
    }

    if (user.status !== 'ACTIVE') {
      return {
        success: false,
        message: 'Account is not active. Please contact administrator.',
      }
    }

    const isPasswordValid = await comparePassword(password, user.password)

    if (!isPasswordValid) {
      return {
        success: false,
        message: 'Invalid email or password',
      }
    }

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      employeeId: user.employeeId,
    }

    const token = await generateToken(authUser)

    return {
      success: true,
      user: authUser,
      token,
      message: 'Login successful',
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return {
      success: false,
      message: 'An error occurred during authentication',
    }
  }
}

export async function getUserById(id: string): Promise<AuthUser | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        employeeId: true,
      },
    })

    return user
  } catch (error) {
    console.error('Error fetching user:', error)
    return null
  }
}

export async function updateUserPassword(userId: string, newPassword: string): Promise<boolean> {
  try {
    const hashedPassword = await hashPassword(newPassword)
    
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    })

    return true
  } catch (error) {
    console.error('Error updating password:', error)
    return false
  }
} 