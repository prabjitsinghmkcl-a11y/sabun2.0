import crypto from 'node:crypto'
import express from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { requireAuth } from '../middleware/auth.js'
import { OtpError, checkOtp, issueOtp } from '../services/otp.js'
import { smsConfigured } from '../services/sms.js'

const router = express.Router()

const PHONE_RE = /^[6-9]\d{9}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MOBILE_EMAIL_DOMAIN = '@mobile.sabun.local'

function signToken(userId) {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is not configured')
  return jwt.sign({ sub: userId }, secret, { expiresIn: '7d' })
}

function cleanPhone(value) {
  const digits = String(value || '').replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2)
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1)
  return digits
}

function otpFail(res, err) {
  if (err instanceof OtpError) {
    return res.status(err.status).json({
      error: err.message,
      ...(err.retryAfter ? { retryAfter: err.retryAfter } : {}),
    })
  }
  return res.status(500).json({ error: err.message || 'OTP request failed' })
}

// Dev OTPs are only echoed back when explicitly enabled and requested from localhost.
function devCodeFor(req, out) {
  if (!out?.devCode || process.env.SMS_DEV_MODE !== 'true') return undefined
  const host = String(req.hostname || '').toLowerCase()
  return ['localhost', '127.0.0.1', '::1', '[::1]'].includes(host) ? out.devCode : undefined
}

// Customers log in only with a 6-digit OTP sent to their mobile number.
router.post('/otp/send', async (req, res) => {
  try {
    const phone = cleanPhone(req.body?.phone)
    if (!PHONE_RE.test(phone)) {
      return res.status(400).json({ error: 'Enter a valid 10-digit Indian mobile number' })
    }
    const out = await issueOtp(phone, 'login')
    const devCode = devCodeFor(req, out)
    res.json({ ok: true, sms: smsConfigured(), dev: out.dev, ...(devCode ? { devCode } : {}), retryAfter: out.retryAfter })
  } catch (err) {
    otpFail(res, err)
  }
})

router.post('/otp/verify', async (req, res) => {
  try {
    const phone = cleanPhone(req.body?.phone)
    if (!PHONE_RE.test(phone)) {
      return res.status(400).json({ error: 'Enter a valid 10-digit Indian mobile number' })
    }

    const name = String(req.body?.name || '').trim().slice(0, 80)
    const emailInput = String(req.body?.email || '').trim().toLowerCase().slice(0, 160)

    const existing = await User.findOne({ phone })
    if (existing?.role === 'admin') {
      return res.status(403).json({ error: 'Admin accounts must log in with email and password.' })
    }

    // New number: checkout/signup must supply a name. Check this before
    // consuming the OTP so the customer can fill the name and try again.
    if (!existing && name.length < 2) {
      return res.status(404).json({
        error: 'No account found for this number. Enter your name to create one.',
        needsSignup: true,
      })
    }
    if (!existing && emailInput && !EMAIL_RE.test(emailInput)) {
      return res.status(400).json({ error: 'This email doesn’t look right.' })
    }

    const email = existing ? existing.email : emailInput || `${phone}${MOBILE_EMAIL_DOMAIN}`
    if (!existing && (await User.exists({ email }))) {
      return res.status(409).json({ error: 'This email is already registered.' })
    }

    await checkOtp(phone, 'login', req.body?.otp)

    let user = existing
    let created = false
    if (!user) {
      user = new User({
        name,
        email,
        phone,
        phoneVerified: true,
        // Customers never use a password; the field is kept for admin/legacy accounts.
        password: crypto.randomBytes(24).toString('hex'),
      })
      await user.save()
      created = true
    } else if (!user.phoneVerified) {
      user.phoneVerified = true
      await user.save()
    }

    res.json({ token: signToken(user._id.toString()), user: user.toSafeJSON(), created })
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ error: 'This mobile number is already registered.' })
    }
    otpFail(res, err)
  }
})

// Admin email + password login. Customers use the OTP routes above.
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {}
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' })
    }

    const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+password')
    if (!user) return res.status(401).json({ error: 'Invalid email or password' })

    const ok = await user.comparePassword(String(password))
    if (!ok) return res.status(401).json({ error: 'Invalid email or password' })
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Customers must log in with their mobile number and OTP.' })
    }

    const token = signToken(user._id.toString())
    res.json({ token, user: user.toSafeJSON() })
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to login' })
  }
})

router.get('/me', requireAuth, async (req, res) => {
  res.json({ user: req.user.toSafeJSON() })
})

export default router
