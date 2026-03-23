import { chatWithText } from './ai.js'
import { getGenerateSystemPrompt, getGenerateUserPrompt, getAppendGenerateUserPrompt } from '../prompts/generate.js'
import { getCacheKey, getFromCache, setCache } from './cache.js'

export interface GeneratedQuestion {
  type: 'similar' | 'variant' | 'comprehensive'
  typeLabel: string
  stem: string
  options?: string[] | null
  figure?: string | null
  answerArea: number
  answer?: string | null
  solution?: string | null
}

export interface HomeworkData {
  subject: string
  originalQuestion: string
  similar: GeneratedQuestion[]
  variant: GeneratedQuestion[]
  comprehensive: GeneratedQuestion[]
  generatedAt: string
}

export async function generateQuestions(
  originalText: string,
  knowledgePoints: string[],
  examPoints: string[],
  subject: string,
  hasGraph: boolean,
  existingQuestions?: { similar: any[], variant: any[], comprehensive: any[] }
): Promise<HomeworkData> {
  // Check cache (only for initial generation, not append)
  if (!existingQuestions) {
    const cacheInput = JSON.stringify({ originalText, knowledgePoints, examPoints, subject, hasGraph })
    const cacheKey = getCacheKey(cacheInput)
    const cached = getFromCache(cacheKey)
    if (cached) {
      return JSON.parse(cached)
    }
  }

  const systemPrompt = getGenerateSystemPrompt(subject, hasGraph)
  const userPrompt = existingQuestions
    ? getAppendGenerateUserPrompt(originalText, knowledgePoints, examPoints, subject, hasGraph, existingQuestions)
    : getGenerateUserPrompt(originalText, knowledgePoints, examPoints, subject, hasGraph)

  const response = await chatWithText(systemPrompt, userPrompt, {
    temperature: 0.8,
    maxTokens: 16384,
  })

  // Parse response - fix common JSON issues from AI output
  const jsonStr = extractJSON(response)
  const fixedJson = fixJsonString(jsonStr)
  const parsed = safeParseJSON(fixedJson)

  // Normalize and validate
  const homework: HomeworkData = {
    subject,
    originalQuestion: examPoints.join('、'),
    similar: normalizeQuestions(parsed.similar, 'similar', '相似题'),
    variant: normalizeQuestions(parsed.variant, 'variant', '变式题'),
    comprehensive: normalizeQuestions(parsed.comprehensive, 'comprehensive', '综合应用题'),
    generatedAt: new Date().toISOString(),
  }

  // Cache result (only for initial generation)
  if (!existingQuestions) {
    const cacheInput = JSON.stringify({ originalText, knowledgePoints, examPoints, subject, hasGraph })
    const cacheKey = getCacheKey(cacheInput)
    setCache(cacheKey, JSON.stringify(homework))
  }

  return homework
}

function normalizeQuestions(
  questions: any[],
  type: GeneratedQuestion['type'],
  typeLabel: string
): GeneratedQuestion[] {
  if (!Array.isArray(questions)) return []

  return questions.map((q) => ({
    type,
    typeLabel,
    stem: q.stem || '',
    options: Array.isArray(q.options) ? q.options : null,
    figure: q.figure || null,
    answerArea: q.answerArea || (q.options ? 1 : 4),
    answer: q.answer || null,
    solution: q.solution || null,
  }))
}

function extractJSON(text: string): string {
  const jsonBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonBlockMatch) return jsonBlockMatch[1].trim()

  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) return jsonMatch[0]

  throw new Error('无法从AI响应中提取JSON')
}

/**
 * Fix common JSON issues in AI-generated output:
 * - LaTeX backslashes like \frac, \sqrt, \theta etc. are invalid JSON escapes
 * - Unescaped newlines inside string values
 * - Control characters
 */
function fixJsonString(jsonStr: string): string {
  // Strategy: walk through the string character by character,
  // and when inside a JSON string value, fix bad escape sequences.
  let result = ''
  let inString = false
  let i = 0

  while (i < jsonStr.length) {
    const ch = jsonStr[i]

    if (!inString) {
      if (ch === '"') {
        inString = true
        result += ch
      } else {
        result += ch
      }
      i++
    } else {
      // Inside a JSON string
      if (ch === '\\') {
        const next = jsonStr[i + 1]
        // Valid JSON escapes: " \ / b f n r t u
        if (next && '"\\bfnrtu/'.includes(next)) {
          result += ch + next
          i += 2
        } else {
          // Invalid escape like \f(rac), \s(qrt), \t(heta) - but \t is valid!
          // Double-escape: turn \ into \\
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

/**
 * Robust JSON parse with multiple fallback strategies
 */
function safeParseJSON(jsonStr: string): any {
  // Attempt 1: direct parse
  try {
    return JSON.parse(jsonStr)
  } catch (e1) {
    // Attempt 2: try fixing the string again with a regex approach
    try {
      // Replace all backslashes inside strings that aren't valid JSON escapes
      const regexFixed = jsonStr.replace(
        /\\(?!["\\/bfnrtu])/g,
        '\\\\\\\\'
      )
      return JSON.parse(regexFixed)
    } catch (e2) {
      // Attempt 3: very aggressive - replace ALL lone backslashes
      try {
        // First normalize all double backslashes to a placeholder
        let aggressive = jsonStr
          .replace(/\\\\/g, '\x00DBLBACK\x00')
          .replace(/\\(?!["\\/bfnrtu])/g, '\\\\')
          .replace(/\x00DBLBACK\x00/g, '\\\\')
        return JSON.parse(aggressive)
      } catch (e3) {
        const err = e1 as Error
        throw new Error(`JSON解析失败: ${err.message}`)
      }
    }
  }
}
