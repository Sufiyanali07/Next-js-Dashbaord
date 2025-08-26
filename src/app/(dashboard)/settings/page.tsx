"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { 
  User, 
  Settings, 
  Bell, 
  Shield, 
  Palette, 
  Database, 
  Lock, 
  Eye, 
  EyeOff,
  Save,
  RefreshCw,
  Trash2,
  Download
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { useTheme } from "next-themes"
import { formatDate, formatTime } from "@/lib/dateUtils"

interface UserSettings {
  profile: {
    name: string
    email: string
    role: string
    avatar?: string
    bio?: string
    phone?: string
  }
  preferences: {
    theme: 'light' | 'dark' | 'system'
    language: string
    timezone: string
    dateFormat: string
    emailNotifications: boolean
    pushNotifications: boolean
    weeklyReports: boolean
  }
  security: {
    twoFactorEnabled: boolean
    sessionTimeout: number
    passwordLastChanged: string
    loginAlerts: boolean
  }
  system: {
    autoBackup: boolean
    dataRetention: number
    apiAccess: boolean
    debugMode: boolean
  }
}

export default function SettingsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    loadSettings()
    // Update time every second for timezone display
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadSettings = async () => {
    try {
      if (!user?._id) return
      
      const response = await fetch(`/api/users/settings?userId=${user._id}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load settings')
      }
      
      setSettings(data.settings)
    } catch (error) {
      console.error('Error loading settings:', error)
      toast({
        title: "Error",
        description: "Failed to load settings. Using defaults.",
        variant: "destructive",
      })
      
      // Fallback to default settings
      const defaultSettings: UserSettings = {
        profile: {
          name: user?.name || "User",
          email: user?.email || "user@example.com",
          role: user?.role || "User",
          bio: "",
          phone: ""
        },
        preferences: {
          theme: 'system',
          language: 'en',
          timezone: 'UTC+0',
          dateFormat: 'MM/DD/YYYY',
          emailNotifications: true,
          pushNotifications: false,
          weeklyReports: true
        },
        security: {
          twoFactorEnabled: false,
          sessionTimeout: 30,
          passwordLastChanged: new Date().toISOString().split('T')[0],
          loginAlerts: true
        },
        system: {
          autoBackup: true,
          dataRetention: 90,
          apiAccess: false,
          debugMode: false
        }
      }
      setSettings(defaultSettings)
    } finally {
      setLoading(false)
    }
  }

  const updateSettings = async <T extends keyof UserSettings>(
    section: T, 
    updates: Partial<UserSettings[T]>
  ) => {
    if (!settings || !user?._id) return
    
    try {
      const response = await fetch('/api/users/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user._id,
          section,
          updates,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update settings')
      }

      // Update local state
      const newSettings = {
        ...settings,
        [section]: { ...settings[section], ...updates }
      }
      setSettings(newSettings)

      // Handle theme changes immediately
      if (section === 'preferences' && 'theme' in updates) {
        const prefUpdates = updates as Partial<UserSettings['preferences']>
        if (prefUpdates.theme) {
          setTheme(prefUpdates.theme)
        }
      }

      toast({
        title: "Success",
        description: "Settings updated successfully!",
        variant: "default",
      })
    } catch (error) {
      console.error('Error updating settings:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to update settings',
        variant: "destructive",
      })
    }
  }

  const saveAllSettings = async () => {
    if (!settings || !user?._id) return
    
    setSaving(true)
    try {
      // Save all sections
      const sections: (keyof UserSettings)[] = ['profile', 'preferences', 'security', 'system']
      
      for (const section of sections) {
        const response = await fetch('/api/users/settings', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user._id,
            section,
            updates: settings[section],
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || `Failed to save ${section} settings`)
        }
      }

      toast({
        title: "Success",
        description: "All settings saved successfully!",
        variant: "default",
      })
    } catch (error) {
      console.error('Error saving settings:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to save settings',
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async () => {
    if (!currentPassword) {
      toast({
        title: "Error",
        description: "Please enter your current password",
        variant: "destructive",
      })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      })
      return
    }
    
    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "New password must be at least 6 characters long",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?._id,
          currentPassword,
          newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password')
      }

      // Clear password fields
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      
      // Update password last changed date in settings
      if (settings) {
        updateSettings('security', { passwordLastChanged: new Date().toISOString().split('T')[0] })
      }

      toast({
        title: "Success",
        description: "Password changed successfully! You can now login with your new password.",
        variant: "default",
      })
    } catch (error) {
      console.error('Error changing password:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to change password. Please try again.',
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const exportData = () => {
    const dataStr = JSON.stringify(settings, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `settings-backup-${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-muted-foreground">Loading settings...</div>
        </div>
      </div>
    )
  }

  if (!settings) return null

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={exportData} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Settings
          </Button>
          <Button onClick={saveAllSettings} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>Update your personal information and profile details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={settings.profile.name}
                    onChange={(e) => updateSettings('profile', { name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.profile.email}
                    onChange={(e) => updateSettings('profile', { email: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={settings.profile.role} onValueChange={(value) => updateSettings('profile', { role: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Editor">Editor</SelectItem>
                      <SelectItem value="User">User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={settings.profile.phone || ""}
                    onChange={(e) => updateSettings('profile', { phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Input
                  id="bio"
                  placeholder="Tell us about yourself..."
                  value={settings.profile.bio || ""}
                  onChange={(e) => updateSettings('profile', { bio: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Settings */}
        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Display & Language
              </CardTitle>
              <CardDescription>Customize your display preferences and language settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select value={settings.preferences.theme} onValueChange={(value: 'light' | 'dark' | 'system') => updateSettings('preferences', { theme: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">🌞 Light</SelectItem>
                      <SelectItem value="dark">🌙 Dark</SelectItem>
                      <SelectItem value="system">💻 System</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Current theme: {theme || 'system'}</p>
                </div>
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select value={settings.preferences.language} onValueChange={(value) => updateSettings('preferences', { language: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">🇺🇸 English</SelectItem>
                      <SelectItem value="es">🇪🇸 Español</SelectItem>
                      <SelectItem value="fr">🇫🇷 Français</SelectItem>
                      <SelectItem value="de">🇩🇪 Deutsch</SelectItem>
                      <SelectItem value="hi">🇮🇳 हिन्दी</SelectItem>
                      <SelectItem value="zh">🇨🇳 中文</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Interface language preference</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select value={settings.preferences.timezone} onValueChange={(value) => updateSettings('preferences', { timezone: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC-8">🇺🇸 Pacific Time (UTC-8)</SelectItem>
                      <SelectItem value="UTC-7">🏔️ Mountain Time (UTC-7)</SelectItem>
                      <SelectItem value="UTC-6">🕕 Central Time (UTC-6)</SelectItem>
                      <SelectItem value="UTC-5">🗽 Eastern Time (UTC-5)</SelectItem>
                      <SelectItem value="UTC+0">🌍 UTC/GMT</SelectItem>
                      <SelectItem value="UTC+5:30">🇮🇳 India Standard Time (UTC+5:30)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Current time: {formatTime(currentTime, settings.preferences.timezone)}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Date Format</Label>
                  <Select value={settings.preferences.dateFormat} onValueChange={(value) => updateSettings('preferences', { dateFormat: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">🇺🇸 MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">🇬🇧 DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">📅 YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Preview: {formatDate(currentTime, settings.preferences.dateFormat, settings.preferences.timezone)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>Configure your notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    📧 Email Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                </div>
                <Switch
                  checked={settings.preferences.emailNotifications}
                  onCheckedChange={(checked) => {
                    updateSettings('preferences', { emailNotifications: checked })
                    toast({
                      title: checked ? "Email notifications enabled" : "Email notifications disabled",
                      description: checked ? "You'll receive email notifications" : "Email notifications turned off",
                      variant: "default",
                    })
                  }}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    🔔 Push Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">Receive push notifications in browser</p>
                </div>
                <Switch
                  checked={settings.preferences.pushNotifications}
                  onCheckedChange={(checked) => {
                    updateSettings('preferences', { pushNotifications: checked })
                    if (checked && 'Notification' in window) {
                      Notification.requestPermission().then(permission => {
                        if (permission === 'granted') {
                          new Notification('Push notifications enabled!', {
                            body: 'You will now receive push notifications',
                            icon: '/favicon.ico'
                          })
                        }
                      })
                    }
                    toast({
                      title: checked ? "Push notifications enabled" : "Push notifications disabled",
                      description: checked ? "Browser notifications are now active" : "Push notifications turned off",
                      variant: "default",
                    })
                  }}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    📊 Weekly Reports
                  </Label>
                  <p className="text-sm text-muted-foreground">Receive weekly activity reports</p>
                </div>
                <Switch
                  checked={settings.preferences.weeklyReports}
                  onCheckedChange={(checked) => {
                    updateSettings('preferences', { weeklyReports: checked })
                    toast({
                      title: checked ? "Weekly reports enabled" : "Weekly reports disabled",
                      description: checked ? "You'll receive weekly activity summaries" : "Weekly reports turned off",
                      variant: "default",
                    })
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Password & Authentication
              </CardTitle>
              <CardDescription>Manage your password and authentication settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Password last changed</Label>
                <p className="text-sm text-muted-foreground">
                  {new Date(settings.security.passwordLastChanged).toLocaleDateString()}
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Change Password</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>
                </div>
                <Button onClick={changePassword} disabled={saving || !currentPassword || !newPassword || !confirmPassword}>
                  {saving ? 'Changing...' : 'Change Password'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Options
              </CardTitle>
              <CardDescription>Configure additional security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={settings.security.twoFactorEnabled ? "default" : "secondary"}>
                    {settings.security.twoFactorEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                  <Switch
                    checked={settings.security.twoFactorEnabled}
                    onCheckedChange={(checked) => updateSettings('security', { twoFactorEnabled: checked })}
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Login Alerts</Label>
                  <p className="text-sm text-muted-foreground">Get notified of new login attempts</p>
                </div>
                <Switch
                  checked={settings.security.loginAlerts}
                  onCheckedChange={(checked) => updateSettings('security', { loginAlerts: checked })}
                />
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label>Session Timeout (minutes)</Label>
                <Select 
                  value={settings.security.sessionTimeout.toString()} 
                  onValueChange={(value) => updateSettings('security', { sessionTimeout: parseInt(value) })}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                    <SelectItem value="480">8 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data & Backup
              </CardTitle>
              <CardDescription>Manage your data and backup preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Automatic Backup</Label>
                  <p className="text-sm text-muted-foreground">Automatically backup your data daily</p>
                </div>
                <Switch
                  checked={settings.system.autoBackup}
                  onCheckedChange={(checked) => updateSettings('system', { autoBackup: checked })}
                />
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label>Data Retention (days)</Label>
                <Select 
                  value={settings.system.dataRetention.toString()} 
                  onValueChange={(value) => updateSettings('system', { dataRetention: parseInt(value) })}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="60">60 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="180">6 months</SelectItem>
                    <SelectItem value="365">1 year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Advanced Settings
              </CardTitle>
              <CardDescription>Advanced system configuration options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>API Access</Label>
                  <p className="text-sm text-muted-foreground">Enable API access for integrations</p>
                </div>
                <Switch
                  checked={settings.system.apiAccess}
                  onCheckedChange={(checked) => updateSettings('system', { apiAccess: checked })}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Debug Mode</Label>
                  <p className="text-sm text-muted-foreground">Enable debug logging (for developers)</p>
                </div>
                <Switch
                  checked={settings.system.debugMode}
                  onCheckedChange={(checked) => updateSettings('system', { debugMode: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>Irreversible and destructive actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Delete Account</Label>
                  <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
                </div>
                <Button variant="destructive" size="sm">
                  Delete Account
                </Button>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Reset All Settings</Label>
                  <p className="text-sm text-muted-foreground">Reset all settings to default values</p>
                </div>
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
