import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import { logActivity } from '@/lib/activityLogger'

// GET - Fetch all users
export async function GET() {
  try {
    await dbConnect()
    const users = await User.find({}).sort({ createdAt: -1 })
    return NextResponse.json(users)
  } catch (error) {
    console.error('Failed to fetch users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// POST - Create new user
export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    const body = await request.json()
    
    // Validate required fields
    if (!body.name || !body.email || !body.password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      )
    }
    
    // Validate password length
    if (body.password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }
    
    // Set default values
    const userData = {
      name: body.name,
      email: body.email,
      password: body.password,
      role: body.role || 'User',
      status: body.status || 'Active',
      preferences: {
        theme: 'system',
        language: 'en',
        timezone: 'UTC+0',
        dateFormat: 'MM/dd/yyyy',
        notifications: {
          email: true,
          push: false,
          weeklyReports: true
        }
      },
      security: {
        twoFactorAuth: false,
        sessionTimeout: 30,
        loginAlerts: true
      },
      system: {
        autoBackup: true,
        dataRetention: 365,
        apiAccess: false,
        debugMode: false
      }
    }
    
    const user = await User.create(userData)
    
    // Log activity
    await logActivity(
      user._id.toString(),
      user.name,
      user.email,
      'created',
      `New ${user.role} account created`
    )
    
    // Remove password from response
    const userResponse = user.toObject()
    delete userResponse.password
    
    return NextResponse.json(userResponse, { status: 201 })
  } catch (error: unknown) {
    console.error('User creation error:', error)
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      )
    }
    
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ValidationError') {
      const validationError = error as unknown as { errors: Record<string, { message: string }> }
      const validationErrors = Object.values(validationError.errors).map((err) => err.message)
      return NextResponse.json(
        { error: `Validation error: ${validationErrors.join(', ')}` },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
