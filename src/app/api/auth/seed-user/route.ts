import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'

export async function POST() {
  try {
    await dbConnect()
    
    // Delete existing test user first
    await User.deleteOne({ email: 'admin@test.com' })
    console.log('Deleted existing test user')

    // Create fresh test user
    const testUser = new User({
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'password123', // Plain text for now
      role: 'Admin',
      status: 'Active'
    })

    const savedUser = await testUser.save()
    console.log('Created test user:', { 
      id: savedUser._id, 
      email: savedUser.email, 
      password: savedUser.password,
      role: savedUser.role,
      status: savedUser.status 
    })

    return NextResponse.json({
      message: 'Test user created successfully',
      user: {
        email: 'admin@test.com',
        password: 'password123'
      }
    })

  } catch (error) {
    console.error('Seed user error:', error)
    return NextResponse.json(
      { error: 'Failed to create test user', details: error },
      { status: 500 }
    )
  }
}
