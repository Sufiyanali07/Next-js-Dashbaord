import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'

export async function GET() {
  try {
    await dbConnect()
    
    // Get all users to see what's in the database
    const users = await User.find({}).select('name email role status')
    
    return NextResponse.json({
      message: 'Database debug info',
      userCount: users.length,
      users: users
    })

  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json(
      { error: 'Debug failed', details: error },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    await dbConnect()
    
    // Create a test user directly
    const testUser = {
      name: 'Test User',
      email: 'test@example.com',
      password: '123456',
      role: 'Admin',
      status: 'Active'
    }

    // Delete if exists
    await User.deleteOne({ email: testUser.email })
    
    // Create new user
    const newUser = new User(testUser)
    const savedUser = await newUser.save()
    
    return NextResponse.json({
      message: 'Test user created',
      user: {
        id: savedUser._id,
        email: savedUser.email,
        password: savedUser.password,
        role: savedUser.role,
        status: savedUser.status
      }
    })

  } catch (error) {
    console.error('Debug create error:', error)
    return NextResponse.json(
      { error: 'Failed to create test user', details: error },
      { status: 500 }
    )
  }
}
