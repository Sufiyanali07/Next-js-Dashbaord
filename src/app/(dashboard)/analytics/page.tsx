"use client"

import React from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { TrendingUp, Users, Activity, Clock } from "lucide-react"
import { fetchUsers, getAnalyticsData } from '@/lib/data'
import { useState, useEffect } from "react"
import { IUser } from "@/models/User"
import { IActivity } from "@/models/Activity"

export default function AnalyticsPage() {
  const [users, setUsers] = useState<IUser[]>([]);
  const [weeklyLoginData, setWeeklyLoginData] = useState<{day: string, logins: number}[]>([]);
  const [recentActivities, setRecentActivities] = useState<IActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayLogins, setTodayLogins] = useState(0);
  const [isRealTimeConnected, setIsRealTimeConnected] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load users
        const userData = await fetchUsers()
        setUsers(userData)
        
        // Load weekly login data
        const weeklyResponse = await fetch('/api/activities?type=weekly-logins')
        if (weeklyResponse.ok) {
          const weeklyData = await weeklyResponse.json()
          setWeeklyLoginData(weeklyData)
        } else {
          console.error('Failed to fetch weekly login data:', weeklyResponse.status)
          // Set default empty data
          setWeeklyLoginData([
            { day: 'Sun', logins: 0 },
            { day: 'Mon', logins: 0 },
            { day: 'Tue', logins: 0 },
            { day: 'Wed', logins: 0 },
            { day: 'Thu', logins: 0 },
            { day: 'Fri', logins: 0 },
            { day: 'Sat', logins: 0 }
          ])
        }
        
        // Load recent activities
        const recentResponse = await fetch('/api/activities?type=recent')
        if (recentResponse.ok) {
          const recentData = await recentResponse.json()
          setRecentActivities(recentData)
        }
        
      } catch (error) {
        console.error('Error loading analytics data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()

    // Set up real-time connection
    const eventSource = new EventSource('/api/activities/realtime')
    
    eventSource.onopen = () => {
      setIsRealTimeConnected(true)
      console.log('Real-time connection established')
    }
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        if (data.type === 'loginUpdate') {
          setTodayLogins(data.todayLogins)
          setWeeklyLoginData(data.weeklyData)
          setRecentActivities(data.recentLogins)
        } else if (data.type === 'newLogin') {
          // Add new login to recent activities
          setRecentActivities(prev => [data.activity, ...prev.slice(0, 9)])
          // Update today's login count
          setTodayLogins(prev => prev + 1)
          // Refresh weekly data to include new login
          const refreshWeeklyData = async () => {
            try {
              const response = await fetch('/api/activities?type=weekly-logins')
              if (response.ok) {
                const weeklyData = await response.json()
                setWeeklyLoginData(weeklyData)
              }
            } catch (error) {
              console.error('Error refreshing weekly data:', error)
            }
          }
          refreshWeeklyData()
        }
      } catch (error) {
        console.error('Error parsing real-time data:', error)
      }
    }
    
    eventSource.onerror = () => {
      setIsRealTimeConnected(false)
      console.log('Real-time connection lost')
    }
    
    return () => {
      eventSource.close()
    }
  }, [])

  // Get real data from shared source
  const { totalUsers, roleDistribution, userGrowthData } = getAnalyticsData(users)
  // Role counts are available in roleDistribution data

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <div className="text-sm text-muted-foreground">Last updated: Just now</div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg bg-card p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Users</p>
              <p className="text-2xl font-bold">{totalUsers}</p>
              <p className="text-xs text-green-600">Real-time data</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="rounded-lg bg-card p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Today&apos;s Logins</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">{todayLogins}</p>
                {isRealTimeConnected && (
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Real-time connected"></div>
                )}
              </div>
              <p className="text-xs text-green-600">Live updates</p>
            </div>
            <Activity className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="rounded-lg bg-card p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Session</p>
              <p className="text-2xl font-bold">24m</p>
              <p className="text-xs text-red-600">-2% from last week</p>
            </div>
            <Clock className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="rounded-lg bg-card p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Growth Rate</p>
              <p className="text-2xl font-bold">8.5%</p>
              <p className="text-xs text-green-600">+1.2% from last month</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* User Growth Chart */}
        <div className="rounded-lg bg-card p-6 shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">User Growth</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={userGrowthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="users" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Role Distribution */}
        <div className="rounded-lg bg-card p-6 shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Role Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart width={300} height={300}>
              <Pie
                data={roleDistribution}
                cx={150}
                cy={150}
                labelLine={false}
                label
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {roleDistribution.map((entry: { name: string; value: number; color: string }, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly Activity */}
        <div className="rounded-lg bg-card p-6 shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Weekly Login Activity</h3>
          {loading ? (
            <div className="flex items-center justify-center h-[300px]">
              <div className="text-muted-foreground">Loading login data...</div>
            </div>
          ) : weeklyLoginData.length === 0 || weeklyLoginData.every(d => d.logins === 0) ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-center">
              <div className="text-muted-foreground mb-2">No login data available</div>
              <div className="text-sm text-muted-foreground">Login activities will appear here when users log in</div>
            </div>
          ) : (
            <div>
              <div className="mb-4 text-sm text-muted-foreground">
                Total logins this week: <span className="font-semibold text-foreground">
                  {weeklyLoginData.reduce((sum, day) => sum + day.logins, 0)}
                </span>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={weeklyLoginData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`${value} logins`, 'Logins']}
                    labelFormatter={(label) => `${label}`}
                  />
                  <Bar dataKey="logins" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="rounded-lg bg-card p-6 shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Loading recent activities...</div>
              </div>
            ) : recentActivities && recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => (
                <div key={activity._id} className={`flex items-center justify-between py-3 ${index < recentActivities.length - 1 ? 'border-b' : ''}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {activity.action === 'login' && '🔐 User Login'}
                        {activity.action === 'logout' && '🚪 User Logout'}
                        {activity.action === 'created' && '👤 User Created'}
                        {activity.action === 'updated' && '✏️ User Updated'}
                        {activity.action === 'deleted' && '🗑️ User Deleted'}
                        {activity.action === 'viewed' && '👁️ Data Viewed'}
                      </p>
                      {activity.action === 'login' && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Login
                        </span>
                      )}
                      {activity.action === 'created' && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          New User
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">{activity.userName}</p>
                    <p className="text-xs text-muted-foreground">{activity.userEmail}</p>
                    {activity.details && (
                      <p className="text-xs text-muted-foreground mt-1">{activity.details}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <div className="mb-2">No recent activities found</div>
                <div className="text-sm">User logins and account creations will appear here in real-time</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
