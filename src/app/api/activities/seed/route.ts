import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Activity from '@/models/Activity'

export async function POST() {
  try {
    await dbConnect()
    
    // Clear existing activities
    await Activity.deleteMany({})
    
    // Create sample activities with varied timestamps
    const now = new Date()
    const sampleActivities = [
      {
        userId: 'user1',
        userName: 'John Doe',
        userEmail: 'john.doe@example.com',
        action: 'login',
        details: 'Login from Chrome browser',
        timestamp: new Date(now.getTime() - 2 * 60 * 1000) // 2 minutes ago
      },
      {
        userId: 'user2',
        userName: 'Jane Smith',
        userEmail: 'jane.smith@example.com',
        action: 'created',
        details: 'New user account created',
        timestamp: new Date(now.getTime() - 5 * 60 * 1000) // 5 minutes ago
      },
      {
        userId: 'admin1',
        userName: 'Admin User',
        userEmail: 'admin@company.com',
        action: 'login',
        details: 'Admin dashboard access',
        timestamp: new Date(now.getTime() - 12 * 60 * 1000) // 12 minutes ago
      },
      {
        userId: 'user3',
        userName: 'Bob Johnson',
        userEmail: 'bob.johnson@example.com',
        action: 'updated',
        details: 'Profile information updated',
        timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000) // 1 hour ago
      },
      {
        userId: 'user1',
        userName: 'John Doe',
        userEmail: 'john.doe@example.com',
        action: 'viewed',
        details: 'Viewed user dashboard',
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000) // 2 hours ago
      }
    ]
    
    // Add login activities for the past 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      
      // Add random number of logins per day (0-10)
      const loginCount = Math.floor(Math.random() * 11)
      
      for (let j = 0; j < loginCount; j++) {
        const loginTime = new Date(date)
        loginTime.setHours(Math.floor(Math.random() * 24))
        loginTime.setMinutes(Math.floor(Math.random() * 60))
        
        sampleActivities.push({
          userId: `user${Math.floor(Math.random() * 5) + 1}`,
          userName: `User ${Math.floor(Math.random() * 5) + 1}`,
          userEmail: `user${Math.floor(Math.random() * 5) + 1}@example.com`,
          action: 'login',
          details: 'Daily login activity',
          timestamp: loginTime
        })
      }
    }
    
    await Activity.insertMany(sampleActivities)
    
    return NextResponse.json({ 
      message: 'Sample activities created successfully',
      count: sampleActivities.length 
    })
    
  } catch (error) {
    console.error('Error seeding activities:', error)
    return NextResponse.json(
      { error: 'Failed to seed activities' },
      { status: 500 }
    )
  }
}
