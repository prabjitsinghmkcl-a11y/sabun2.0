import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import mongoose from 'mongoose'
import { connectDB } from './config/db.js'
import { requireAdmin, requireAuth } from './middleware/auth.js'
import authRoutes from './routes/auth.js'
import accountRoutes from './routes/account.js'
import productRoutes from './routes/products.js'
import orderRoutes from './routes/orders.js'
import adminRoutes from './routes/admin.js'
import settingsRoutes from './routes/settings.js'
import uploadRoutes from './routes/uploads.js'

const app = express()

app.use(cors())
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting']
  res.json({
    ok: true,
    service: 'sabun-api',
    db: states[mongoose.connection.readyState] || 'unknown',
    dbConfigured: Boolean(process.env.MONGODB_URI),
    jwt: Boolean(process.env.JWT_SECRET),
  })
})

// Make sure the database is connected before any API route runs
app.use('/api', async (_req, res, next) => {
  try {
    await connectDB()
    next()
  } catch (err) {
    console.error('DB connection failed:', err.message)
    res.status(503).json({ error: `Database not reachable: ${err.message}` })
  }
})

app.use('/api/auth', authRoutes)
app.use('/api/account', requireAuth, accountRoutes)
app.use('/api/products', productRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/admin/uploads', requireAuth, requireAdmin, uploadRoutes)
app.use('/api/admin', requireAuth, requireAdmin, adminRoutes)

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// Bad JSON bodies etc.
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const status = err.status || err.statusCode || 500
  res.status(status).json({ error: status === 400 ? 'Invalid request body' : err.message || 'Server error' })
})

export default app
