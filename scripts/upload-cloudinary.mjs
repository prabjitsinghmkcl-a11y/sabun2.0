// Uploads every image from public/products/ to Cloudinary, then points both
// the source files and the MongoDB records at the Cloudinary URLs.
//
// Usage: npm run upload:images
// Needs in .env:
//   CLOUDINARY_CLOUD_NAME=your-cloud-name
//   CLOUDINARY_API_KEY=123456789012345
//   CLOUDINARY_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxx

import 'dotenv/config'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import mongoose from 'mongoose'
import Product from '../server/models/Product.js'
import Setting from '../server/models/Setting.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const imagesDir = path.join(root, 'public', 'products')
const FILES_TO_REWRITE = [
  'src/data/products.js',
  'src/data/site.js',
  'src/pages/Home.jsx',
]

const cloudName = process.env.CLOUDINARY_CLOUD_NAME
const apiKey = process.env.CLOUDINARY_API_KEY
const apiSecret = process.env.CLOUDINARY_API_SECRET

if (!cloudName || !apiKey || !apiSecret) {
  console.error('Missing Cloudinary env vars. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET to .env')
  process.exit(1)
}

async function upload(file) {
  const buffer = await fs.readFile(path.join(imagesDir, file))
  const form = new FormData()
  const ext = path.extname(file)
  const publicId = `sabun/products/${path.basename(file, ext)}`
  form.append('file', new Blob([buffer]), file)
  form.append('public_id', publicId)
  form.append('overwrite', 'true')
  form.append('invalidate', 'true')

  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}` },
    body: form,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error?.message || `Upload failed (${res.status})`)
  return data.secure_url
}

function replaceAll(value, map) {
  if (typeof value === 'string') {
    for (const [local, url] of map) value = value.split(local).join(url)
    return value
  }
  if (Array.isArray(value)) return value.map((item) => replaceAll(item, map))
  if (value && typeof value === 'object') {
    const out = {}
    for (const [key, item] of Object.entries(value)) out[key] = replaceAll(item, map)
    return out
  }
  return value
}

async function main() {
  const files = (await fs.readdir(imagesDir)).filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f))
  if (files.length === 0) {
    console.log('No images found in public/products')
    return
  }

  console.log(`Uploading ${files.length} image(s) to Cloudinary (${cloudName})...`)
  const map = new Map()
  for (const file of files) {
    const url = await upload(file)
    map.set(`/products/${file}`, url)
    console.log(`  ${file} -> ${url}`)
  }

  // 1. Rewrite source files so the static fallback also uses Cloudinary
  for (const relative of FILES_TO_REWRITE) {
    const file = path.join(root, relative)
    let text = await fs.readFile(file, 'utf8')
    for (const [local, url] of map) text = text.split(local).join(url)
    await fs.writeFile(file, text)
    console.log(`Updated ${relative}`)
  }

  // 2. Update MongoDB (products + site settings) if a URI is available
  if (process.env.MONGODB_URI) {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('MongoDB connected')

    let products = 0
    for (const doc of await Product.find().lean()) {
      const img = replaceAll(doc.img, map)
      const thumb = replaceAll(doc.thumb, map)
      if (img !== doc.img || thumb !== doc.thumb) {
        await Product.updateOne({ _id: doc._id }, { $set: { img, thumb } })
        products++
      }
    }
    console.log(`Updated ${products} product(s) in MongoDB`)

    let settings = 0
    for (const doc of await Setting.find().lean()) {
      const value = replaceAll(doc.value, map)
      if (JSON.stringify(value) !== JSON.stringify(doc.value)) {
        await Setting.updateOne({ _id: doc._id }, { $set: { value } })
        settings++
      }
    }
    console.log(`Updated ${settings} setting(s) in MongoDB`)

    await mongoose.disconnect()
  } else {
    console.log('MONGODB_URI not set — skipped database update')
  }

  console.log('Done. Cloudinary URLs are now used everywhere.')
}

main().catch((err) => {
  console.error('Cloudinary upload failed:', err.message)
  process.exitCode = 1
})
