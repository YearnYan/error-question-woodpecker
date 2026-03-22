import { chatWithImage } from './ai.js'
import { ANALYZE_SYSTEM_PROMPT, ANALYZE_USER_PROMPT } from '../prompts/analyze.js'

export interface AnalysisResult {
  subject: string
  originalText: string
  knowledgePoints: string[]
  examPoints: string[]
  answer: string
  solution: string
  hasGraph: boolean
}

export async function analyzeQuestion(imageBase64: string): Promise<AnalysisResult> {
  const response = await chatWithImage(
    ANALYZE_SYSTEM_PROMPT,
    ANALYZE_USER_PROMPT,
    imageBase64,
    { temperature: 0.3, maxTokens: 4096 }
  )

  // Parse JSON from response, handling possible markdown wrapping
  const jsonStr = extractJSON(response)
  const fixedJson = fixJsonString(jsonStr)
  const result = safeParseJSON(fixedJson) as AnalysisResult

  // Validate required fields
  if (!result.subject || !result.originalText) {
    throw new Error('分析结果缺少必要字段')
  }

  // Normalize subject name
  const validSubjects = ['数学', '物理', '化学', '生物', '地理', '英语', '政治', '历史']
  if (!validSubjects.includes(result.subject)) {
    result.subject = '数学' // fallback
  }

  return result
}

function extractJSON(text: string): string {
  // Try to extract JSON from potential markdown code blocks
  const jsonBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonBlockMatch) {
    return jsonBlockMatch[1].trim()
  }

  // Try to find JSON object directly
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    return jsonMatch[0]
  }

  throw new Error('无法从AI响应中提取JSON')
}

/**
 * Fix invalid JSON escape sequences from AI-generated LaTeX content.
 * LaTeX uses backslashes (\frac, \sqrt, \theta) which are invalid JSON escapes.
 */
function fixJsonString(jsonStr: string): string {
  let result = ''
  let inString = false
  let i = 0

  while (i < jsonStr.length) {
    const ch = jsonStr[i]

    if (!inString) {
      if (ch === '"') inString = true
      result += ch
      i++
    } else {
      if (ch === '\\') {
        const next = jsonStr[i + 1]
        if (next && '"\\bfnrtu/'.includes(next)) {
          result += ch + next
          i += 2
        } else {
          result += '\\\\'
          i++
        }
      } else if (ch === '"') {
        inString = false
        result += ch
        i++
      } else if (ch === '\n') {
        result += '\\n'
        i++
      } else if (ch === '\r') {
        result += '\\r'
        i++
      } else if (ch === '\t') {
        result += '\\t'
        i++
      } else {
        result += ch
        i++
      }
    }
  }

  return result
}

function safeParseJSON(jsonStr: string): any {
  try {
    return JSON.parse(jsonStr)
  } catch (e1) {
    try {
      let aggressive = jsonStr
        .replace(/\\\\/g, '\x00DBLBACK\x00')
        .replace(/\\(?!["\\/bfnrtu])/g, '\\\\')
        .replace(/\x00DBLBACK\x00/g, '\\\\')
      return JSON.parse(aggressive)
    } catch (e2) {
      const err = e1 as Error
      throw new Error(`JSON解析失败: ${err.message}`)
    }
  }
}
