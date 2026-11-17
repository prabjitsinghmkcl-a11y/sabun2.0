import crypto from 'node:crypto'
import Otp from '../models/Otp.js'
import { sendOtpSms } from './sms.js'

const CODE_TTL_MS = 5 * 60 * 1000
const RESEND_MS = 60 * 1000
const MAX_PER_HOUR = 5
const MAX_ATTEMPTS = 5

export class OtpError extends Error {
  constructor(status, message, retryAfter) {
    super(message)
    this.status = status
    this.retryAfter = retryAfter
  }
}

const otpSecret = () => process.env.OTP_SECRET || process.env.JWT_SECRET || 'sabun-dev-otp-secret'

function hashCode(phone, purpose, code) {
  return crypto.createHash('sha256').update(`${purpose}:${phone}:${code}:${otpSecret()}`).digest('hex')
}

// Creates a 6-digit OTP, enforces resend limits and sends it by SMS.
export async function issueOtp(phone, purpose = 'login') {
  const now = new Date()
  const existing = await Otp.findOne({ phone, purpose })

  // Keep only sends from the last hour
  const sentAt = (existing?.sentAt || []).filter((d) => now - new Date(d) < 60 * 60 * 1000)
  const lastSent = sentAt[sentAt.length - 1]
  if (lastSent) {
    const waitMs = RESEND_MS - (now - new Date(lastSent))
    if (waitMs > 0) {
      const retryAfter = Math.ceil(waitMs / 1000)
      throw new OtpError(429, `Please wait ${retryAfter}s before requesting a new OTP.`, retryAfter)
    }
  }
  if (sentAt.length >= MAX_PER_HOUR) {
    const oldest = new Date(sentAt[0]).getTime()
    const retryAfter = Math.max(1, Math.ceil((oldest + 60 * 60 * 1000 - now.getTime()) / 1000))
    throw new OtpError(429, 'Too many OTP requests. Please try again after an hour.', retryAfter)
  }

  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0')
  const codeHash = hashCode(phone, purpose, code)
  const codeExpiresAt = new Date(now.getTime() + CODE_TTL_MS)
  const expiresAt = new Date(now.getTime() + 60 * 60 * 1000)

  let record
  if (existing) {
    existing.codeHash = codeHash
    existing.attempts = 0
    existing.codeExpiresAt = codeExpiresAt
    existing.expiresAt = expiresAt
    existing.consumedAt = null
    existing.sentAt = [...sentAt, now]
    record = await existing.save()
  } else {
    record = await Otp.create({
      phone,
      purpose,
      codeHash,
      attempts: 0,
      codeExpiresAt,
      expiresAt,
      sentAt: [now],
    })
  }

  try {
    const out = await sendOtpSms(phone, code)
    return { dev: out.dev, devCode: out.dev ? code : undefined, retryAfter: 60 }
  } catch (err) {
    // Don't keep an OTP the customer never received
    await Otp.deleteOne({ _id: record._id })
    throw new OtpError(502, err.message || 'Could not send the OTP SMS')
  }
}

export async function checkOtp(phone, purpose, code) {
  const value = String(code || '').trim()
  if (!/^\d{6}$/.test(value)) throw new OtpError(400, 'Enter the 6-digit OTP')

  const record = await Otp.findOne({ phone, purpose })
  if (!record) throw new OtpError(400, 'OTP expired or not requested. Please resend.')
  if (record.consumedAt) {
    throw new OtpError(400, 'This OTP has already been used. Please request a new one.')
  }
  const codeExpiresAt = record.codeExpiresAt || record.expiresAt
  if (codeExpiresAt.getTime() < Date.now()) {
    throw new OtpError(400, 'OTP expired. Please resend.')
  }
  if (record.attempts >= MAX_ATTEMPTS) {
    throw new OtpError(429, 'Too many wrong attempts. Please request a new OTP.')
  }

  const expected = Buffer.from(record.codeHash, 'hex')
  const received = Buffer.from(hashCode(phone, purpose, value), 'hex')
  const ok = expected.length === received.length && crypto.timingSafeEqual(expected, received)

  if (!ok) {
    record.attempts += 1
    await record.save()
    const left = MAX_ATTEMPTS - record.attempts
    throw new OtpError(
      400,
      left > 0 ? `Incorrect OTP. ${left} attempt${left === 1 ? '' : 's'} left.` : 'Incorrect OTP. Please request a new one.',
    )
  }

  // Keep the send history for the hourly rate limit, but make this code unusable.
  record.consumedAt = new Date()
  record.codeHash = '0'.repeat(64)
  record.expiresAt = new Date(Date.now() + 60 * 60 * 1000)
  await record.save()
  return true
}
