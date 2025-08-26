import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import { logActivity } from '@/lib/activityLogger'

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    
    const { userId, currentPassword, newPassword } = await request.json()
    
    if (!userId || !currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'User ID, current password, and new password are required' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Find user by ID
    const user = await User.findById(userId)
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Verify current password (in production, use bcrypt.compare)
    if (user.password !== currentPassword) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      )
    }

    // Update password (in production, hash with bcrypt)
    user.password = newPassword
    await user.save()

    // Log password change activity
    await logActivity(
      user._id.toString(),
      user.name,
      user.email,
      'password_change',
      'User changed password successfully'
    )

    return NextResponse.json({
      message: 'Password changed successfully'
    })

  } catch (error) {
    console.error('Password change error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
