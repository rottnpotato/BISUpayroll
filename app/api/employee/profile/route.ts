import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 })
    }

    // Verify token and get user
    const user = await verifyToken(token)

    if (!user) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 })
    }

    // Get full user profile data
    const profileData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        position: true,
        department: true,
        hireDate: true,
        status: true,
        address: true,
        emergencyContactName: true,
        emergencyContactRelationship: true,
        emergencyContactPhone: true,
        createdAt: true
      }
    })

    if (!profileData) {
      return NextResponse.json({ 
        success: false, 
        message: 'Profile not found' 
      }, { status: 404 })
    }

    // Transform data to match frontend interface
    const employeeProfile = {
      id: profileData.employeeId || profileData.id,
      fullName: `${profileData.firstName} ${profileData.lastName}`,
      position: profileData.position || 'Not specified',
      department: profileData.department || 'Not specified',
      email: profileData.email,
      phone: profileData.phone || '',
      dateHired: profileData.hireDate ? new Date(profileData.hireDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : 'Not specified',
      employmentStatus: profileData.status,
      employeeType: 'Full-time', // Default value
      address: profileData.address || '',
      emergencyContact: {
        name: profileData.emergencyContactName || '',
        relationship: profileData.emergencyContactRelationship || '',
        phone: profileData.emergencyContactPhone || ''
      }
    }

    return NextResponse.json({
      success: true,
      data: employeeProfile
    })
  } catch (error) {
    console.error('Error fetching employee profile:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 })
    }

    // Verify token and get user
    const user = await verifyToken(token)

    if (!user) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const {
      phone,
      address,
      emergencyContactName,
      emergencyContactRelationship,
      emergencyContactPhone
    } = body

    // Update user profile
    const updatedProfile = await prisma.user.update({
      where: { id: user.id },
      data: {
        phone: phone || null,
        address: address || null,
        emergencyContactName: emergencyContactName || null,
        emergencyContactRelationship: emergencyContactRelationship || null,
        emergencyContactPhone: emergencyContactPhone || null
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        address: true,
        emergencyContactName: true,
        emergencyContactRelationship: true,
        emergencyContactPhone: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedProfile
    })
  } catch (error) {
    console.error('Error updating employee profile:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update profile' },
      { status: 500 }
    )
  }
} 