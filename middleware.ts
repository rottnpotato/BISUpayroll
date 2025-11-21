import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from './lib/auth-token'

const publicPaths = ['/login']
const adminPaths = ['/admin']
const employeePaths = ['/employee']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Allow public paths
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Get auth token from cookies
  const token = request.cookies.get('auth-token')?.value

  console.log("Middleware - Auth token:", token)
  
  // Redirect to login if no token
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Verify token
  try {
    const user = await verifyToken(token)
    
    if (!user) {
      // Invalid token, redirect to login
      console.log("Middleware - Invalid token, redirecting to login")
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.delete('auth-token')
      return response
    }

    // Check role-based access
    if (adminPaths.some(path => pathname.startsWith(path))) {
      if (user.role !== 'ADMIN') {
        console.log("Middleware - User is not an admin, redirecting to employee dashboard")
        return NextResponse.redirect(new URL('/employee/dashboard', request.url))
      }
    }

    if (employeePaths.some(path => pathname.startsWith(path))) {
      if (user.role !== 'EMPLOYEE') {
        console.log("Middleware - User is not an employee, redirecting to admin dashboard")
        return NextResponse.redirect(new URL('/admin/dashboard', request.url))
      }
    }

    // Redirect root to appropriate dashboard
    if (pathname === '/') {
      if (user.role === 'ADMIN') {
        console.log("Middleware - User is an admin, redirecting to admin dashboard")
        return NextResponse.redirect(new URL('/admin/dashboard', request.url))
      } else {
        console.log("Middleware - User is an employee, redirecting to employee dashboard")
        return NextResponse.redirect(new URL('/employee/dashboard', request.url))
      }
    }

    return NextResponse.next()
  } catch (error) {
    console.error("Middleware - Token verification error:", error)
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('auth-token')
    return response
  }
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|LOGO_BISU.svg|bagong-pilipinas.png|tuvlogo.png).*)',
  ],
} 