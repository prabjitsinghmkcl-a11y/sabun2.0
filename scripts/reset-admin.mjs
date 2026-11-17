// Reset (or create) the admin login.
//   npm run reset-admin                     -> uses ADMIN_EMAIL / ADMIN_PASSWORD from .env (or the defaults)
//   npm run reset-admin -- myNewPassword    -> sets this password for the admin email
//   npm run reset-admin -- me@shop.in pass  -> sets email + password
import 'dotenv/config'
import mongoose from 'mongoose'
import { connectDB } from '../server/config/db.js'
import User from '../server/models/User.js'

const args = process.argv.slice(2)
const email = (args.length >= 2 ? args[0] : process.env.ADMIN_EMAIL || 'admin@sabun.local').toLowerCase().trim()
const password = args.length >= 2 ? args[1] : args[0] || process.env.ADMIN_PASSWORD || 'admin123'

if (password.length < 6) {
  console.error('Password must be at least 6 characters.')
  process.exit(1)
}

try {
  await connectDB()
  let user = await User.findOne({ email })
  if (!user) {
    user = new User({ name: 'Admin', email, role: 'admin', verified: true })
  }
  user.password = password
  user.role = 'admin'
  await user.save()
  console.log('\nAdmin login is ready:')
  console.log(`  URL:      http://localhost:5173/admin/login`)
  console.log(`  Email:    ${email}`)
  console.log(`  Password: ${password}\n`)
} catch (err) {
  console.error('Could not reset admin:', err.message)
  process.exitCode = 1
} finally {
  await mongoose.disconnect()
}
