import express from 'express'
import Setting from '../models/Setting.js'

const router = express.Router()

router.get('/', async (_req, res) => {
  try {
    const docs = await Setting.find().lean()
    const settings = {}
    for (const d of docs) settings[d.key] = d.value
    res.json({ settings })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
