import bcrypt from 'bcryptjs'
import { prisma } from './database'
import { User, Role } from '@prisma/client'
import { generateToken, verifyToken } from './auth-token'
import type { AuthUser } from './auth-token'

export { generateToken, verifyToken }
export type { AuthUser }

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

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
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

    if (user.status === 'INACTIVE') {
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