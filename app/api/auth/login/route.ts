import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser, LoginCredentials } from '@/lib/auth'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Invalid email format').min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const validationResult = loginSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid input data',
          errors: validationResult.error.errors,
        },
        { status: 400 }
      )
    }

    const credentials: LoginCredentials = validationResult.data

    const authResult = await authenticateUser(credentials)

    if (!authResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: authResult.message,
        },
        { status: 401 }
      )
    }

    const response = NextResponse.json({
      success: true,
      message: authResult.message,
      user: authResult.user,
      token: authResult.token,
    })


    console.log("Login API response AUTHRESULT:", authResult.token)
    // Set HTTP-only cookie with the token
    // Use secure: false for local network access, secure: true only for HTTPS
    response.cookies.set('auth-token', authResult.token!, {
      httpOnly: true,
      secure: false, // Allow HTTP for local network
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Login API error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
      },
      { status: 500 }
    )
  }
} 