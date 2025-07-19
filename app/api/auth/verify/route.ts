import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getUserById } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // First check for token in cookies (preferred method)
    let token = request.cookies.get('auth-token')?.value
    
    // If no token in cookies, check Authorization header as fallback
    if (!token) {
      const authHeader = request.headers.get('Authorization')
      token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined
    }
    
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: 'No authentication token found',
        },
        { status: 401 }
      )
    }

    console.log("Token found, attempting to verify")
    const decodedUser = await verifyToken(token)

    if (!decodedUser) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid or expired token',
        },
        { status: 401 }
      )
    }

    // Get fresh user data from database
    const currentUser = await getUserById(decodedUser.id)

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found',
        },
        { status: 404 }
      )
    }

    // Return user data without exposing the token again
    return NextResponse.json({
      success: true,
      user: currentUser
    })
  } catch (error) {
    console.error('Token verification error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
      },
      { status: 500 }
    )
  }
} 