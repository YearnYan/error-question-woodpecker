import katex from 'katex'
import type { HomeworkData, GeneratedQuestion } from './generator.js'

const SECTION_CONFIG = [
  { key: 'similar' as const, label: '相似题', badge: '同考点', numPrefix: '一' },
  { key: 'variant' as const, label: '变式题', badge: '变题型', numPrefix: '二' },
  { key: 'comprehensive' as const, label: '综合应用题', badge: '生活应用', numPrefix: '三' },
]

/**
 * Render homework to HTML
 * @param forWord - if true, pre-render math server-side for Word compatibility
 */
export function renderHomeworkHTML(homework: HomeworkData, forWord = false): string {
  const today = new Date()
  const dateStr = `${today.getFullYear()} 年 ${today.getMonth() + 1} 月 ${today.getDate()} 日`

  const mathRenderer = forWord ? renderMathTextForWord : renderMathTextForBrowser

  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${homework.subject}举一反三练习</title>
${forWord ? '' : '  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">'}
  <style>
${getHomeworkCSS()}
  </style>
</head>
<body>
  <div class="homework-sheet">
    <div class="homework-header">
      <div class="title">${homework.subject}举一反三练习</div>
      <div class="subtitle">基于错题的巩固提升训练</div>
      <div class="info-row">
        <span class="info-item">姓名：<span class="underline-blank"></span></span>
        <span class="info-item">班级：<span class="underline-blank"></span></span>
        <span class="info-item">日期：${dateStr}</span>
      </div>
    </div>

    <div style="font-size: 9pt; color: #666; margin-bottom: 12px; padding: 6px 10px; background: #f9f9f9; border-left: 3px solid #333;">
      原题考点：${escapeHtml(homework.originalQuestion)}
    </div>

${SECTION_CONFIG.map((section, sectionIdx) => {
  const questions = homework[section.key] as GeneratedQuestion[]
  if (!questions || questions.length === 0) return ''
  return `
    ${sectionIdx > 0 ? '<hr class="section-divider" />' : ''}
    <div class="section-title">
      <span class="section-badge">${section.badge}</span>
      ${section.numPrefix}、${section.label}
    </div>
${questions.map((q, qIdx) => renderQuestion(q, qIdx + 1, forWord, mathRenderer)).join('\n')}
  `
}).join('')}

    <div class="homework-footer">
      错题啄木鸟 - 举一反三练习 | 第 1 页
    </div>
  </div>
${forWord ? '' : `
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      document.querySelectorAll('[data-math]').forEach(function(el) {
        var tex = el.getAttribute('data-math') || ''
        var display = el.getAttribute('data-display') === 'true'
        try {
          katex.render(tex, el, { displayMode: display, throwOnError: false, trust: true, strict: false })
        } catch (e) { el.textContent = tex }
      })
    })
  </script>
`}
</body>
</html>
  `.trim()
}

function renderQuestion(question: GeneratedQuestion, number: number, forWord: boolean, mathRenderer: (t: string) => string): string {
  const hasFigure = question.figure && question.figure.trim().startsWith('<svg')

  let figureHtml = ''
  if (hasFigure) {
    if (forWord) {
      const svgBase64 = Buffer.from(question.figure!).toString('base64')
      figureHtml = `<img src="data:image/svg+xml;base64,${svgBase64}" style="max-width: 100%; max-height: 200px;" />`
    } else {
      figureHtml = question.figure!
    }
  }

  return `
    <div class="question-block">
      <div class="question-stem">
        <span class="question-number">${number}.</span>
        <span>${mathRenderer(question.stem)}</span>
      </div>
      ${question.options && question.options.length > 0 ? `
      <div class="question-options">
        ${question.options.map((opt, i) => `
        <div class="option-item">
          <span style="font-weight: bold; margin-right: 6px;">${String.fromCharCode(65 + i)}.</span>
          <span>${mathRenderer(opt)}</span>
        </div>
        `).join('')}
      </div>
      ` : ''}
      ${hasFigure ? `
      <div class="figure-container" style="border: 1px solid #eee; border-radius: 4px; background: #fafafa;">
        <div style="width: 100%; display: flex; justify-content: center;">
          ${figureHtml}
        </div>
      </div>
      ` : ''}
      <div class="answer-area" style="height: ${(question.answerArea || 3) * 28}px;"></div>
    </div>
  `
}

/** Browser version: uses data-math attributes for client-side KaTeX rendering */
function renderMathTextForBrowser(text: string): string {
  if (!text) return ''
  let result = text
  const mathBlocks: string[] = []

  result = result.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
    mathBlocks.push(`<span data-math="${escapeHtml(math.trim())}" data-display="true"></span>`)
    return `\x00MATH${mathBlocks.length - 1}\x00`
  })
  result = result.replace(/\$([^\$\n]+?)\$/g, (_, math) => {
    mathBlocks.push(`<span data-math="${escapeHtml(math.trim())}" data-display="false"></span>`)
    return `\x00MATH${mathBlocks.length - 1}\x00`
  })
  result = result.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => {
    mathBlocks.push(`<span data-math="${escapeHtml(math.trim())}" data-display="true"></span>`)
    return `\x00MATH${mathBlocks.length - 1}\x00`
  })
  result = result.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => {
    mathBlocks.push(`<span data-math="${escapeHtml(math.trim())}" data-display="false"></span>`)
    return `\x00MATH${mathBlocks.length - 1}\x00`
  })

  result = escapeHtml(result)
  result = result.replace(/\x00MATH(\d+)\x00/g, (_, idx) => mathBlocks[parseInt(idx)])
  result = result.replace(/\n/g, '<br/>')
  return result
}

/** Word version: converts LaTeX to Unicode plain text (Word can't run JS) */
function renderMathTextForWord(text: string): string {
  if (!text) return ''
  let result = text

  // Extract and convert math blocks
  result = result.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => latexToText(math.trim()))
  result = result.replace(/\$([^\$\n]+?)\$/g, (_, math) => latexToText(math.trim()))
  result = result.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => latexToText(math.trim()))
  result = result.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => latexToText(math.trim()))

  result = escapeHtml(result)
  result = result.replace(/\n/g, '<br/>')
  return result
}

/** Convert LaTeX to readable Unicode text for Word export */
function latexToText(tex: string): string {
  let t = tex
  // Greek letters (uppercase first to avoid partial matches)
  const greekMap: Record<string, string> = {
    '\\Alpha': 'Α', '\\Beta': 'Β', '\\Gamma': 'Γ', '\\Delta': 'Δ',
    '\\Epsilon': 'Ε', '\\Zeta': 'Ζ', '\\Eta': 'Η', '\\Theta': 'Θ',
    '\\Iota': 'Ι', '\\Kappa': 'Κ', '\\Lambda': 'Λ', '\\Mu': 'Μ',
    '\\Nu': 'Ν', '\\Xi': 'Ξ', '\\Pi': 'Π', '\\Rho': 'Ρ',
    '\\Sigma': 'Σ', '\\Tau': 'Τ', '\\Upsilon': 'Υ', '\\Phi': 'Φ',
    '\\Chi': 'Χ', '\\Psi': 'Ψ', '\\Omega': 'Ω',
    '\\alpha': 'α', '\\beta': 'β', '\\gamma': 'γ', '\\delta': 'δ',
    '\\epsilon': 'ε', '\\varepsilon': 'ε', '\\zeta': 'ζ', '\\eta': 'η',
    '\\theta': 'θ', '\\vartheta': 'ϑ', '\\iota': 'ι', '\\kappa': 'κ',
    '\\lambda': 'λ', '\\mu': 'μ', '\\nu': 'ν', '\\xi': 'ξ',
    '\\pi': 'π', '\\rho': 'ρ', '\\sigma': 'σ', '\\tau': 'τ',
    '\\upsilon': 'υ', '\\phi': 'φ', '\\varphi': 'φ', '\\chi': 'χ',
    '\\psi': 'ψ', '\\omega': 'ω',
  }
  // Sort by length descending to match longer keys first
  for (const [cmd, ch] of Object.entries(greekMap).sort((a, b) => b[0].length - a[0].length)) {
    t = t.split(cmd).join(ch)
  }

  // Operators and symbols
  const symbolMap: Record<string, string> = {
    '\\times': '×', '\\div': '÷', '\\pm': '±', '\\mp': '∓',
    '\\leq': '≤', '\\geq': '≥', '\\neq': '≠', '\\approx': '≈',
    '\\infty': '∞', '\\cdot': '·', '\\circ': '°',
    '\\angle': '∠', '\\triangle': '△', '\\perp': '⊥', '\\parallel': '∥',
    '\\rightarrow': '→', '\\leftarrow': '←', '\\Rightarrow': '⇒',
    '\\therefore': '∴', '\\because': '∵',
    '\\in': '∈', '\\notin': '∉', '\\subset': '⊂', '\\supset': '⊃',
    '\\cup': '∪', '\\cap': '∩', '\\emptyset': '∅',
    '\\forall': '∀', '\\exists': '∃',
    '\\quad': ' ', '\\qquad': '  ', '\\,': ' ', '\\;': ' ', '\\!': '',
    '\\left': '', '\\right': '', '\\displaystyle': '',
  }
  for (const [cmd, ch] of Object.entries(symbolMap)) {
    t = t.split(cmd).join(ch)
  }

  // Fractions: \frac{a}{b} → a/b
  t = t.replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '($1/$2)')
  // Square root: \sqrt{x} → √x, \sqrt[n]{x} → ⁿ√x
  t = t.replace(/\\sqrt\[([^\]]*)\]\{([^}]*)\}/g, '$1√$2')
  t = t.replace(/\\sqrt\{([^}]*)\}/g, '√$1')

  // Superscripts
  const supMap: Record<string, string> = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    'n': 'ⁿ', '+': '⁺', '-': '⁻', '(': '⁽', ')': '⁾',
  }
  t = t.replace(/\^{([^}]*)}/g, (_, s) => [...s].map((c: string) => supMap[c] || c).join(''))
  t = t.replace(/\^([0-9n])/g, (_, c) => supMap[c] || c)

  // Subscripts
  const subMap: Record<string, string> = {
    '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
    '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
    'n': 'ₙ', 'i': 'ᵢ', '+': '₊', '-': '₋', '(': '₍', ')': '₎',
  }
  t = t.replace(/_{([^}]*)}/g, (_, s) => [...s].map((c: string) => subMap[c] || c).join(''))
  t = t.replace(/_([0-9n])/g, (_, c) => subMap[c] || c)

  // Trig and log functions
  t = t.replace(/\\(sin|cos|tan|log|ln|lim|max|min|sum|prod|int)\b/g, '$1')
  // \text{...} and \mathrm{...}
  t = t.replace(/\\(?:text|mathrm|mathbf)\{([^}]*)\}/g, '$1')
  // \overline{x} → x̄
  t = t.replace(/\\overline\{([^}]*)\}/g, '$1̄')
  // \vec{x} → x⃗
  t = t.replace(/\\vec\{([^}]*)\}/g, '$1⃗')
  // Remove remaining braces
  t = t.replace(/[{}]/g, '')
  // Clean up extra spaces
  t = t.replace(/\s+/g, ' ').trim()
  return t
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function getHomeworkCSS(): string {
  return `
.homework-sheet {
  background: white;
  width: 210mm;
  min-height: 297mm;
  padding: 20mm 18mm 25mm 18mm;
  margin: 0 auto;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  font-family: 'SimSun', 'STSong', 'Songti SC', 'Noto Serif CJK SC', serif;
  font-size: 11pt;
  line-height: 1.8;
  color: #000;
  position: relative;
}
.homework-header {
  text-align: center;
  border-bottom: 2px solid #000;
  padding-bottom: 10px;
  margin-bottom: 15px;
}
.homework-header .title {
  font-size: 16pt;
  font-weight: bold;
  letter-spacing: 4px;
  margin-bottom: 4px;
}
.homework-header .subtitle {
  font-size: 11pt;
  color: #333;
}
.homework-header .info-row {
  display: flex;
  justify-content: space-between;
  font-size: 10pt;
  margin-top: 8px;
  color: #444;
}
.homework-header .info-row .info-item {
  display: flex;
  align-items: center;
  gap: 4px;
}
.homework-header .info-row .underline-blank {
  display: inline-block;
  width: 80px;
  border-bottom: 1px solid #000;
}
.section-title {
  font-size: 12pt;
  font-weight: bold;
  margin: 18px 0 10px 0;
  padding-left: 0;
  position: relative;
}
.section-badge {
  display: inline-block;
  background: #1a1a1a;
  color: #fff;
  font-size: 9pt;
  padding: 1px 8px;
  border-radius: 2px;
  margin-right: 8px;
  font-weight: normal;
  vertical-align: middle;
}
.question-block {
  margin-bottom: 16px;
  padding: 0;
}
.question-number {
  font-weight: bold;
  margin-right: 6px;
}
.question-stem {
  text-align: justify;
  text-indent: 0;
  margin-bottom: 6px;
}
.question-options {
  padding-left: 2em;
  margin-bottom: 6px;
}
.question-options .option-item {
  margin-bottom: 2px;
}
.answer-area {
  margin-top: 8px;
  padding-top: 4px;
}
.figure-container {
  display: flex;
  justify-content: center;
  margin: 10px 0;
  padding: 8px;
}
.figure-container img,
.figure-container svg {
  max-width: 100%;
  max-height: 200px;
}
.homework-footer {
  position: absolute;
  bottom: 15mm;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 9pt;
  color: #999;
}
.section-divider {
  border: none;
  border-top: 1px dashed #ccc;
  margin: 15px 0;
}
@media print {
  .homework-sheet {
    box-shadow: none;
    margin: 0;
    padding: 15mm 15mm 20mm 15mm;
  }
  @page {
    size: A4;
    margin: 0;
  }
}
  `.trim()
}