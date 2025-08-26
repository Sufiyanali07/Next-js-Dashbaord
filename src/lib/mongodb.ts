import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nextjs-dashboard'

if (!MONGODB_URI) {
  console.warn('⚠️  MONGODB_URI not found in environment variables, using default local MongoDB')
}

interface CachedConnection {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  var mongoose: CachedConnection | undefined
}

let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

async function dbConnect() {
  if (cached?.conn) {
    console.log('📦 Using existing MongoDB connection')
    return cached.conn
  }

  if (!cached?.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 2000,
      socketTimeoutMS: 10000,
      connectTimeoutMS: 3000,
      maxPoolSize: 5
    }

    console.log('🔄 Connecting to MongoDB...')
    console.log('📍 Database URI:', MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'))
    
    cached!.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('✅ MongoDB connected successfully!')
      console.log('🏷️  Database name:', mongoose.connection.name)
      console.log('🌐 Connection state:', mongoose.connection.readyState === 1 ? 'Connected' : 'Connecting')
      return mongoose
    })
  }

  try {
    cached!.conn = await cached!.promise
    return cached!.conn
  } catch (error) {
    console.error('❌ MongoDB connection failed!')
    console.error('🔍 Error details:', error)
    
    // Log specific error types for better debugging
    if (error instanceof Error) {
      if (error.message.includes('authentication failed')) {
        console.error('🔐 Authentication Error: Check your username and password')
      } else if (error.message.includes('ENOTFOUND')) {
        console.error('🌐 Network Error: Check your connection string and network')
      } else if (error.message.includes('timeout')) {
        console.error('⏱️  Timeout Error: Database took too long to respond')
      }
    }
    
    if (cached) {
      cached.promise = null
    }
    throw error
  }
}

export default dbConnect
