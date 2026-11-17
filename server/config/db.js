import mongoose from 'mongoose'

// Cache the connection so serverless functions (Vercel) reuse it between requests
let cached = globalThis.__sabunMongo
if (!cached) cached = globalThis.__sabunMongo = { conn: null, promise: null }

export async function connectDB(uri = process.env.MONGODB_URI) {
  if (!uri) {
    throw new Error('MONGODB_URI is missing. Set it in your .env file (or Vercel environment variables).')
  }
  if (cached.conn && mongoose.connection.readyState === 1) return cached.conn
  if (!cached.promise) {
    mongoose.set('strictQuery', true)
    cached.promise = mongoose
      .connect(uri, { serverSelectionTimeoutMS: 20000 })
      .then(async (m) => {
        // Make sure the unique mobile-number index exists (customers log in by
        // phone) and the OTP collection has its unique/TTL indexes.
        // A conflict should not take the whole API down.
        try {
          const [{ default: User }, { default: Otp }] = await Promise.all([
            import('../models/User.js'),
            import('../models/Otp.js'),
          ])
          await Promise.all([User.createIndexes(), Otp.createIndexes()])
        } catch (err) {
          console.warn('Could not create database indexes:', err.message)
        }
        // One-time settings fixes (non-fatal)
        try {
          const { ensureOrderWhatsApp } = await import('../migrations/orderWhatsApp.js')
          await ensureOrderWhatsApp()
        } catch (err) {
          console.warn('Could not apply settings fix:', err.message)
        }
        console.log('MongoDB connected')
        return m
      })
      .catch((err) => {
        cached.promise = null
        throw err
      })
  }
  cached.conn = await cached.promise
  return cached.conn
}
