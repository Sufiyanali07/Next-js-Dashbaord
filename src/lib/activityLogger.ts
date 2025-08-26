// Activity logger utility functions

export async function logActivity(
  userId: string,
  userName: string,
  userEmail: string,
  action: 'login' | 'logout' | 'created' | 'updated' | 'deleted' | 'viewed' | 'password_change',
  details?: string
): Promise<{ _id: string; userName: string; userEmail: string; timestamp: Date; details?: string } | null> {
  try {
    // Direct database operation instead of fetch to avoid URL issues
    const { default: dbConnect } = await import('@/lib/mongodb')
    const { default: Activity } = await import('@/models/Activity')
    
    await dbConnect()
    
    const activity = new Activity({
      userId,
      userName,
      userEmail,
      action,
      details,
      timestamp: new Date()
    })
    
    const savedActivity = await activity.save()
    return savedActivity.toObject()
  } catch (error) {
    console.error('Error logging activity:', error)
    return null
  }
}

// Function to seed some sample activities for testing
export async function seedSampleActivities() {
  const sampleActivities = [
    {
      userId: 'user1',
      userName: 'John Doe',
      userEmail: 'john.doe@example.com',
      action: 'login' as const,
      details: 'Login from Chrome browser'
    },
    {
      userId: 'user2',
      userName: 'Jane Smith',
      userEmail: 'jane.smith@example.com',
      action: 'created' as const,
      details: 'New user account created'
    },
    {
      userId: 'admin1',
      userName: 'Admin User',
      userEmail: 'admin@company.com',
      action: 'login' as const,
      details: 'Admin dashboard access'
    },
    {
      userId: 'user3',
      userName: 'Bob Johnson',
      userEmail: 'bob.johnson@example.com',
      action: 'updated' as const,
      details: 'Profile information updated'
    },
    {
      userId: 'user1',
      userName: 'John Doe',
      userEmail: 'john.doe@example.com',
      action: 'viewed' as const,
      details: 'Viewed user dashboard'
    }
  ]

  for (const activity of sampleActivities) {
    await logActivity(
      activity.userId,
      activity.userName,
      activity.userEmail,
      activity.action,
      activity.details
    )
    // Add small delay to create different timestamps
    await new Promise(resolve => setTimeout(resolve, 100))
  }
}
