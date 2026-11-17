import express from 'express'
import Order from '../models/Order.js'
import Product from '../models/Product.js'
import Setting from '../models/Setting.js'
import { optionalAuth, requireAuth } from '../middleware/auth.js'

const router = express.Router()

async function getSiteDelivery() {
  try {
    const doc = await Setting.findOne({ key: 'site' }).lean()
    const site = doc?.value || {}
    const fee = Number(site.deliveryFee)
    return {
      deliveryFee: Number.isFinite(fee) && fee > 0 ? fee : 0,
      freeDeliveryAbove: Number(site.freeDeliveryAbove) || 0,
    }
  } catch {
    return { deliveryFee: 0, freeDeliveryAbove: 0 }
  }
}

// Atomic-ish stock deduction. Returns the lines that were deducted so the
// caller can put them back if any line is short.
async function deductStock(items) {
  const deducted = []
  const shortages = []

  for (const item of items) {
    const qty = Number(item.qty) || 0
    if (!item.productId || qty <= 0) continue

    const product = await Product.findOne({ id: item.productId }).select('name stock').lean()
    if (!product) continue // product was deleted — still keep the order line

    const available = Number(product.stock) || 0
    if (available < qty) {
      shortages.push(`${product.name || item.productId} (only ${available} left)`)
      continue
    }

    const res = await Product.updateOne(
      { id: item.productId, stock: { $gte: qty } },
      { $inc: { stock: -qty } },
    )
    if (res.modifiedCount === 1) deducted.push({ id: item.productId, qty })
    else shortages.push(`${product.name || item.productId} (stock changed, please retry)`)
  }

  return { deducted, shortages }
}

router.post('/', optionalAuth, async (req, res) => {
  let deducted = []
  try {
    const { ref, items, customer, channel } = req.body || {}
    if (!ref || !Array.isArray(items) || items.length === 0 || !customer) {
      return res.status(400).json({ error: 'ref, items and customer are required' })
    }

    // Rebuild the order lines from the database so prices and names can't be
    // tampered with from the browser.
    const cleaned = []
    for (const item of items) {
      const qty = Math.min(999, Math.max(1, Number(item.qty) || 1))
      const product = item.productId ? await Product.findOne({ id: item.productId }).lean() : null
      cleaned.push({
        productId: String(item.productId || (product?.id ?? '')),
        name: product?.name || String(item.name || ''),
        variant: product?.variant || String(item.variant || ''),
        price: Number(product?.price ?? item.price) || 0,
        qty,
        custom: typeof item.custom === 'string' ? item.custom.slice(0, 40) : '',
        lineTotal: (Number(product?.price ?? item.price) || 0) * qty,
      })
    }

    const stock = await deductStock(cleaned)
    deducted = stock.deducted
    if (stock.shortages.length) {
      // Put back anything we managed to reserve before the failure.
      for (const line of deducted) {
        await Product.updateOne({ id: line.id }, { $inc: { stock: line.qty } })
      }
      return res.status(409).json({ error: `Not enough stock: ${stock.shortages.join(', ')}` })
    }

    const subtotal = cleaned.reduce((sum, line) => sum + line.lineTotal, 0)
    const config = await getSiteDelivery()
    const fee = config.deliveryFee > 0 && !(config.freeDeliveryAbove && subtotal >= config.freeDeliveryAbove)
      ? config.deliveryFee
      : 0
    const deliveryKnown = config.deliveryFee > 0 || Boolean(config.freeDeliveryAbove)
    const total = subtotal + fee

    const order = await Order.create({
      ref: String(ref),
      user: req.user ? req.user._id : null,
      items: cleaned,
      subtotal,
      deliveryFee: fee,
      deliveryKnown,
      total,
      customer,
      channel: channel || 'whatsapp',
      status: 'pending',
      stockDeducted: stock.deducted.length > 0,
    })

    res.status(201).json({
      order: { id: order._id.toString(), ref: order.ref, status: order.status },
      totals: { subtotal, deliveryFee: fee, total, deliveryKnown },
    })
  } catch (err) {
    for (const line of deducted) {
      await Product.updateOne({ id: line.id }, { $inc: { stock: line.qty } }).catch(() => {})
    }
    if (err?.code === 11000) {
      return res.status(409).json({ error: 'Order with this ref already exists' })
    }
    res.status(500).json({ error: err.message || 'Failed to create order' })
  }
})

router.get('/my', requireAuth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).lean()
    res.json({ orders })
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to fetch orders' })
  }
})

export default router
