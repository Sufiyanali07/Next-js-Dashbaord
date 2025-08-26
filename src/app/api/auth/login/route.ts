import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import { logActivity } from '@/lib/activityLogger'

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    
    const { email, password } = await request.json()
    
    console.log('Login attempt:', { email, password: '***' })
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await User.findOne({ email })
    console.log('User found:', user ? { email: user.email, hasPassword: !!user.password } : 'No user found')
    
    if (!user) {
      console.log('Login failed: User not found')
      return NextResponse.json(
        { error: 'User not found. Please sign up first.' },
        { status: 401 }
      )
    }

    // For now, simple password check (in production, use bcrypt)
    console.log('Password comparison:', { provided: password, stored: user.password, match: user.password === password })
    if (user.password !== password) {
      console.log('Login failed: Password mismatch')
      return NextResponse.json(
        { error: 'Incorrect password' },
        { status: 401 }
      )
    }

    // Log login activity
    const activity = await logActivity(
      user._id.toString(),
      user.name,
      user.email,
      'login',
      'User logged in successfully'
    )

    // Broadcast real-time login update
    if (activity) {
      try {
        const { broadcastLoginActivity } = await import('../../activities/realtime/route')
        broadcastLoginActivity(activity)
      } catch (error) {
        console.log('Real-time broadcast not available:', error instanceof Error ? error.message : 'Unknown error')
      }
    }

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
      message: 'Login successful'
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
