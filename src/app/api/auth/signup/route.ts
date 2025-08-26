import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import { logActivity } from '@/lib/activityLogger'

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    
    const { name, email, password, role } = await request.json()
    
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password, // In production, hash this with bcrypt
      role: role || 'User',
      status: 'Active'
    })

    // Log signup activity
    await logActivity(
      user._id.toString(),
      user.name,
      user.email,
      'created',
      `New ${user.role} account created via signup`
    )

    // Create simple token (in production, use JWT)
    const token = Buffer.from(`${user._id}:${Date.now()}`).toString('base64')

    // Return user data (excluding password)
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status
    }

    return NextResponse.json({
      user: userData,
      token,
      message: 'Account created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
