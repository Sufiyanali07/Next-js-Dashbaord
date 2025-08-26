"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, CalendarIcon, Download, FileText, TrendingUp, Users, Activity, Clock } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'

interface ReportData {
  userGrowth: { month: string; users: number; newUsers: number }[]
  activitySummary: { date: string; logins: number; signups: number; totalActivity: number }[]
  usersByRole: { role: string; count: number; percentage: number; color: string }[]
  topUsers: { name: string; email: string; loginCount: number; lastLogin: string; status: string }[]
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState("30")
  const [reportType, setReportType] = useState("overview")

  useEffect(() => {
    loadReportData()
  }, [dateRange])

  const loadReportData = async () => {
    setLoading(true)
    try {
      // Simulate API calls for different report data
      const [usersResponse, activitiesResponse] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/activities')
      ])

      const users = usersResponse.ok ? await usersResponse.json() : []
      const activities = activitiesResponse.ok ? await activitiesResponse.json() : []

      // Process data for reports
      const processedData = processReportData(users, activities)
      setReportData(processedData)
    } catch (error) {
      console.error('Error loading report data:', error)
      // Set default empty data
      setReportData({
        userGrowth: [],
        activitySummary: [],
        usersByRole: [],
        topUsers: []
      })
    } finally {
      setLoading(false)
    }
  }

  const processReportData = (users: any[], activities: any[]): ReportData => {
    // User growth data (last 6 months)
    const userGrowth = [
      { month: 'Jul', users: 45, newUsers: 12 },
      { month: 'Aug', users: 52, newUsers: 7 },
      { month: 'Sep', users: 61, newUsers: 9 },
      { month: 'Oct', users: 73, newUsers: 12 },
      { month: 'Nov', users: 89, newUsers: 16 },
      { month: 'Dec', users: users.length || 95, newUsers: 6 }
    ]

    // Activity summary (last 7 days)
    const activitySummary = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const dayActivities = activities.filter((activity: any) => {
        const activityDate = new Date(activity.timestamp).toISOString().split('T')[0]
        return activityDate === dateStr
      })

      activitySummary.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        logins: dayActivities.filter((a: any) => a.action === 'login').length,
        signups: dayActivities.filter((a: any) => a.action === 'created').length,
        totalActivity: dayActivities.length
      })
    }

    // Users by role
    const roleCounts = users.reduce((acc: any, user: any) => {
      acc[user.role] = (acc[user.role] || 0) + 1
      return acc
    }, {})

    const totalUsers = users.length || 1
    const usersByRole = Object.entries(roleCounts).map(([role, count]: [string, any]) => ({
      role,
      count,
      percentage: Math.round((count / totalUsers) * 100),
      color: role === 'Admin' ? '#3B82F6' : role === 'Editor' ? '#10B981' : '#F59E0B'
    }))

    // Top active users (mock data if no activities)
    const topUsers = users.slice(0, 5).map((user: any, index: number) => ({
      name: user.name,
      email: user.email,
      loginCount: Math.floor(Math.random() * 50) + 10,
      lastLogin: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      status: user.status
    }))

    return {
      userGrowth,
      activitySummary,
      usersByRole,
      topUsers
    }
  }

  const exportReport = async (format: string, reportType: string = 'summary') => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportType,
          format,
          dateRange
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate report')
      }

      if (format === 'pdf' || format === 'csv') {
        // Handle file download
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${reportType}-report-${Date.now()}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        // Handle JSON response for custom reports
        const data = await response.json()
        console.log('Custom report data:', data)
        // You can open a modal or new page with this data
      }
    } catch (error) {
      console.error('Error exporting report:', error)
      alert('Failed to generate report. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-muted-foreground">Loading reports...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">Comprehensive analytics and reporting dashboard</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => exportReport('pdf', 'summary')} disabled={loading}>
            <Download className="h-4 w-4 mr-2" />
            {loading ? 'Generating...' : 'Export Report'}
          </Button>
          <Button variant="outline" onClick={() => exportReport('csv', 'summary')} disabled={loading}>
            <Download className="h-4 w-4 mr-2" />
            {loading ? 'Generating...' : 'Export CSV'}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData?.userGrowth[reportData.userGrowth.length - 1]?.users || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{reportData?.userGrowth[reportData.userGrowth.length - 1]?.newUsers || 0} from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Logins</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reportData?.activitySummary.reduce((sum, day) => sum + day.logins, 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground">Last {dateRange} days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Signups</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reportData?.activitySummary.reduce((sum, day) => sum + day.signups, 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground">Last {dateRange} days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Daily Activity</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((reportData?.activitySummary.reduce((sum, day) => sum + day.totalActivity, 0) || 0) / 7)}
            </div>
            <p className="text-xs text-muted-foreground">Activities per day</p>
          </CardContent>
        </Card>
      </div>

      {/* Report Tabs */}
      <Tabs value={reportType} onValueChange={setReportType} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">User Reports</TabsTrigger>
          <TabsTrigger value="activity">Activity Reports</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* User Growth Chart */}
            <Card>
              <CardHeader>
                <CardTitle>User Growth Trend</CardTitle>
                <CardDescription>Monthly user acquisition and growth</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={reportData?.userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="users" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="newUsers" stackId="2" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* User Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>User Distribution by Role</CardTitle>
                <CardDescription>Breakdown of users by their assigned roles</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={reportData?.usersByRole}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ role, percentage }) => `${role} (${percentage}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {reportData?.usersByRole.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Activity Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Activity Summary</CardTitle>
              <CardDescription>Login and signup activity over the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData?.activitySummary}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="logins" fill="#3B82F6" name="Logins" />
                  <Bar dataKey="signups" fill="#10B981" name="Signups" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Active Users</CardTitle>
              <CardDescription>Users with the highest login activity</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Login Count</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData?.topUsers.map((user, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.loginCount}</TableCell>
                      <TableCell>{user.lastLogin}</TableCell>
                      <TableCell>
                        <Badge variant={user.status === 'Active' ? 'default' : 'secondary'}>
                          {user.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
              <CardDescription>Detailed view of user activities over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={reportData?.activitySummary}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="totalActivity" stroke="#3B82F6" strokeWidth={2} />
                  <Line type="monotone" dataKey="logins" stroke="#10B981" strokeWidth={2} />
                  <Line type="monotone" dataKey="signups" stroke="#F59E0B" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>System Performance</CardTitle>
                <CardDescription>Key performance metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Average Response Time</span>
                  <Badge variant="outline">245ms</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Database Connections</span>
                  <Badge variant="outline">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">API Success Rate</span>
                  <Badge variant="outline">99.2%</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Real-time Connections</span>
                  <Badge variant="outline">12 Active</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Report Generation</CardTitle>
                <CardDescription>Generate custom reports</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" onClick={() => exportReport('json', 'detailed')} disabled={loading}>
                  <FileText className="h-4 w-4 mr-2" />
                  {loading ? 'Generating...' : 'Generate Detailed Report'}
                </Button>
                <Button variant="outline" className="w-full" onClick={() => exportReport('pdf', 'summary')} disabled={loading}>
                  <FileText className="h-4 w-4 mr-2" />
                  {loading ? 'Generating...' : 'Generate Summary Report'}
                </Button>
                <Button variant="outline" className="w-full" onClick={() => exportReport('json', 'custom')} disabled={loading}>
                  <FileText className="h-4 w-4 mr-2" />
                  {loading ? 'Generating...' : 'Custom Report Builder'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
