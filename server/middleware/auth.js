import jwt from 'jsonwebtoken'
import User from '../models/User.js'

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null
    if (!token) return res.status(401).json({ error: 'Authentication required' })

    const secret = process.env.JWT_SECRET
    if (!secret) return res.status(500).json({ error: 'JWT_SECRET is not configured' })

    const decoded = jwt.verify(token, secret)
    const user = await User.findById(decoded.sub)
    if (!user) return res.status(401).json({ error: 'Invalid token user' })

    req.user = user
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

export async function optionalAuth(req, res, next) {
  try {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null
    if (!token) return next()

    const secret = process.env.JWT_SECRET
    if (!secret) return next()

    const decoded = jwt.verify(token, secret)
    const user = await User.findById(decoded.sub)
    if (user) req.user = user
  } catch {
    // ignore invalid optional token
  }
  next()
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' })
  }
  next()
}
