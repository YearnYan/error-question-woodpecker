import { Router } from 'express'
import { generateQuestions } from '../services/generator.js'
import { renderFigure } from '../services/renderer.js'
import type { HomeworkData } from '../services/generator.js'

const router = Router()

router.post('/', async (req, res) => {
  try {
    const { analysis } = req.body

    if (!analysis) {
      return res.status(400).json({ success: false, error: '缺少分析结果' })
    }

    const { subject, originalText, knowledgePoints, examPoints, hasGraph } = analysis

    // SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    })

    const sendEvent = (event: string, data: any) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
    }

    const startTime = Date.now()

    // Phase 1: Generate questions (1 AI call)
    sendEvent('progress', { phase: 'generating', message: '正在生成题目...', percent: 10 })

    const homework = await generateQuestions(
      originalText, knowledgePoints, examPoints, subject, hasGraph
    )

    // Send questions immediately (without figures)
    sendEvent('progress', { phase: 'questions_ready', message: '题目生成完成，正在渲染图形...', percent: 30 })
    sendEvent('questions', homework)

    // Phase 2: Render figures in parallel (if needed)
    if (hasGraph) {
      const allQuestions = [
        ...homework.similar,
        ...homework.variant,
        ...homework.comprehensive,
      ]

      const total = allQuestions.length
      let completed = 0

      // Launch ALL figure renders in parallel
      const renderPromises = allQuestions.map(async (q, idx) => {
        const figureText = q.figure?.trim() || ''
        const isAlreadySVG = figureText.startsWith('<svg')

        if (isAlreadySVG) {
          completed++
          sendEvent('progress', {
            phase: 'rendering',
            message: `图形渲染中 (${completed}/${total})`,
            percent: 30 + Math.round((completed / total) * 65),
          })
          return
        }

        try {
          let svg = ''
          if (figureText.length > 0) {
            svg = await renderFigure(q.stem, subject, figureText)
          }
          if (!svg) {
            svg = await renderFigure(q.stem, subject)
          }

          if (svg) {
            q.figure = svg
            // Send this individual figure update immediately
            const section = idx < homework.similar.length ? 'similar'
              : idx < homework.similar.length + homework.variant.length ? 'variant'
              : 'comprehensive'
            const sectionIdx = idx < homework.similar.length ? idx
              : idx < homework.similar.length + homework.variant.length ? idx - homework.similar.length
              : idx - homework.similar.length - homework.variant.length

            sendEvent('figure', { section, index: sectionIdx, svg })
          }
        } catch (err) {
          console.error(`[Generate] Figure render failed for Q${idx + 1}:`, err)
        }

        completed++
        sendEvent('progress', {
          phase: 'rendering',
          message: `图形渲染中 (${completed}/${total})`,
          percent: 30 + Math.round((completed / total) * 65),
        })
      })

      await Promise.allSettled(renderPromises)
    }

    // Phase 3: Done
    sendEvent('progress', { phase: 'done', message: '生成完成', percent: 100 })
    sendEvent('done', homework)
    res.end()

    const duration = Date.now() - startTime
    console.log(`[Generate] Completed in ${duration}ms`)
  } catch (err: any) {
    console.error('[Generate] Error:', err.message)
    // If headers already sent, send error event
    if (res.headersSent) {
      res.write(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`)
      res.end()
    } else {
      res.status(500).json({ success: false, error: `生成失败: ${err.message}` })
    }
  }
})

// Append more questions to existing homework
router.post('/append', async (req, res) => {
  try {
    const { analysis, existingHomework } = req.body as {
      analysis: any
      existingHomework: HomeworkData
    }

    if (!analysis || !existingHomework) {
      return res.status(400).json({ success: false, error: '缺少分析结果或已有作业数据' })
    }

    const { subject, originalText, knowledgePoints, examPoints, hasGraph } = analysis

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    })

    const sendEvent = (event: string, data: any) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
    }

    sendEvent('progress', { phase: 'generating', message: '正在生成更多题目...', percent: 10 })

    const newQuestions = await generateQuestions(
      originalText, knowledgePoints, examPoints, subject, hasGraph,
      { similar: existingHomework.similar, variant: existingHomework.variant, comprehensive: existingHomework.comprehensive }
    )

    // Merge: append new questions after existing ones
    const merged: HomeworkData = {
      ...existingHomework,
      similar: [...existingHomework.similar, ...newQuestions.similar],
      variant: [...existingHomework.variant, ...newQuestions.variant],
      comprehensive: [...existingHomework.comprehensive, ...newQuestions.comprehensive],
      generatedAt: new Date().toISOString(),
    }

    sendEvent('progress', { phase: 'questions_ready', message: '新题目生成完成，正在渲染图形...', percent: 30 })
    sendEvent('questions', merged)

    // Render figures for NEW questions only
    if (hasGraph) {
      const newAll = [...newQuestions.similar, ...newQuestions.variant, ...newQuestions.comprehensive]
      const total = newAll.length
      let completed = 0

      const renderPromises = newAll.map(async (q, idx) => {
        const figureText = q.figure?.trim() || ''
        if (figureText.startsWith('<svg')) { completed++; return }

        try {
          let svg = ''
          if (figureText.length > 0) svg = await renderFigure(q.stem, subject, figureText)
          if (!svg) svg = await renderFigure(q.stem, subject)

          if (svg) {
            q.figure = svg
            // Calculate section and index in the MERGED array
            const section = idx < newQuestions.similar.length ? 'similar'
              : idx < newQuestions.similar.length + newQuestions.variant.length ? 'variant'
              : 'comprehensive'
            const baseOffset = section === 'similar' ? existingHomework.similar.length
              : section === 'variant' ? existingHomework.variant.length
              : existingHomework.comprehensive.length
            const sectionIdx = idx < newQuestions.similar.length ? idx
              : idx < newQuestions.similar.length + newQuestions.variant.length ? idx - newQuestions.similar.length
              : idx - newQuestions.similar.length - newQuestions.variant.length

            sendEvent('figure', { section, index: baseOffset + sectionIdx, svg })
          }
        } catch (err) {
          console.error(`[Generate/Append] Figure render failed for Q${idx + 1}:`, err)
        }

        completed++
        sendEvent('progress', {
          phase: 'rendering',
          message: `图形渲染中 (${completed}/${total})`,
          percent: 30 + Math.round((completed / total) * 65),
        })
      })

      await Promise.allSettled(renderPromises)
    }

    sendEvent('progress', { phase: 'done', message: '生成完成', percent: 100 })
    sendEvent('done', merged)
    res.end()
  } catch (err: any) {
    console.error('[Generate/Append] Error:', err.message)
    if (res.headersSent) {
      res.write(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`)
      res.end()
    } else {
      res.status(500).json({ success: false, error: `追加生成失败: ${err.message}` })
    }
  }
})

export default router
