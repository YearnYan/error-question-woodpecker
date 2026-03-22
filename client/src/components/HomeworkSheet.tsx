import { useEffect, useRef } from 'react'
import type { HomeworkData, GeneratedQuestion } from '../types'
import katex from 'katex'

interface Props {
  homework: HomeworkData
  showAnswers?: boolean
}

const SECTION_CONFIG = [
  { key: 'similar' as const, label: '相似题', badge: '同考点', numPrefix: '一' },
  { key: 'variant' as const, label: '变式题', badge: '变题型', numPrefix: '二' },
  { key: 'comprehensive' as const, label: '综合应用题', badge: '生活应用', numPrefix: '三' },
]

export default function HomeworkSheet({ homework, showAnswers = false }: Props) {
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

      {/* 答案和解析 */}
      {showAnswers && (
        <div style={{ marginTop: '30px', pageBreakBefore: 'always' }}>
          <div style={{ borderTop: '2px solid #000', paddingTop: '12px', marginBottom: '15px' }}>
            <div style={{ fontSize: '14pt', fontWeight: 'bold', textAlign: 'center', letterSpacing: '4px', marginBottom: '4px' }}>
              参考答案与解析
            </div>
          </div>

          {SECTION_CONFIG.map((section) => {
            const questions = homework[section.key] as GeneratedQuestion[]
            if (!questions || questions.length === 0) return null
            const hasAnyAnswer = questions.some(q => q.answer || q.solution)
            if (!hasAnyAnswer) return null

            return (
              <div key={`ans-${section.key}`} style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11pt', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
                  {section.numPrefix}、{section.label}
                </div>
                {questions.map((q, qIdx) => (
                  <AnswerBlock key={qIdx} question={q} number={qIdx + 1} />
                ))}
              </div>
            )
          })}
        </div>
      )}

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
  const figureLoading = question.figure && question.figure.trim().length > 0 && !question.figure.trim().startsWith('<svg')

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

      {/* 图形加载提示 */}
      {figureLoading && (
        <div className="figure-container" style={{ border: '1px dashed #d1d5db', borderRadius: '4px', background: '#f9fafb', padding: '16px', textAlign: 'center' }}>
          <div style={{ color: '#9ca3af', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <span className="figure-spinner" />
            题目图形生成中，请稍等…
          </div>
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

function AnswerBlock({ question, number }: { question: GeneratedQuestion; number: number }) {
  const answerRef = useRef<HTMLSpanElement>(null)
  const solutionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (answerRef.current && question.answer) {
      answerRef.current.innerHTML = renderMathText(question.answer)
    }
  }, [question.answer])

  useEffect(() => {
    if (solutionRef.current && question.solution) {
      solutionRef.current.innerHTML = renderMathText(question.solution)
    }
  }, [question.solution])

  if (!question.answer && !question.solution) return null

  return (
    <div style={{ marginBottom: '10px', padding: '6px 10px', background: '#f9f9f9', borderRadius: '4px', fontSize: '10pt' }}>
      <div style={{ marginBottom: '2px' }}>
        <span style={{ fontWeight: 'bold', color: '#333' }}>{number}. </span>
        {question.answer && (
          <>
            <span style={{ color: '#666' }}>答案：</span>
            <span ref={answerRef} style={{ color: '#c00', fontWeight: 'bold' }}></span>
          </>
        )}
      </div>
      {question.solution && (
        <div style={{ color: '#555', lineHeight: '1.6' }}>
          <span style={{ color: '#666' }}>解析：</span>
          <span ref={solutionRef}></span>
        </div>
      )}
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

  // Convert literal \n (two chars) and real newlines to <br/>
  result = result.replace(/\\n/g, '<br/>')
  result = result.replace(/\n/g, '<br/>')
  return result
}
