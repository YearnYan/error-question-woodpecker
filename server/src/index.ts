import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import uploadRouter from './routes/upload.js'
import analyzeRouter from './routes/analyze.js'
import generateRouter from './routes/generate.js'
import exportRouter from './routes/export.js'

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json({ limit: '20mb' }))
app.use(express.urlencoded({ extended: true, limit: '20mb' }))

// Static files for uploaded images
app.use('/uploads', express.static(path.resolve('uploads')))

// API Routes
app.use('/api/upload', uploadRouter)
app.use('/api/analyze', analyzeRouter)
app.use('/api/generate', generateRouter)
app.use('/api/export', exportRouter)

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server error:', err)
  res.status(500).json({
    success: false,
    error: err.message || '服务器内部错误',
  })
})

// Only listen when not running as serverless function (Vercel)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
}

export default app
