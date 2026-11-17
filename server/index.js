import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import app from './app.js'
import { connectDB } from './config/db.js'

const PORT = process.env.PORT || 5000

// If the frontend has been built (npm run build), serve it from the same server.
// Useful on Render/Railway/a VPS: one process serves both the site and /api.
const distDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist')
if (fs.existsSync(path.join(distDir, 'index.html'))) {
  app.use(express.static(distDir))
  app.get(/^(?!\/api\/).*/, (_req, res) => res.sendFile(path.join(distDir, 'index.html')))
}

// Start listening right away so the site never gets "ECONNREFUSED".
// The database connects in the background; until it's ready, API calls
// answer with a clear "Database not reachable" message (see app.js).
const server = app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`)
  connectWithRetry()
})

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Close the other server (or change PORT in .env) and try again.`)
  } else {
    console.error('Server error:', err.message)
  }
  process.exit(1)
})

async function connectWithRetry(attempt = 1) {
  try {
    await connectDB()
  } catch (err) {
    console.error(`MongoDB connection failed (attempt ${attempt}): ${err.message}`)
    if (attempt === 1) {
      console.error(
        '  → Check MONGODB_URI in .env, your internet connection, and that your IP is allowed in\n' +
          '    MongoDB Atlas → Network Access (add your current IP or 0.0.0.0/0).',
      )
    }
    // Keep trying in the background; requests will connect as soon as Atlas is reachable.
    setTimeout(() => connectWithRetry(attempt + 1), Math.min(30000, 5000 * attempt))
  }
}
