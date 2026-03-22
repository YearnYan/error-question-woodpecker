import { Router } from 'express'
import { exportToWord } from '../services/word-exporter.js'
import { exportToPDF } from '../services/pdf-exporter.js'
import type { HomeworkData } from '../services/generator.js'

const router = Router()

/**
 * Export homework to PDF document
 */
router.post('/pdf', async (req, res) => {
  try {
    const homework = req.body.homework as HomeworkData

    if (!homework || !homework.subject) {
      return res.status(400).json({ error: '缺少作业数据' })
    }

    console.log(`[Export] Generating PDF document for ${homework.subject}`)

    const buffer = await exportToPDF(homework)

    const filename = `举一反三练习_${homework.subject}_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.pdf`

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`)
    res.setHeader('Content-Length', buffer.length)

    res.send(buffer)

    console.log(`[Export] PDF document generated successfully (${buffer.length} bytes)`)
  } catch (err) {
    console.error('[Export] PDF generation failed:', err)
    res.status(500).json({ error: '导出PDF文档失败' })
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

    const filename = `举一反三练习_${homework.subject}_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.doc`

    res.setHeader('Content-Type', 'application/msword')
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
