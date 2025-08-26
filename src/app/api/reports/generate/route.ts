import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import Activity from '@/models/Activity'

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    
    const { reportType, format, dateRange } = await request.json()
    
    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    
    switch (dateRange) {
      case '7':
        startDate.setDate(endDate.getDate() - 7)
        break
      case '30':
        startDate.setDate(endDate.getDate() - 30)
        break
      case '90':
        startDate.setDate(endDate.getDate() - 90)
        break
      default:
        startDate.setDate(endDate.getDate() - 30)
    }

    // Fetch data based on report type
    let reportData: any = {}
    
    if (reportType === 'detailed' || reportType === 'summary') {
      // Get users data
      const users = await User.find({}).lean()
      
      // Get activities data within date range
      const activities = await Activity.find({
        timestamp: { $gte: startDate, $lte: endDate }
      }).lean()
      
      // Process user statistics
      const userStats = {
        totalUsers: users.length,
        activeUsers: users.filter(u => u.status === 'Active').length,
        newUsers: users.filter(u => new Date(u.createdAt) >= startDate).length,
        usersByRole: users.reduce((acc: any, user) => {
          acc[user.role] = (acc[user.role] || 0) + 1
          return acc
        }, {})
      }
      
      // Process activity statistics
      const activityStats = {
        totalActivities: activities.length,
        logins: activities.filter(a => a.action === 'login').length,
        signups: activities.filter(a => a.action === 'created').length,
        dailyActivity: getDailyActivityBreakdown(activities, startDate, endDate)
      }
      
      // Top users by activity
      const userActivityCount = activities.reduce((acc: any, activity) => {
        acc[activity.userId] = (acc[activity.userId] || 0) + 1
        return acc
      }, {})
      
      const topUsers = Object.entries(userActivityCount)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 10)
        .map(([userId, count]) => {
          const user = users.find(u => u._id.toString() === userId)
          return {
            name: user?.name || 'Unknown',
            email: user?.email || 'Unknown',
            activityCount: count,
            role: user?.role || 'Unknown'
          }
        })
      
      reportData = {
        reportType,
        dateRange: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
        generatedAt: new Date().toISOString(),
        userStats,
        activityStats,
        topUsers: reportType === 'detailed' ? topUsers : topUsers.slice(0, 5),
        users: reportType === 'detailed' ? users : undefined,
        activities: reportType === 'detailed' ? activities : undefined
      }
    }
    
    // Generate report based on format
    if (format === 'pdf') {
      const textContent = generateTextReport(reportData)
      
      return new NextResponse(textContent, {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': `attachment; filename="${reportType}-report-${Date.now()}.txt"`
        }
      })
    } else if (format === 'csv') {
      const csvContent = generateCSVReport(reportData)
      
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${reportType}-report-${Date.now()}.csv"`
        }
      })
    } else {
      // Return JSON data for custom report builder
      return NextResponse.json(reportData)
    }
    
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}

function getDailyActivityBreakdown(activities: any[], startDate: Date, endDate: Date) {
  const dailyBreakdown: any = {}
  
  // Initialize all days in range
  const currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    const dateKey = currentDate.toISOString().split('T')[0]
    dailyBreakdown[dateKey] = { logins: 0, signups: 0, total: 0 }
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  // Count activities by day
  activities.forEach(activity => {
    const dateKey = new Date(activity.timestamp).toISOString().split('T')[0]
    if (dailyBreakdown[dateKey]) {
      dailyBreakdown[dateKey].total++
      if (activity.action === 'login') {
        dailyBreakdown[dateKey].logins++
      } else if (activity.action === 'created') {
        dailyBreakdown[dateKey].signups++
      }
    }
  })
  
  return dailyBreakdown
}

async function generatePDFReport(data: any): Promise<Buffer> {
  // Generate PDF content as text format
  const pdfContent = generateTextReport(data)
  
  // Create a simple PDF-like structure
  const pdfBuffer = Buffer.from(pdfContent, 'utf-8')
  return pdfBuffer
}

function generateTextReport(data: any): string {
  let content = `${data.reportType.toUpperCase()} REPORT\n`
  content += `${'='.repeat(50)}\n\n`
  content += `Generated: ${new Date(data.generatedAt).toLocaleString()}\n`
  content += `Date Range: ${data.dateRange}\n\n`
  
  // User Statistics
  content += `USER STATISTICS\n`
  content += `${'-'.repeat(20)}\n`
  content += `Total Users: ${data.userStats.totalUsers}\n`
  content += `Active Users: ${data.userStats.activeUsers}\n`
  content += `New Users: ${data.userStats.newUsers}\n\n`
  
  // Activity Statistics
  content += `ACTIVITY STATISTICS\n`
  content += `${'-'.repeat(20)}\n`
  content += `Total Activities: ${data.activityStats.totalActivities}\n`
  content += `Total Logins: ${data.activityStats.logins}\n`
  content += `Total Signups: ${data.activityStats.signups}\n\n`
  
  // Top Users
  content += `TOP ACTIVE USERS\n`
  content += `${'-'.repeat(20)}\n`
  data.topUsers.forEach((user: any, index: number) => {
    content += `${index + 1}. ${user.name} (${user.email})\n`
    content += `   Role: ${user.role} | Activities: ${user.activityCount}\n\n`
  })
  
  // Users by Role
  if (data.userStats.usersByRole) {
    content += `USERS BY ROLE\n`
    content += `${'-'.repeat(20)}\n`
    Object.entries(data.userStats.usersByRole).forEach(([role, count]) => {
      content += `${role}: ${count}\n`
    })
    content += `\n`
  }
  
  // Daily Activity Breakdown
  if (data.activityStats.dailyActivity) {
    content += `DAILY ACTIVITY BREAKDOWN\n`
    content += `${'-'.repeat(20)}\n`
    Object.entries(data.activityStats.dailyActivity).forEach(([date, stats]: [string, any]) => {
      content += `${date}: Total: ${stats.total}, Logins: ${stats.logins}, Signups: ${stats.signups}\n`
    })
  }
  
  return content
}

function generateHTMLReport(data: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${data.reportType} Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
        .section { margin-bottom: 30px; }
        .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
        .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f5f5f5; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${data.reportType.charAt(0).toUpperCase() + data.reportType.slice(1)} Report</h1>
        <p>Generated: ${new Date(data.generatedAt).toLocaleString()}</p>
        <p>Date Range: ${data.dateRange}</p>
      </div>
      
      <div class="section">
        <h2>User Statistics</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <h3>Total Users</h3>
            <p style="font-size: 24px; font-weight: bold;">${data.userStats.totalUsers}</p>
          </div>
          <div class="stat-card">
            <h3>Active Users</h3>
            <p style="font-size: 24px; font-weight: bold;">${data.userStats.activeUsers}</p>
          </div>
          <div class="stat-card">
            <h3>New Users</h3>
            <p style="font-size: 24px; font-weight: bold;">${data.userStats.newUsers}</p>
          </div>
          <div class="stat-card">
            <h3>Total Activities</h3>
            <p style="font-size: 24px; font-weight: bold;">${data.activityStats.totalActivities}</p>
          </div>
        </div>
      </div>
      
      <div class="section">
        <h2>Activity Summary</h2>
        <p>Total Logins: ${data.activityStats.logins}</p>
        <p>Total Signups: ${data.activityStats.signups}</p>
      </div>
      
      <div class="section">
        <h2>Top Active Users</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Activity Count</th>
            </tr>
          </thead>
          <tbody>
            ${data.topUsers.map((user: any) => `
              <tr>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.role}</td>
                <td>${user.activityCount}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      ${data.reportType === 'detailed' ? `
        <div class="section">
          <h2>Users by Role</h2>
          <table>
            <thead>
              <tr>
                <th>Role</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(data.userStats.usersByRole).map(([role, count]) => `
                <tr>
                  <td>${role}</td>
                  <td>${count}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}
    </body>
    </html>
  `
}

function generateCSVReport(data: any): string {
  let csv = `Report Type,${data.reportType}\n`
  csv += `Generated At,${data.generatedAt}\n`
  csv += `Date Range,${data.dateRange}\n\n`
  
  // User Statistics
  csv += `User Statistics\n`
  csv += `Metric,Value\n`
  csv += `Total Users,${data.userStats.totalUsers}\n`
  csv += `Active Users,${data.userStats.activeUsers}\n`
  csv += `New Users,${data.userStats.newUsers}\n\n`
  
  // Activity Statistics
  csv += `Activity Statistics\n`
  csv += `Metric,Value\n`
  csv += `Total Activities,${data.activityStats.totalActivities}\n`
  csv += `Total Logins,${data.activityStats.logins}\n`
  csv += `Total Signups,${data.activityStats.signups}\n\n`
  
  // Top Users
  csv += `Top Active Users\n`
  csv += `Name,Email,Role,Activity Count\n`
  data.topUsers.forEach((user: any) => {
    csv += `"${user.name}","${user.email}","${user.role}",${user.activityCount}\n`
  })
  
  // Users by Role
  if (data.userStats.usersByRole) {
    csv += `\nUsers by Role\n`
    csv += `Role,Count\n`
    Object.entries(data.userStats.usersByRole).forEach(([role, count]) => {
      csv += `"${role}",${count}\n`
    })
  }
  
  return csv
}
