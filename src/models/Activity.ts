import mongoose from 'mongoose'

export interface IActivity {
  _id: string
  userId: string
  userName: string
  userEmail: string
  action: string
  timestamp: Date
  details?: string
}

const ActivitySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ['login', 'logout', 'created', 'updated', 'deleted', 'viewed']
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  details: {
    type: String,
    required: false
  }
}, {
  timestamps: true
})

export default mongoose.models.Activity || mongoose.model('Activity', ActivitySchema)
