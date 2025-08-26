import mongoose from 'mongoose'

interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: string
  timezone: string
  dateFormat: string
  emailNotifications: boolean
  pushNotifications: boolean
  weeklyReports: boolean
}

interface SecuritySettings {
  twoFactorEnabled: boolean
  sessionTimeout: number
  passwordLastChanged: string
  loginAlerts: boolean
}

interface SystemSettings {
  autoBackup: boolean
  dataRetention: number
  apiAccess: boolean
  debugMode: boolean
}

export interface IUser {
  _id?: string
  name: string
  email: string
  password: string
  role: 'Admin' | 'User' | 'Editor'
  status: 'Active' | 'Inactive' | 'Pending'
  phone?: string
  bio?: string
  preferences?: UserPreferences
  security?: SecuritySettings
  system?: SystemSettings
  createdAt?: Date
  updatedAt?: Date
}

const UserSchema = new mongoose.Schema<IUser>({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
  },
  role: {
    type: String,
    enum: ['Admin', 'User', 'Editor'],
    default: 'User',
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Pending'],
    default: 'Active',
  },
  phone: {
    type: String,
    trim: true,
  },
  bio: {
    type: String,
    trim: true,
  },
  preferences: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  security: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  system: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
}, {
  timestamps: true,
})

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema)
