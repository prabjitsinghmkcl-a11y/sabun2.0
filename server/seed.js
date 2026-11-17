import 'dotenv/config'
import mongoose from 'mongoose'
import { connectDB } from './config/db.js'
import Product from './models/Product.js'
import Setting from './models/Setting.js'
import User from './models/User.js'
import { products, collections } from '../src/data/products.js'
import * as site from '../src/data/site.js'

const defaultSettings = {
  site: {
    igProfile: site.IG_PROFILE,
    igDm: site.IG_DM,
    waNumber: site.WA_NUMBER,
    orderNumberVersion: 2,
    waDisplay: site.WA_DISPLAY,
    helloWa: site.helloWa,
    maxQty: site.MAX_QTY,
    deliveryFee: site.DELIVERY_FEE,
    freeDeliveryAbove: site.FREE_DELIVERY_ABOVE,
    // Storefront contact details (editable in Admin → Settings)
    addressLine1: '',
    addressLine2: '',
    supportPhone: site.WA_DISPLAY,
    supportEmail: 'hello@sabun.in',
    weekdayHours: 'Mon – Fri, 10am – 6pm',
    weekendHours: 'Sat – Sun, 11am – 4pm',
    instagramHandle: '@hellosabun',
    instagramUrl: site.IG_PROFILE,
  },
  content: {
    promises: site.promises,
    steps: site.steps,
    faqs: site.faqs,
    marqueeItems: site.marqueeItems,
    igTiles: site.igTiles,
  },
  collections,
  states: site.INDIAN_STATES,
  copy: {
    brand: { name: 'SaBun', tagline: 'Handcrafted soap', footerText: 'Handcrafted soap, made slowly in small batches. Pure ingredients, palm-oil free, zero waste at heart.', city: 'India' },
    announcement: { items: ['Handcrafted soap', 'Palm-oil free', 'Order on WhatsApp'], cta: 'Questions? DM us' },
    header: { nav: [
      { to: '/shop', label: 'Shop', mobileLabel: 'Shop all soaps' },
      { to: '/#story', label: 'Our story', mobileLabel: 'Our story' },
      { to: '/#gifting', label: 'Gifting', mobileLabel: 'Gifting & hampers' },
      { to: '/#how', label: 'How to order', mobileLabel: 'How to order' },
      { to: '/#faq', label: 'FAQs', mobileLabel: 'FAQs' },
    ], shopCta: 'Shop now' },
    footer: { note: 'Orders are confirmed on WhatsApp before payment. Prices in INR.', instagramHandle: '@hellosabun on Instagram' },
    home: {
      hero: { eyebrow: 'Handcrafted soap · Small batches', title1: 'Little soaps,', title2: 'big joy.', lede: 'Hand-sculpted soap in shapes too lovely to forget — made with pure, palm-oil-free ingredients in small, thoughtful batches.', ctaPrimary: 'Shop the collection', ctaSecondary: 'DM us on Instagram' },
      collection: { eyebrow: 'The collection', title: 'Pick your little joy.', note: "Hand-sculpted pieces, made in small batches. Some shapes are limited — if one catches your eye, don't wait too long." },
      story: { eyebrow: 'Our story', title: 'Made by hand, meant for slow little moments.', text1: 'SaBun is a small soap studio with a simple belief: the things we reach for every day should feel a little special. So we sculpt them — into roses, lucky eyes, tiny cameras and bear-shaped friends.', text2: 'Every piece is handcrafted in small batches with pure, 100% natural ingredients. Always palm-oil free. Always zero waste at heart. And always made slowly enough to keep the joy in it.', signature: '— with love, Team SaBun', sticker: 'small batch, big heart' },
      gifting: { eyebrow: 'Gifting, sorted', title: 'Put a little joy in a box.', text: 'Birthdays, weddings, thank-yous or just because — mix any pieces from the collection into a hand-wrapped hamper. Tick “gift wrap” at checkout, or tell us the occasion and we\'ll make it feel personal.', ctaPrimary: 'Build a hamper', ctaSecondary: 'See the collection', note: 'New: Personalised Name Bouquets — ₹650' },
      how: { eyebrow: 'How it works', title: 'Cart to doorstep, in three steps.', sub: 'No payment on the website. Your order comes to us on WhatsApp, we confirm everything personally — the way handmade should be.' },
      faq: { eyebrow: 'Good to know', title1: 'Good questions,', title2: 'honest answers.', sub: "Still curious? We're only a DM away." },
      instagram: { eyebrow: '@hellosabun', title: 'A little joy, in your feed.', text: 'New shapes, fresh batches and behind-the-scenes from the studio. Follow along — and DM us when something catches your eye.', cta: 'Follow @hellosabun' },
    },
    shop: { eyebrow: 'The shop', title: 'Every little joy, in one place.', lede: 'Hand-sculpted, palm-oil-free soaps made in small batches. Add your favourites to the cart and send the order to us on WhatsApp.', customTitle: 'Looking for something custom?', customText: "Wedding favours, corporate gifts, a colour you can't find here — tell us what you have in mind.", customCta: 'Ask about custom orders' },
  },
}

async function seed() {
  try {
    await connectDB(process.env.MONGODB_URI)

    let upserted = 0
    for (const p of products) {
      await Product.updateOne(
        { id: p.id },
        { $set: { stock: 50, ...p } },
        { upsert: true },
      )
      upserted++
    }
    // Products created before stock tracking existed get a sensible default.
    await Product.updateMany({ stock: { $exists: false } }, { $set: { stock: 50 } })
    console.log(`Seeded ${upserted} products`)

    // Settings edited in the admin panel are kept. Only missing settings are added.
    // To wipe everything back to the defaults, run: npm run seed -- --reset-settings
    const resetSettings = process.argv.includes('--reset-settings')
    let added = 0
    for (const [key, value] of Object.entries(defaultSettings)) {
      if (resetSettings) {
        await Setting.updateOne({ key }, { $set: { key, value } }, { upsert: true })
        continue
      }
      const res = await Setting.updateOne({ key }, { $setOnInsert: { key, value } }, { upsert: true })
      if (res.upsertedCount) added++
    }
    console.log(
      resetSettings
        ? 'Site settings reset to the defaults'
        : `Site settings: ${added} added, existing ones kept (use --reset-settings to overwrite)`,
    )

    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@sabun.local').toLowerCase()
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
    const existingAdmin = await User.findOne({ email: adminEmail })
    if (!existingAdmin) {
      await User.create({
        name: 'Admin',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        verified: true,
      })
      console.log(`Created admin user: ${adminEmail} / ${adminPassword}`)
    } else {
      if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin'
        await existingAdmin.save()
      }
      console.log(`Admin user exists: ${adminEmail}`)
    }
  } catch (err) {
    console.error('Seed failed:', err.message)
    process.exitCode = 1
  } finally {
    await mongoose.disconnect()
  }
}

seed()
