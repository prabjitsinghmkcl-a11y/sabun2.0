// One-time fix: make sure orders go to SaBun's WhatsApp number (+91 92661 45378).
// Runs automatically when the server connects to the database. It only changes
// the number once (it stores `orderNumberVersion` in the site settings), so if
// the admin later changes the number in Admin → Settings it is left alone.
import Setting from '../models/Setting.js'

export const ORDER_WA_NUMBER = '919266145378'
export const ORDER_WA_DISPLAY = '+91 92661 45378'
const VERSION = 2

export async function ensureOrderWhatsApp() {
  const doc = await Setting.findOne({ key: 'site' }).lean()
  const site = doc?.value || {}
  if (Number(site.orderNumberVersion) >= VERSION) return false

  const before = site.waNumber || '(default)'
  await Setting.updateOne(
    { key: 'site' },
    { $set: { key: 'site', value: { ...site, waNumber: ORDER_WA_NUMBER, waDisplay: ORDER_WA_DISPLAY, orderNumberVersion: VERSION } } },
    { upsert: true },
  )
  console.log(`[settings] Order WhatsApp number set: ${before} -> ${ORDER_WA_NUMBER}`)
  return true
}
