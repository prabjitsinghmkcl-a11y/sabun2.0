// Customer "My account" API. Every route here requires a logged-in user
// (mounted with requireAuth in app.js), and only ever touches that user's data.
import express from 'express'
import mongoose from 'mongoose'
import Order from '../models/Order.js'
import Product from '../models/Product.js'
import User from '../models/User.js'
import { OtpError, checkOtp, issueOtp } from '../services/otp.js'
import { smsConfigured } from '../services/sms.js'

const router = express.Router()

const PHONE_RE = /^[6-9]\d{9}$/
const PIN_RE = /^[1-9]\d{5}$/
const MAX_ADDRESSES = 10

const cleanPhone = (value) => {
  const digits = String(value || '').replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2)
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1)
  return digits
}

function readAddress(body = {}) {
  const a = {
    label: String(body.label || 'Home').trim().slice(0, 30) || 'Home',
    name: String(body.name || '').trim().slice(0, 80),
    phone: cleanPhone(body.phone),
    address: String(body.address || '').trim().slice(0, 300),
    city: String(body.city || '').trim().slice(0, 80),
    state: String(body.state || '').trim().slice(0, 80),
    pincode: String(body.pincode || '').trim(),
  }
  if (a.name.length < 2) return { error: 'Please enter the name for this address' }
  if (!PHONE_RE.test(a.phone)) return { error: 'Enter a valid 10-digit Indian mobile number' }
  if (a.address.length < 8) return { error: 'Please add house no., street and area' }
  if (a.city.length < 2) return { error: 'Please enter the city' }
  if (!a.state) return { error: 'Please choose the state' }
  if (!PIN_RE.test(a.pincode)) return { error: 'Enter a valid 6-digit pincode' }
  return { address: a }
}

function ensureOneDefault(user) {
  if (user.addresses.length && !user.addresses.some((a) => a.isDefault)) {
    user.addresses[0].isDefault = true
  }
}

// Only the fields a customer should see about their own order
function publicOrder(o) {
  return {
    id: o._id.toString(),
    ref: o.ref,
    status: o.status || 'pending',
    items: (o.items || []).map((i) => ({
      productId: i.productId,
      name: i.name,
      variant: i.variant,
      price: i.price,
      qty: i.qty,
      custom: i.custom || '',
      lineTotal: i.lineTotal ?? (i.price || 0) * (i.qty || 0),
    })),
    subtotal: o.subtotal,
    deliveryFee: o.deliveryFee,
    deliveryKnown: o.deliveryKnown,
    total: o.total,
    customer: o.customer,
    paymentMethod: o.paymentMethod,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  }
}

async function summary(userId) {
  const orders = await Order.find({ user: userId }).select('status total items.qty createdAt').sort({ createdAt: -1 }).lean()
  const ACTIVE = ['pending', 'confirmed', 'paid', 'shipped']
  let totalSpent = 0
  let soapsBought = 0
  for (const o of orders) {
    const status = o.status || 'pending'
    if (status === 'cancelled') continue
    totalSpent += Number(o.total) || 0
    soapsBought += (o.items || []).reduce((sum, i) => sum + (Number(i.qty) || 0), 0)
  }
  return {
    orders: orders.length,
    activeOrders: orders.filter((o) => ACTIVE.includes(o.status || 'pending')).length,
    totalSpent,
    soapsBought,
    lastOrderAt: orders[0]?.createdAt || null,
  }
}

// ---------- Overview ----------
router.get('/', async (req, res) => {
  try {
    res.json({ user: req.user.toSafeJSON(), stats: await summary(req.user._id) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ---------- Profile ----------
router.put('/profile', async (req, res) => {
  try {
    const { name, phone, birthday, whatsappUpdates } = req.body || {}
    if (name !== undefined) {
      const n = String(name).trim()
      if (n.length < 2) return res.status(400).json({ error: 'Please enter your full name' })
      req.user.name = n.slice(0, 80)
    }
    // The login number can only be changed after OTP verification (/account/phone/*)
    if (phone !== undefined && cleanPhone(phone) !== (req.user.phone || '')) {
      return res.status(400).json({ error: 'Verify your new mobile number with an OTP to change it' })
    }
    if (birthday !== undefined) {
      const b = String(birthday || '').trim()
      if (b && !/^\d{4}-\d{2}-\d{2}$/.test(b)) return res.status(400).json({ error: 'Birthday should be a date' })
      req.user.birthday = b
    }
    if (whatsappUpdates !== undefined) req.user.whatsappUpdates = Boolean(whatsappUpdates)
    await req.user.save()
    res.json({ user: req.user.toSafeJSON() })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

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

// ---------- Login number change (OTP verified) ----------
router.post('/phone/send-otp', async (req, res) => {
  try {
    const phone = cleanPhone(req.body?.phone)
    if (!PHONE_RE.test(phone)) {
      return res.status(400).json({ error: 'Enter a valid 10-digit Indian mobile number' })
    }
    if (phone === req.user.phone && req.user.phoneVerified) {
      return res.status(400).json({ error: 'This is already your verified login number' })
    }
    const taken = await User.findOne({ phone, _id: { $ne: req.user._id } }).select('_id').lean()
    if (taken) return res.status(409).json({ error: 'This number is already linked to another account' })

    const out = await issueOtp(phone, 'verify')
    const devCode = devCodeFor(req, out)
    res.json({ ok: true, sms: smsConfigured(), dev: out.dev, ...(devCode ? { devCode } : {}), retryAfter: out.retryAfter })
  } catch (err) {
    otpFail(res, err)
  }
})

router.post('/phone/verify', async (req, res) => {
  try {
    const phone = cleanPhone(req.body?.phone)
    if (!PHONE_RE.test(phone)) {
      return res.status(400).json({ error: 'Enter a valid 10-digit Indian mobile number' })
    }
    const taken = await User.findOne({ phone, _id: { $ne: req.user._id } }).select('_id').lean()
    if (taken) return res.status(409).json({ error: 'This number is already linked to another account' })

    await checkOtp(phone, 'verify', req.body?.otp)
    req.user.phone = phone
    req.user.phoneVerified = true
    await req.user.save()
    res.json({ user: req.user.toSafeJSON() })
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ error: 'This number is already linked to another account' })
    }
    otpFail(res, err)
  }
})

router.delete('/', async (req, res) => {
  try {
    const { phone } = req.body || {}
    if (req.user.role === 'admin') return res.status(400).json({ error: 'Admin accounts can’t be deleted from here' })
    if (!req.user.phone || cleanPhone(phone) !== req.user.phone) {
      return res.status(400).json({ error: 'Enter your registered mobile number to confirm' })
    }
    // Orders stay for the shop's records, just no longer linked to the account
    await Order.updateMany({ user: req.user._id }, { $set: { user: null } })
    await User.deleteOne({ _id: req.user._id })
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ---------- Addresses ----------
router.post('/addresses', async (req, res) => {
  try {
    if (req.user.addresses.length >= MAX_ADDRESSES) {
      return res.status(400).json({ error: `You can save up to ${MAX_ADDRESSES} addresses` })
    }
    const { error, address } = readAddress(req.body)
    if (error) return res.status(400).json({ error })
    const makeDefault = Boolean(req.body?.isDefault) || req.user.addresses.length === 0
    if (makeDefault) req.user.addresses.forEach((a) => { a.isDefault = false })
    req.user.addresses.push({ ...address, isDefault: makeDefault })
    await req.user.save()
    res.status(201).json({ user: req.user.toSafeJSON() })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/addresses/:id', async (req, res) => {
  try {
    const doc = req.user.addresses.id(req.params.id)
    if (!doc) return res.status(404).json({ error: 'Address not found' })
    const { error, address } = readAddress(req.body)
    if (error) return res.status(400).json({ error })
    Object.assign(doc, address)
    if (req.body?.isDefault) {
      req.user.addresses.forEach((a) => { a.isDefault = a._id.equals(doc._id) })
    }
    ensureOneDefault(req.user)
    await req.user.save()
    res.json({ user: req.user.toSafeJSON() })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/addresses/:id/default', async (req, res) => {
  try {
    const doc = req.user.addresses.id(req.params.id)
    if (!doc) return res.status(404).json({ error: 'Address not found' })
    req.user.addresses.forEach((a) => { a.isDefault = a._id.equals(doc._id) })
    await req.user.save()
    res.json({ user: req.user.toSafeJSON() })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/addresses/:id', async (req, res) => {
  try {
    const doc = req.user.addresses.id(req.params.id)
    if (!doc) return res.status(404).json({ error: 'Address not found' })
    doc.deleteOne()
    ensureOneDefault(req.user)
    await req.user.save()
    res.json({ user: req.user.toSafeJSON() })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ---------- Orders ----------
router.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).lean()
    res.json({ orders: orders.map(publicOrder) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// A customer can cancel their own order only while it's still pending
router.post('/orders/:id/cancel', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid order' })
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id })
    if (!order) return res.status(404).json({ error: 'Order not found' })
    if (order.status === 'cancelled') return res.status(409).json({ error: 'This order is already cancelled.' })
    if ((order.status || 'pending') !== 'pending') {
      return res.status(409).json({ error: 'This order is already being processed. Message us on WhatsApp to change it.' })
    }
    if (order.stockDeducted) {
      for (const item of order.items || []) {
        const qty = Number(item.qty) || 0
        if (item.productId && qty > 0) await Product.updateOne({ id: item.productId }, { $inc: { stock: qty } })
      }
      order.stockDeducted = false
    }
    order.status = 'cancelled'
    await order.save()
    res.json({ order: publicOrder(order.toObject()) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
