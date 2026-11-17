import express from 'express'
import mongoose from 'mongoose'
import Product from '../models/Product.js'
import Order from '../models/Order.js'
import User from '../models/User.js'
import Setting from '../models/Setting.js'
import {
  ORDER_STATUSES,
  ALLOWED_STATUS_TRANSITIONS,
  canTransition,
  nextStatuses,
} from '../constants/orderStatus.js'

const router = express.Router()

// Only these fields can be written from the admin panel.
const PRODUCT_FIELDS = [
  'name', 'variant', 'tag', 'isNew', 'price', 'priceNote', 'stock', 'desc', 'longDesc', 'note',
  'personalise', 'img', 'thumb', 'alt', 'tint', 'width', 'height', 'photo',
]

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function cleanProduct(body = {}) {
  const out = {}
  for (const key of PRODUCT_FIELDS) {
    if (!(key in body)) continue
    out[key] = body[key]
  }
  if ('price' in out) out.price = Number(out.price)
  if ('stock' in out) out.stock = Math.max(0, Math.round(Number(out.stock) || 0))
  for (const k of ['width', 'height']) {
    if (k in out) {
      const n = Number(out[k])
      if (out[k] === '' || out[k] === null || Number.isNaN(n)) out[k] = undefined
      else out[k] = n
    }
  }
  if ('isNew' in out) out.isNew = Boolean(out.isNew)
  if ('photo' in out) out.photo = Boolean(out.photo)
  for (const k of ['name', 'variant', 'tag', 'priceNote', 'desc', 'longDesc', 'note', 'img', 'thumb', 'alt', 'tint']) {
    if (k in out) out[k] = out[k] == null ? '' : String(out[k]).trim()
  }
  if ('personalise' in out) {
    const p = out.personalise
    if (!p || !p.label) out.personalise = undefined
    else {
      out.personalise = {
        label: String(p.label).trim(),
        placeholder: String(p.placeholder || '').trim(),
        maxLength: Number(p.maxLength) || 20,
      }
    }
  }
  if ('name' in out && out.name.length > 200) out.name = out.name.slice(0, 200)
  if ('desc' in out && out.desc.length > 5000) out.desc = out.desc.slice(0, 5000)
  if ('longDesc' in out && out.longDesc.length > 5000) out.longDesc = out.longDesc.slice(0, 5000)
  if ('tag' in out && out.tag.length > 80) out.tag = out.tag.slice(0, 80)
  if ('price' in out) {
    if (!Number.isFinite(out.price)) out.price = 0
    out.price = Math.min(10000000, Math.max(0, out.price))
  }
  return out
}

function validateProduct(p, { partial = false } = {}) {
  if (!partial || 'name' in p) {
    if (!p.name) return 'Name is required'
  }
  if (!partial || 'price' in p) {
    if (!Number.isFinite(p.price) || p.price < 0) return 'Price must be a number ≥ 0'
  }
  if ('stock' in p && (!Number.isFinite(p.stock) || p.stock < 0)) {
    return 'Stock must be a number ≥ 0'
  }
  return null
}

const isObjectId = (id) => mongoose.Types.ObjectId.isValid(id)

async function restoreStock(order) {
  if (!order?.stockDeducted) return false
  for (const item of order.items || []) {
    const qty = Number(item.qty) || 0
    if (!item.productId || qty <= 0) continue
    await Product.updateOne({ id: item.productId }, { $inc: { stock: qty } })
  }
  return true
}

// --- Meta (statuses + transitions for the admin UI) ---
router.get('/meta', (_req, res) => {
  res.json({ statuses: ORDER_STATUSES, transitions: ALLOWED_STATUS_TRANSITIONS })
})

// --- Products ---
router.get('/products', async (_req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 }).lean()
    res.json({ products })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/products', async (req, res) => {
  try {
    const id = String(req.body?.id || '').trim().toLowerCase()
    if (!id) return res.status(400).json({ error: 'Product id (slug) is required' })
    if (!SLUG_RE.test(id)) {
      return res.status(400).json({ error: 'Product id may only use lowercase letters, numbers and dashes (e.g. rose-soap)' })
    }
    const data = cleanProduct(req.body)
    const problem = validateProduct(data)
    if (problem) return res.status(400).json({ error: problem })

    const exists = await Product.findOne({ id })
    if (exists) return res.status(409).json({ error: 'A product with this id already exists' })
    const product = await Product.create({ stock: 50, ...data, id })
    res.status(201).json({ product })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/products/:id', async (req, res) => {
  try {
    const data = cleanProduct(req.body)
    const problem = validateProduct(data, { partial: true })
    if (problem) return res.status(400).json({ error: problem })

    const update = { $set: {}, $unset: {} }
    for (const [k, v] of Object.entries(data)) {
      if (v === undefined) update.$unset[k] = 1
      else update.$set[k] = v
    }
    if (!Object.keys(update.$unset).length) delete update.$unset

    const product = await Product.findOneAndUpdate({ id: req.params.id }, update, { new: true, runValidators: true })
    if (!product) return res.status(404).json({ error: 'Product not found' })
    res.json({ product })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/products/:id', async (req, res) => {
  try {
    const out = await Product.findOneAndDelete({ id: req.params.id })
    if (!out) return res.status(404).json({ error: 'Product not found' })
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// --- Orders ---
router.get('/orders', async (_req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).lean()
    res.json({ orders, statuses: ORDER_STATUSES, transitions: ALLOWED_STATUS_TRANSITIONS })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

async function updateOrderStatus(req, res) {
  try {
    if (!isObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid order id' })
    const { status } = req.body || {}
    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${ORDER_STATUSES.join(', ')}` })
    }

    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ error: 'Order not found' })

    const from = order.status || 'pending'
    if (!canTransition(from, status)) {
      return res.status(409).json({
        error: `Cannot change an order from “${from}” to “${status}”. Allowed next: ${nextStatuses(from).join(', ') || 'none'}`,
      })
    }

    let stockNote = null
    if (status === 'cancelled') {
      const restored = await restoreStock(order)
      if (restored) {
        order.stockDeducted = false
        stockNote = 'Stock restored'
      }
    }

    order.status = status
    await order.save()
    res.json({ order: order.toObject(), note: stockNote })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

router.put('/orders/:id/status', updateOrderStatus)
// Backwards-compatible status update (same rules as /status).
router.put('/orders/:id', updateOrderStatus)

router.delete('/orders/:id', async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid order id' })
    const out = await Order.findById(req.params.id)
    if (!out) return res.status(404).json({ error: 'Order not found' })
    if (out.status !== 'cancelled') await restoreStock(out)
    await out.deleteOne()
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// --- Users / customers ---
router.get('/users', async (_req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).lean()
    res.json({
      users: users.map((u) => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email && !u.email.endsWith('@mobile.sabun.local') ? u.email : '',
        phone: u.phone,
        role: u.role,
        verified: Boolean(u.verified),
        createdAt: u.createdAt,
      })),
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/users/:id/role', async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid user id' })
    const { role } = req.body || {}
    if (!['user', 'admin'].includes(role)) return res.status(400).json({ error: 'Invalid role' })

    if (role === 'user') {
      if (req.user._id.toString() === req.params.id) {
        return res.status(400).json({ error: "You can't remove your own admin access" })
      }
      const admins = await User.countDocuments({ role: 'admin' })
      const target = await User.findById(req.params.id)
      if (target?.role === 'admin' && admins <= 1) {
        return res.status(400).json({ error: 'At least one admin must remain' })
      }
    }

    const user = await User.findByIdAndUpdate(req.params.id, { $set: { role } }, { new: true })
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json({ user: user.toSafeJSON() })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/users/:id', async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid user id' })
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ error: "You can't delete your own account" })
    }
    const out = await User.findByIdAndDelete(req.params.id)
    if (!out) return res.status(404).json({ error: 'User not found' })
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// --- Settings (site config) ---
async function readSettings() {
  const docs = await Setting.find().lean()
  const settings = {}
  for (const d of docs) settings[d.key] = d.value
  return settings
}

router.get('/settings', async (_req, res) => {
  try {
    res.json({ settings: await readSettings() })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/settings', async (req, res) => {
  try {
    const entries = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : null
    if (!entries) return res.status(400).json({ error: 'Send an object like { "site": { ... } }' })
    const ops = Object.entries(entries)
      .filter(([key]) => /^[a-zA-Z0-9_-]+$/.test(key))
      .map(([key, value]) => ({
        updateOne: { filter: { key }, update: { $set: { key, value } }, upsert: true },
      }))
    if (ops.length) await Setting.bulkWrite(ops)
    res.json({ settings: await readSettings() })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// --- Analytics (dashboard) ---
router.get('/analytics', async (_req, res) => {
  try {
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
    sixMonthsAgo.setDate(1)
    sixMonthsAgo.setHours(0, 0, 0, 0)

    const [totalOrders, totalProducts, totalUsers, revenueAgg, statusAgg, recentOrders, lowStockProducts, monthlyAgg] =
      await Promise.all([
        Order.countDocuments(),
        Product.countDocuments(),
        User.countDocuments({ role: 'user' }),
        Order.aggregate([
          { $match: { status: { $in: ['paid', 'shipped', 'delivered'] } } },
          { $group: { _id: null, total: { $sum: '$total' } } },
        ]),
        Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
        Order.find().sort({ createdAt: -1 }).limit(5).lean(),
        Product.find({ stock: { $lte: 10 } }).sort({ stock: 1 }).limit(6).lean(),
        Order.find(
          { status: { $in: ['paid', 'shipped', 'delivered'] }, createdAt: { $gte: sixMonthsAgo } },
          { total: 1, createdAt: 1 },
        ).lean(),
      ])

    const orderStatusCounts = {}
    for (const s of ORDER_STATUSES) orderStatusCounts[s] = 0
    for (const row of statusAgg) {
      const key = row._id || 'pending'
      orderStatusCounts[key] = row.count
    }

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    // Always return the last 6 months (including months with no sales)
    const monthlyRevenue = []
    for (let i = 0; i < 6; i += 1) {
      const d = new Date(sixMonthsAgo.getFullYear(), sixMonthsAgo.getMonth() + i, 1)
      monthlyRevenue.push({ y: d.getFullYear(), m: d.getMonth(), label: `${monthNames[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`, total: 0, orders: 0 })
    }
    for (const o of monthlyAgg) {
      const d = new Date(o.createdAt)
      const row = monthlyRevenue.find((r) => r.y === d.getFullYear() && r.m === d.getMonth())
      if (row) {
        row.total += Number(o.total) || 0
        row.orders += 1
      }
    }

    res.json({
      totalOrders,
      totalProducts,
      totalUsers,
      totalRevenue: revenueAgg[0]?.total || 0,
      orderStatusCounts,
      monthlyRevenue,
      recentOrders,
      lowStockProducts,
      statuses: ORDER_STATUSES,
      transitions: ALLOWED_STATUS_TRANSITIONS,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Kept for backwards compatibility with older dashboard builds.
router.get('/stats', async (_req, res) => {
  try {
    const [products, orders, users, revenueAgg, byStatusAgg, recentOrders] = await Promise.all([
      Product.countDocuments(),
      Order.countDocuments(),
      User.countDocuments(),
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Order.find().sort({ createdAt: -1 }).limit(5).lean(),
    ])
    const byStatus = {}
    for (const s of byStatusAgg) byStatus[s._id || 'pending'] = s.count
    res.json({
      stats: { products, orders, users, revenue: revenueAgg[0]?.total || 0, byStatus },
      recentOrders,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
