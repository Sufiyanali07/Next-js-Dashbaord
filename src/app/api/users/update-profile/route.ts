import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import { logActivity } from '@/lib/activityLogger'

export async function PUT(request: NextRequest) {
  try {
    await dbConnect()
    
    const { userId, name, email, phone, bio, role } = await request.json()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
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

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } })
      if (existingUser) {
        return NextResponse.json(
          { error: 'Email is already in use by another user' },
          { status: 400 }
        )
      }
    }

    // Update user fields
    if (name) user.name = name
    if (email) user.email = email
    if (phone !== undefined) user.phone = phone
    if (bio !== undefined) user.bio = bio
    if (role) user.role = role

    await user.save()

    // Log profile update activity
    await logActivity(
      user._id.toString(),
      user.name,
      user.email,
      'updated',
      'User profile updated successfully'
    )

    // Return updated user data (excluding password)
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      phone: user.phone,
      bio: user.bio
    }

    return NextResponse.json({
      user: userData,
      message: 'Profile updated successfully'
    })

  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
