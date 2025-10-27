import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/database"
import bcrypt from "bcryptjs"
import { AuditLogger } from "@/lib/audit-logger"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        employeeType: true,
        employeeId: true,
        department: true,
        position: true,
        hireDate: true,
        phone: true,
        address: true,
        emergencyContactName: true,
        emergencyContactRelationship: true,
        emergencyContactPhone: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const {
      firstName,
      lastName,
      email,
      password,
      role,
      employeeType,
      employeeId,
      department,
      position,
      hireDate,
      phone,
      address,
      emergencyContactName,
      emergencyContactRelationship,
      emergencyContactPhone,
      status
    } = body

    // Validate employeeType if provided
    const validEmployeeTypes = ['TEACHING_PERSONNEL', 'NON_TEACHING_PERSONNEL', 'CASUAL', 'PLANTILLA']
    if (employeeType && employeeType !== "" && !validEmployeeTypes.includes(employeeType)) {
      return NextResponse.json(
        { error: `Invalid employee type. Must be one of: ${validEmployeeTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate status if provided
    const validStatuses = ['PERMANENT', 'TEMPORARY', 'CONTRACTUAL', 'INACTIVE']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid employment status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate status if provided
    const validStatuses = ['PERMANENT', 'TEMPORARY', 'CONTRACTUAL', 'INACTIVE']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid employment status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Check if email is taken by another user
    if (email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email }
      })

      if (emailExists) {
        return NextResponse.json(
          { error: "Email already exists" },
          { status: 409 }
        )
      }
    }

    // Check if employeeId is taken by another user
    if (employeeId && employeeId !== existingUser.employeeId) {
      const employeeIdExists = await prisma.user.findUnique({
        where: { employeeId }
      })

      if (employeeIdExists) {
        return NextResponse.json(
          { error: "Employee ID already exists" },
          { status: 409 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {
      firstName,
      lastName,
      email,
      role: role || existingUser.role,
      employeeType: employeeType !== undefined ? (employeeType === "" ? null : employeeType) : existingUser.employeeType,
      employeeId: employeeId || existingUser.employeeId,
      department: department || existingUser.department,
      position: position || existingUser.position,
      hireDate: hireDate ? new Date(hireDate) : existingUser.hireDate,
      phone: phone || existingUser.phone,
      address: address || existingUser.address,
      emergencyContactName: emergencyContactName || existingUser.emergencyContactName,
      emergencyContactRelationship: emergencyContactRelationship || existingUser.emergencyContactRelationship,
      emergencyContactPhone: emergencyContactPhone || existingUser.emergencyContactPhone,
      status: status || existingUser.status
    }

    // Hash password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 12)
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        employeeType: true,
        employeeId: true,
        department: true,
        position: true,
        hireDate: true,
        phone: true,
        updatedAt: true
      }
    })

    // Log the user update
    await AuditLogger.logUser(
      updatedUser.id, // For now using the updated user as the actor, should be replaced with the actual admin user ID
      'update',
      updatedUser.id,
      request,
      `User updated: ${updatedUser.firstName} ${updatedUser.lastName} (${updatedUser.email})`
    )

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true
      }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Prevent deleting admin users (optional safety check)
    if (existingUser.role === 'ADMIN') {
      return NextResponse.json(
        { error: "Cannot delete admin users" },
        { status: 403 }
      )
    }

    // Delete user
    await prisma.user.delete({
      where: { id }
    })

    // Log the user deletion
    await AuditLogger.logUser(
      existingUser.id, // For now using the deleted user as the actor, should be replaced with the actual admin user ID
      'delete',
      existingUser.id,
      request,
      `User deleted: ${existingUser.firstName} ${existingUser.lastName} (${existingUser.email})`
    )

    return NextResponse.json({ 
      message: "User deleted successfully",
      user: existingUser
    })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    )
  }
} 