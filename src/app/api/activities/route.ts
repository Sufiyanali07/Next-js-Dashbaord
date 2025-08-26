import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Activity from '@/models/Activity'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    
    if (type === 'weekly-logins') {
      // Get login data for the last 7 days
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      
      const loginData = await Activity.aggregate([
        {
          $match: {
            action: 'login',
            timestamp: { $gte: sevenDaysAgo }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$timestamp"
              }
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ])
      
      // Create array for last 7 days with day names
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const weeklyData = []
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateString = date.toISOString().split('T')[0]
        const dayName = days[date.getDay()]
        
        const dayData = loginData.find(item => item._id === dateString)
        weeklyData.push({
          day: dayName,
          logins: dayData ? dayData.count : 0
        })
      }
      
      return NextResponse.json(weeklyData)
    }
    
    if (type === 'recent') {
      // Get recent activities (last 10) - focus on login and user creation activities
      const recentActivities = await Activity.find({
        action: { $in: ['login', 'created'] }
      })
        .sort({ timestamp: -1 })
        .limit(10)
        .lean()
      
      return NextResponse.json(recentActivities)
    }
    
    // Default: return all activities
    const activities = await Activity.find()
      .sort({ timestamp: -1 })
      .lean()
    
    return NextResponse.json(activities)
    
  } catch (error) {
    console.error('Error fetching activities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    
    const body = await request.json()
    const { userId, userName, userEmail, action, details } = body
    
    const activity = new Activity({
      userId,
      userName,
      userEmail,
      action,
      details,
      timestamp: new Date()
    })
    
    await activity.save()
    
    return NextResponse.json(activity, { status: 201 })
    
  } catch (error) {
    console.error('Error creating activity:', error)
    return NextResponse.json(
      { error: 'Failed to create activity' },
      { status: 500 }
    )
  }
}
