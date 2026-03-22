import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'

const router = Router()

// Ensure uploads directory exists
const uploadsDir = path.resolve('uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true)
    } else {
      cb(new Error('只支持图片或PDF文件'))
    }
  },
})

router.post('/', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '请上传图片文件' })
    }

    // Read file and convert to base64
    const filePath = req.file.path
    const fileBuffer = fs.readFileSync(filePath)
    const base64 = `data:${req.file.mimetype};base64,${fileBuffer.toString('base64')}`

    res.json({
      success: true,
      data: {
        id: path.parse(req.file.filename).name,
        filename: req.file.filename,
        url: `/uploads/${req.file.filename}`,
        base64,
        size: req.file.size,
      },
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
