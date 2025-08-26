import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import { logActivity } from '@/lib/activityLogger'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const user = await User.findById(userId)
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Default settings
    const settings = {
      profile: {
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || '',
        bio: user.bio || ''
      },
      preferences: user.preferences || {
        theme: 'system',
        language: 'en',
        timezone: 'UTC+0',
        dateFormat: 'MM/DD/YYYY',
        emailNotifications: true,
        pushNotifications: false,
        weeklyReports: true
      },
      security: user.security || {
        twoFactorEnabled: false,
        sessionTimeout: 30,
        passwordLastChanged: user.updatedAt?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        loginAlerts: true
      },
      system: user.system || {
        autoBackup: true,
        dataRetention: 90,
        apiAccess: false,
        debugMode: false
      }
    }

    return NextResponse.json({ settings })

  } catch (error) {
    console.error('Settings fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    await dbConnect()
    
    const { userId, section, updates } = await request.json()
    
    if (!userId || !section || !updates) {
      return NextResponse.json(
        { error: 'User ID, section, and updates are required' },
        { status: 400 }
      )
    }

    const user = await User.findById(userId)
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Update based on section
    if (section === 'profile') {
      if (updates.name) user.name = updates.name
      if (updates.email) {
        // Check if email is already taken
        const existingUser = await User.findOne({ email: updates.email, _id: { $ne: userId } })
        if (existingUser) {
          return NextResponse.json(
            { error: 'Email is already in use' },
            { status: 400 }
          )
        }
        user.email = updates.email
      }
      if (updates.phone !== undefined) user.phone = updates.phone
      if (updates.bio !== undefined) user.bio = updates.bio
      if (updates.role) user.role = updates.role
    } else {
      // Update nested settings
      if (!user[section]) user[section] = {}
      user[section] = { ...user[section], ...updates }
      user.markModified(section)
    }

    await user.save()

    // Log activity
    await logActivity(
      user._id.toString(),
      user.name,
      user.email,
      'updated',
      `Settings updated: ${section}`
    )

    return NextResponse.json({
      message: 'Settings updated successfully'
    })

  } catch (error) {
    console.error('Settings update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
