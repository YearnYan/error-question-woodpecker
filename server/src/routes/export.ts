import { Router } from 'express'
import { exportToWord } from '../services/word-exporter.js'
import type { HomeworkData } from '../services/generator.js'

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

/**
 * Export homework to Word document
 */
router.post('/word', async (req, res) => {
  try {
    const homework = req.body.homework as HomeworkData

    if (!homework || !homework.subject) {
      return res.status(400).json({ error: '缺少作业数据' })
    }

    console.log(`[Export] Generating Word document for ${homework.subject}`)

    const buffer = await exportToWord(homework)

    const filename = `举一反三练习_${homework.subject}_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.docx`

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`)
    res.setHeader('Content-Length', buffer.length)

    res.send(buffer)

    console.log(`[Export] Word document generated successfully (${buffer.length} bytes)`)
  } catch (err) {
    console.error('[Export] Word generation failed:', err)
    res.status(500).json({ error: '导出Word文档失败' })
  }
})

export default router
