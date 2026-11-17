// Set the WhatsApp number that receives orders (and the number shown on the site).
//   npm run set-whatsapp                 -> uses 9266145378 (SaBun's order number)
//   npm run set-whatsapp -- 9876543210   -> uses another 10-digit Indian number
// Only the WhatsApp fields are changed; all other site settings stay as they are.
import 'dotenv/config'
import mongoose from 'mongoose'
import { connectDB } from '../server/config/db.js'
import Setting from '../server/models/Setting.js'

const DEFAULT_NUMBER = '9266145378'

let digits = String(process.argv[2] || DEFAULT_NUMBER).replace(/\D/g, '')
if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2)
if (!/^[6-9]\d{9}$/.test(digits)) {
  console.error('Please give a valid 10-digit Indian mobile number, e.g. npm run set-whatsapp -- 9266145378')
  process.exit(1)
}

const waNumber = `91${digits}` // format wa.me links need
const waDisplay = `+91 ${digits.slice(0, 5)} ${digits.slice(5)}` // e.g. +91 92661 45378

try {
  await connectDB()
  const doc = await Setting.findOne({ key: 'site' }).lean()
  const before = doc?.value?.waNumber || '(not set — site uses the default)'
  const value = { ...(doc?.value || {}), waNumber, waDisplay, orderNumberVersion: 2 }
  await Setting.updateOne({ key: 'site' }, { $set: { key: 'site', value } }, { upsert: true })
  console.log('\nWhatsApp number updated.')
  console.log(`  Before:  ${before}`)
  console.log(`  Now:     ${waNumber}  (shown as ${waDisplay})`)
  console.log(`  Orders from checkout will now open WhatsApp chat with ${waDisplay}.\n`)
} catch (err) {
  console.error('Could not update the WhatsApp number:', err.message)
  process.exitCode = 1
} finally {
  await mongoose.disconnect()
}
