import { chatWithText } from './ai.js'
import { getCacheKey, getFromCache, setCache } from './cache.js'
import { getFigureConstraints } from '../prompts/figure-constraints.js'

/**
 * Render SVG graphics for a question based on its stem and figure description.
 */
export async function renderFigure(
  stem: string,
  subject: string,
  figureDescription?: string
): Promise<string> {
  const cacheInput = `svg:${stem}:${subject}:${figureDescription || ''}`
  const cacheKey = getCacheKey(cacheInput)
  const cached = getFromCache(cacheKey)
  if (cached) return cached

  const constraints = getFigureConstraints(subject)

  const systemPrompt = `你是一个专业的SVG图形生成器，专门为${subject}学科的题目生成精准、符合学科规范的矢量图形。

# 核心原则
图形必须在物理/化学/数学/生物等学科上**完全成立**，不允许"看起来像但实际错误"的图形。
务必严格遵守${subject}学科的图形约束规范，确保图形的准确性和可用性。

${constraints.hardRules}

${constraints.commonMistakes}

${constraints.svgTechnical}

# SVG通用技术要求
1. 只输出纯SVG代码，以<svg开头，以</svg>结尾，不要包含任何其他文本、解释或markdown标记
2. SVG必须有合理的viewBox（建议 0 0 400 300 或根据内容调整，确保图形不被裁切）
3. 使用黑色线条(stroke="#000" 或 stroke="#333")，白色或透明背景(fill="none" 或 fill="#fff")
4. 线条粗细适中(stroke-width="1.5" 到 "2")
5. 图形必须与题干和图形描述**完全精确匹配**，所有提到的元素都要画出来
6. 不要使用外部资源、链接或<image>标签
7. 确保SVG是自包含的、可以直接在浏览器中渲染的
8. 所有文字必须清晰可读，不与线条重叠
9. 关键点、线段、角度、标注必须精确对应题目要求
10. 如果是示意图而非按比例图，也要保持视觉上的合理性

# 失败处理
如果题目要求的图形无法满足学科约束（如电路不连通、受力方向错误、几何关系矛盾等），
则返回空字符串，不要输出错误的图形。`

  const userPrompt = `请为以下${subject}题目生成精准的SVG图形。

题干：${stem}
${figureDescription ? `\n图形详细描述：${figureDescription}` : ''}

请严格遵守${subject}学科的图形约束规范，生成一个精准匹配的SVG矢量图。
只输出SVG代码，不要任何其他内容。如果无法生成符合约束的图形，返回空字符串。`

  try {
    const response = await chatWithText(systemPrompt, userPrompt, {
      temperature: 0.2,
      maxTokens: 4096,
    })

    const svg = extractSVG(response)
    if (svg) {
      console.log(`[Renderer] SVG generated successfully (${svg.length} chars)`)
      setCache(cacheKey, svg)
      return svg
    }
    console.warn(`[Renderer] Failed to extract SVG from response (${response.length} chars)`)
    console.warn(`[Renderer] Response preview: ${response.substring(0, 200)}`)
    return ''
  } catch (err) {
    console.error('[Renderer] SVG rendering failed:', err)
    return ''
  }
}

function extractSVG(text: string): string {
  // Try to extract SVG tag directly
  const svgMatch = text.match(/<svg[\s\S]*?<\/svg>/i)
  if (svgMatch) return svgMatch[0]

  // Try extracting from code block
  const codeMatch = text.match(/```(?:svg|xml|html)?\s*([\s\S]*?)```/)
  if (codeMatch) {
    const inner = codeMatch[1].trim()
    const innerSvg = inner.match(/<svg[\s\S]*?<\/svg>/i)
    if (innerSvg) return innerSvg[0]
  }

  return ''
}

/**
 * Batch render figures for all questions.
 * When forceAll=true, every question MUST get a figure.
 * figure field from AI contains natural language description, not SVG.
 */
export async function batchRenderFigures(
  questions: Array<{ stem: string; figure?: string | null }>,
  subject: string,
  forceAll: boolean = false
): Promise<void> {
  console.log(`[Renderer] Batch rendering ${questions.length} questions, forceAll=${forceAll}`)

  // Process sequentially in batches of 3 to avoid rate limits
  for (let i = 0; i < questions.length; i += 3) {
    const batch = questions.slice(i, i + 3)
    const promises = batch.map(async (q, batchIdx) => {
      const idx = i + batchIdx
      const figureText = q.figure?.trim() || ''
      const isAlreadySVG = figureText.startsWith('<svg')

      if (isAlreadySVG) {
        console.log(`[Renderer] Q${idx + 1}: already has valid SVG`)
        return
      }

      if (figureText.length > 0) {
        // Has description text - render it to SVG
        console.log(`[Renderer] Q${idx + 1}: rendering from description (${figureText.substring(0, 60)}...)`)
        const svg = await renderFigure(q.stem, subject, figureText)
        if (svg) {
          q.figure = svg
          console.log(`[Renderer] Q${idx + 1}: SVG generated OK`)
        } else {
          console.warn(`[Renderer] Q${idx + 1}: description render failed, trying stem-only`)
          const svgFromStem = await renderFigure(q.stem, subject)
          if (svgFromStem) q.figure = svgFromStem
          else console.error(`[Renderer] Q${idx + 1}: all render attempts failed`)
        }
      } else if (forceAll) {
        // No description at all - generate from stem
        console.log(`[Renderer] Q${idx + 1}: no description, force-generating from stem`)
        const svg = await renderFigure(q.stem, subject)
        if (svg) {
          q.figure = svg
          console.log(`[Renderer] Q${idx + 1}: SVG generated OK from stem`)
        } else {
          console.error(`[Renderer] Q${idx + 1}: force render from stem failed`)
        }
      }
    })

    await Promise.allSettled(promises)
  }

  // Final count
  const finalCount = questions.filter(q => q.figure && q.figure.trim().startsWith('<svg')).length
  console.log(`[Renderer] Batch complete: ${finalCount}/${questions.length} have valid SVG`)
}
