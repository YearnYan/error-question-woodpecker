import { Router } from 'express'
import { generateQuestions } from '../services/generator.js'
import { batchRenderFigures } from '../services/renderer.js'

const router = Router()

router.post('/', async (req, res) => {
  try {
    const { image, analysis } = req.body

    if (!analysis) {
      return res.status(400).json({ success: false, error: '缺少分析结果' })
    }

    const { subject, originalText, knowledgePoints, examPoints, hasGraph } = analysis

    console.log(`[Generate] Starting generation for ${subject}, hasGraph=${hasGraph}...`)
    const startTime = Date.now()

    // Step 1: Generate questions via AI
    const homework = await generateQuestions(
      originalText,
      knowledgePoints,
      examPoints,
      subject,
      hasGraph
    )

    console.log(`[Generate] Got ${homework.similar.length} similar, ${homework.variant.length} variant, ${homework.comprehensive.length} comprehensive`)

    // Step 2: If original has graph, render SVG for ALL questions
    if (hasGraph) {
      // Collect all questions (these are object references, mutations propagate)
      const allQuestions = [
        ...homework.similar,
        ...homework.variant,
        ...homework.comprehensive,
      ]

      // Log figure status before rendering
      allQuestions.forEach((q, i) => {
        const fig = q.figure?.trim() || ''
        const isSVG = fig.startsWith('<svg')
        const preview = fig.substring(0, 80)
        console.log(`[Generate] Q${i + 1} figure before render: isSVG=${isSVG}, len=${fig.length}, preview="${preview}"`)
      })

      // Render all figures - forceAll ensures every question gets an SVG
      await batchRenderFigures(allQuestions, subject, true)

      // Log figure status after rendering
      allQuestions.forEach((q, i) => {
        const fig = q.figure?.trim() || ''
        const isSVG = fig.startsWith('<svg')
        console.log(`[Generate] Q${i + 1} figure after render: isSVG=${isSVG}, len=${fig.length}`)
      })
    }

    const duration = Date.now() - startTime
    console.log(`[Generate] Completed in ${duration}ms`)

    res.json({ success: true, data: homework })
  } catch (err: any) {
    console.error('[Generate] Error:', err.message)
    res.status(500).json({
      success: false,
      error: `生成失败: ${err.message}`,
    })
  }
})

export default router
