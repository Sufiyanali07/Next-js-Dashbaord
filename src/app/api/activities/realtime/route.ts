import { NextRequest } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Activity from '@/models/Activity'

// Store active connections
const connections = new Set<ReadableStreamDefaultController>()

export async function GET(request: NextRequest) {
  // Create a readable stream for Server-Sent Events
  const stream = new ReadableStream({
    start(controller) {
      connections.add(controller)
      
      // Send initial connection message
      controller.enqueue(`data: ${JSON.stringify({ type: 'connected', message: 'Real-time connection established' })}\n\n`)
      
      // Send current login data immediately
      sendCurrentData(controller)
      
      // Set up periodic updates every 30 seconds
      const interval = setInterval(async () => {
        try {
          await sendCurrentData(controller)
        } catch (error) {
          console.error('Error sending real-time data:', error)
        }
      }, 30000)
      
      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        connections.delete(controller)
        clearInterval(interval)
        try {
          controller.close()
        } catch {
          // Connection already closed
        }
      })
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  })
}

async function sendCurrentData(controller: ReadableStreamDefaultController) {
  try {
    await dbConnect()
    
    // Get today's login count
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const todayLogins = await Activity.countDocuments({
      action: 'login',
      timestamp: { $gte: today, $lt: tomorrow }
    })
    
    // Get recent activities (login and user creation - last 10)
    const recentActivities = await Activity.find({
      action: { $in: ['login', 'created'] }
    })
    .sort({ timestamp: -1 })
    .limit(10)
    .lean()
    
    // Get weekly login data
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const weeklyLoginData = await Activity.aggregate([
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
    
    // Format weekly data for chart
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const formattedWeeklyData = []
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateString = date.toISOString().split('T')[0]
      const dayName = days[date.getDay()]
      
      const dayData = weeklyLoginData.find(item => item._id === dateString)
      formattedWeeklyData.push({
        day: dayName,
        logins: dayData ? dayData.count : 0
      })
    }
    
    const data = {
      type: 'loginUpdate',
      timestamp: new Date().toISOString(),
      todayLogins,
      recentLogins: recentActivities.map((activity: { _id: string; userName: string; userEmail: string; timestamp: Date; details?: string; action: string }) => ({
        id: activity._id,
        userName: activity.userName,
        userEmail: activity.userEmail,
        timestamp: activity.timestamp,
        details: activity.details,
        action: activity.action
      })),
      weeklyData: formattedWeeklyData
    }
    
    controller.enqueue(`data: ${JSON.stringify(data)}\n\n`)
  } catch (error) {
    console.error('Error fetching real-time data:', error)
    controller.enqueue(`data: ${JSON.stringify({ type: 'error', message: 'Failed to fetch data' })}\n\n`)
  }
}

// Function to broadcast new login activity to all connected clients
export function broadcastLoginActivity(activity: { _id: string; userName: string; userEmail: string; timestamp: Date; details?: string }) {
  const data = {
    type: 'newLogin',
    timestamp: new Date().toISOString(),
    activity: {
      id: activity._id,
      userName: activity.userName,
      userEmail: activity.userEmail,
      timestamp: activity.timestamp,
      details: activity.details
    }
  }
  
  connections.forEach(controller => {
    try {
      controller.enqueue(`data: ${JSON.stringify(data)}\n\n`)
    } catch {
      // Remove dead connections
      connections.delete(controller)
    }
  })
}
