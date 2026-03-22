import { Router } from 'express'
import { analyzeQuestion } from '../services/analyzer.js'

const router = Router()

router.post('/', async (req, res) => {
  try {
    const { image } = req.body

    if (!image) {
      return res.status(400).json({ success: false, error: '缺少图片数据' })
    }

    // Validate base64 image
    if (!image.startsWith('data:image/')) {
      return res.status(400).json({ success: false, error: '无效的图片格式' })
    }

    console.log('[Analyze] Starting analysis...')
    const startTime = Date.now()

    const result = await analyzeQuestion(image)

    const duration = Date.now() - startTime
    console.log(`[Analyze] Completed in ${duration}ms, subject: ${result.subject}`)

    res.json({ success: true, data: result })
  } catch (err: any) {
    console.error('[Analyze] Error:', err.message)
    res.status(500).json({
      success: false,
      error: `分析失败: ${err.message}`,
    })
  }
})

export default router
