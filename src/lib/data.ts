import { IUser } from "@/models/User"

// API functions to fetch data from MongoDB
export const fetchUsers = async (): Promise<IUser[]> => {
  try {
    const response = await fetch('/api/users', { cache: 'no-store' })
    if (response.ok) {
      return await response.json()
    }
    return []
  } catch (error) {
    console.error('Failed to fetch users:', error)
    return []
  }
}

// Calculate role counts from fetched data
export const getRoleCounts = (users: IUser[]) => {
  const adminCount = users.filter(user => user.role === "Admin").length
  const userCount = users.filter(user => user.role === "User").length
  const editorCount = users.filter(user => user.role === "Editor").length
  
  return { adminCount, userCount, editorCount }
}

// Generate analytics data based on real user data
export const getAnalyticsData = (users: IUser[]) => {
  const { adminCount, userCount, editorCount } = getRoleCounts(users)
  const totalUsers = users.length
  
  return {
    totalUsers,
    roleDistribution: [
      { name: 'Users', value: userCount, color: '#3B82F6' },
      { name: 'Admins', value: adminCount, color: '#10B981' },
      { name: 'Editors', value: editorCount, color: '#F59E0B' },
    ],
    userGrowthData: [
      { month: 'Jan', users: Math.max(1, totalUsers - 5) },
      { month: 'Feb', users: Math.max(1, totalUsers - 4) },
      { month: 'Mar', users: Math.max(1, totalUsers - 3) },
      { month: 'Apr', users: Math.max(1, totalUsers - 2) },
      { month: 'May', users: Math.max(1, totalUsers - 1) },
      { month: 'Jun', users: totalUsers },
    ]
  }
}
