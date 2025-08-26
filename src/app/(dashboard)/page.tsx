// app/page.tsx
"use client"

import React from "react"
import DataTable from "@/components/DataTable"
import { Users, Shield, Edit } from "lucide-react"
import { getRoleCounts, fetchUsers } from "@/lib/data"
import { useEffect, useState } from "react"
import { IUser } from "@/models/User"

export default function Page() {
  const [users, setUsers] = useState<IUser[]>([]);

  useEffect(() => {
    const loadUsers = async () => {
      const userData = await fetchUsers()
      setUsers(userData)
    }
    loadUsers()
  }, [])

  // Get role counts from fetched data
  const { adminCount, userCount, editorCount } = getRoleCounts(users)

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        {/* Admin Count Card */}
        <div className="rounded-xl bg-card p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Admins</p>
              <p className="text-3xl font-bold text-primary">{adminCount}</p>
            </div>
            <Shield className="h-8 w-8 text-primary" />
          </div>
        </div>

        {/* User Count Card */}
        <div className="rounded-xl bg-card p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Users</p>
              <p className="text-3xl font-bold text-blue-600">{userCount}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        {/* Editor Count Card */}
        <div className="rounded-xl bg-card p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Editors</p>
              <p className="text-3xl font-bold text-green-600">{editorCount}</p>
            </div>
            <Edit className="h-8 w-8 text-green-600" />
          </div>
        </div>
      </div>
      <div className="flex-1 rounded-xl bg-muted/50 p-6">
        <h1 className="text-2xl font-bold mb-4">Welcome to Dashboard</h1>
        <p className="text-muted-foreground mb-6">
          This is your main dashboard content. The sidebar navigation is now working properly.
        </p>
        <DataTable />
      </div>
    </div>
  )
}
