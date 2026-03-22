import { useEffect, useRef } from 'react'
import type { HomeworkData, GeneratedQuestion } from '../types'
import katex from 'katex'

interface Props {
  homework: HomeworkData
}

const SECTION_CONFIG = [
  { key: 'similar' as const, label: '相似题', badge: '同考点', numPrefix: '一' },
  { key: 'variant' as const, label: '变式题', badge: '变题型', numPrefix: '二' },
  { key: 'comprehensive' as const, label: '综合应用题', badge: '生活应用', numPrefix: '三' },
]

export default function HomeworkSheet({ homework }: Props) {
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sheetRef.current) return
    // Render all KaTeX after mount
    const elements = sheetRef.current.querySelectorAll('[data-math]')
    elements.forEach((el) => {
      const tex = el.getAttribute('data-math') || ''
      const display = el.getAttribute('data-display') === 'true'
      try {
        katex.render(tex, el as HTMLElement, {
          displayMode: display,
          throwOnError: false,
          trust: true,
          strict: false,
        })
      } catch {
        (el as HTMLElement).textContent = tex
      }
    })
  }, [homework])

  const today = new Date()
  const dateStr = `${today.getFullYear()} 年 ${today.getMonth() + 1} 月 ${today.getDate()} 日`

  return (
    <div ref={sheetRef} className="homework-sheet">
      {/* 页眉 */}
      <div className="homework-header">
        <div className="title">{homework.subject}举一反三练习</div>
        <div className="subtitle">基于错题的巩固提升训练</div>
        <div className="info-row">
          <span className="info-item">
            姓名：<span className="underline-blank"></span>
          </span>
          <span className="info-item">
            班级：<span className="underline-blank"></span>
          </span>
          <span className="info-item">
            日期：{dateStr}
          </span>
        </div>
      </div>

      {/* 原题考点提示 */}
      <div style={{ fontSize: '9pt', color: '#666', marginBottom: '12px', padding: '6px 10px', background: '#f9f9f9', borderLeft: '3px solid #333' }}>
        原题考点：{homework.originalQuestion}
      </div>

      {/* 三类题目 */}
      {SECTION_CONFIG.map((section, sectionIdx) => {
        const questions = homework[section.key] as GeneratedQuestion[]
        if (!questions || questions.length === 0) return null

        return (
          <div key={section.key}>
            {sectionIdx > 0 && <hr className="section-divider" />}

            <div className="section-title">
              <span className="section-badge">{section.badge}</span>
              {section.numPrefix}、{section.label}
            </div>

            {questions.map((q, qIdx) => (
              <QuestionBlock
                key={qIdx}
                question={q}
                number={qIdx + 1}
              />
            ))}
          </div>
        )
      })}

      {/* 页脚 */}
      <div className="homework-footer">
        错题啄木鸟 - 举一反三练习 | 第 1 页
      </div>
    </div>
  )
}

function QuestionBlock({ question, number }: { question: GeneratedQuestion; number: number }) {
  const stemRef = useRef<HTMLDivElement>(null)
  const figureRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!stemRef.current) return
    stemRef.current.innerHTML = renderMathText(question.stem)
  }, [question.stem])

  // 调试：检查figure字段
  useEffect(() => {
    const fig = question.figure || ''
    const isSVG = fig.trim().startsWith('<svg')
    console.log(`[HomeworkSheet] Q${number} figure: exists=${!!question.figure}, isSVG=${isSVG}, len=${fig.length}, preview="${fig.substring(0, 100)}"`)
  }, [question.figure, number])

  // 只有真正的SVG才显示，描述文本不显示
  const hasFigure = question.figure && question.figure.trim().startsWith('<svg')

  return (
    <div className="question-block">
      <div className="question-stem">
        <span className="question-number">{number}.</span>
        <span ref={stemRef}></span>
      </div>

      {/* 选项 */}
      {question.options && question.options.length > 0 && (
        <div className="question-options">
          {question.options.map((opt, i) => (
            <OptionItem key={i} label={String.fromCharCode(65 + i)} content={opt} />
          ))}
        </div>
      )}

      {/* 图形 - 只渲染SVG，不显示描述文本 */}
      {hasFigure && (
        <div className="figure-container" style={{ border: '1px solid #eee', borderRadius: '4px', background: '#fafafa' }}>
          <div
            ref={figureRef}
            dangerouslySetInnerHTML={{ __html: question.figure! }}
            style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
          />
        </div>
      )}

      {/* 答题留白区域 */}
      <div className="answer-area" style={{ height: `${(question.answerArea || 3) * 28}px` }} />
    </div>
  )
}

function OptionItem({ label, content }: { label: string; content: string }) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!ref.current) return
    ref.current.innerHTML = renderMathText(content)
  }, [content])

  return (
    <div className="option-item">
      <span style={{ fontWeight: 'bold', marginRight: '6px' }}>{label}.</span>
      <span ref={ref}></span>
    </div>
  )
}

function renderMathText(text: string): string {
  if (!text) return ''
  let result = text

  // $$...$$ display math
  result = result.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), { displayMode: true, throwOnError: false, trust: true, strict: false })
    } catch { return math }
  })

  // $...$ inline math
  result = result.replace(/\$([^\$\n]+?)\$/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false, trust: true, strict: false })
    } catch { return math }
  })

  // \[...\]
  result = result.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), { displayMode: true, throwOnError: false, trust: true, strict: false })
    } catch { return math }
  })

  // \(...\)
  result = result.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false, trust: true, strict: false })
    } catch { return math }
  })

  result = result.replace(/\n/g, '<br/>')
  return result
}
