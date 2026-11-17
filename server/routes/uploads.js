import express from 'express'
import multer from 'multer'
import { uploadBuffer } from '../config/cloudinary.js'

const router = express.Router()

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED.has(file.mimetype)) {
      return cb(new Error('Only JPG, PNG, WEBP or GIF images are allowed'))
    }
    cb(null, true)
  },
})

router.post('/image', (req, res) => {
  upload.single('image')(req, res, async (err) => {
    if (err) {
      const message = err.code === 'LIMIT_FILE_SIZE' ? 'Image is too large (max 5 MB)' : err.message
      return res.status(400).json({ error: message })
    }
    if (!req.file) return res.status(400).json({ error: 'Choose an image file to upload' })

    try {
      const result = await uploadBuffer(req.file.buffer)
      res.status(201).json({ url: result.url, publicId: result.publicId })
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  })
})

export default router
