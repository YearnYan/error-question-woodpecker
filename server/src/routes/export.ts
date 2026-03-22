import { Router } from 'express'

const router = Router()

// PDF export - fallback to client-side print for now
// Full puppeteer implementation can be added later
router.post('/pdf', async (req, res) => {
  try {
    const { homework } = req.body

    if (!homework) {
      return res.status(400).json({ success: false, error: '缺少作业数据' })
    }

    // For now, return a 501 to signal client should use browser print
    res.status(501).json({
      success: false,
      error: '服务端PDF导出暂未启用，请使用浏览器打印功能',
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
