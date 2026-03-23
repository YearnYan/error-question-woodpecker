import {
  Document, Packer, Paragraph, TextRun, AlignmentType,
  BorderStyle, ImageRun, TabStopPosition, TabStopType,
} from 'docx'
import type { HomeworkData, GeneratedQuestion } from './generator.js'

// Lazy import sharp to avoid loading native module at startup
let sharp: any = null
async function getSharp() {
  if (!sharp) {
    sharp = (await import('sharp')).default
  }
  return sharp
}

const SECTIONS = [
  { key: 'similar' as const, badge: '同考点', prefix: '一', label: '相似题' },
  { key: 'variant' as const, badge: '变题型', prefix: '二', label: '变式题' },
  { key: 'comprehensive' as const, badge: '生活应用', prefix: '三', label: '综合应用题' },
]

export async function exportToWord(homework: HomeworkData): Promise<Buffer> {
  const d = new Date()
  const date = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`

  const children: Paragraph[] = []

  // 标题
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
    children: [new TextRun({
      text: `${homework.subject}举一反三练习`,
      bold: true, size: 32, font: 'SimSun',
    })],
  }))

  // 副标题
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [new TextRun({
      text: '基于错题的巩固提升训练',
      size: 22, font: 'SimSun', color: '333333',
    })],
  }))

  // 信息行：姓名、班级、日期
  children.push(new Paragraph({
    spacing: { after: 200 },
    tabStops: [
      { type: TabStopType.LEFT, position: TabStopPosition.MAX / 3 },
      { type: TabStopType.LEFT, position: (TabStopPosition.MAX / 3) * 2 },
    ],
    children: [
      new TextRun({ text: '姓名：__________', size: 20, font: 'SimSun' }),
      new TextRun({ text: '\t', size: 20 }),
      new TextRun({ text: '班级：__________', size: 20, font: 'SimSun' }),
      new TextRun({ text: '\t', size: 20 }),
      new TextRun({ text: `日期：${date}`, size: 20, font: 'SimSun' }),
    ],
  }))

  // 原题考点
  children.push(new Paragraph({
    spacing: { after: 180 },
    indent: { left: 200 },
    border: { left: { style: BorderStyle.SINGLE, size: 12, color: '333333' } },
    shading: { fill: 'F9F9F9' },
    children: [new TextRun({
      text: `原题考点：${homework.originalQuestion}`,
      size: 18, font: 'SimSun', color: '666666',
    })],
  }))

  // 三类题目
  for (const section of SECTIONS) {
    const questions = homework[section.key] as GeneratedQuestion[]
    if (!questions || questions.length === 0) continue

    // 题型标题
    children.push(new Paragraph({
      spacing: { before: 240, after: 160 },
      children: [
        new TextRun({
          text: `【${section.badge}】`,
          size: 18, font: 'SimSun', bold: true,
          color: 'FFFFFF', shading: { fill: '1A1A1A' },
        }),
        new TextRun({ text: ' ', size: 18 }),
        new TextRun({
          text: `${section.prefix}、${section.label}`,
          size: 24, font: 'SimSun', bold: true,
        }),
      ],
    }))

    // 题目（异步处理图片）
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      const qParas = await buildQuestionParagraphs(q, i + 1)
      children.push(...qParas)
    }
  }

  // 页脚
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 400 },
    children: [new TextRun({
      text: '错题啄木鸟 - 举一反三练习',
      size: 18, font: 'SimSun', color: '999999',
    })],
  }))

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 1440, right: 1296, bottom: 1800, left: 1296 }, // 20mm, 18mm, 25mm, 18mm
        },
      },
      children,
    }],
  })

  return await Packer.toBuffer(doc)
}

async function buildQuestionParagraphs(q: GeneratedQuestion, num: number): Promise<Paragraph[]> {
  const paras: Paragraph[] = []

  // 题干
  const stemRuns = parseLatexText(q.stem)
  paras.push(new Paragraph({
    spacing: { after: 120 },
    children: [
      new TextRun({ text: `${num}. `, bold: true, size: 22, font: 'SimSun' }),
      ...stemRuns,
    ],
  }))

  // 选项
  if (q.options && q.options.length > 0) {
    for (let i = 0; i < q.options.length; i++) {
      const optRuns = parseLatexText(q.options[i])
      paras.push(new Paragraph({
        indent: { left: 576 }, // 2em
        spacing: { after: 40 },
        children: [
          new TextRun({ text: `${String.fromCharCode(65 + i)}. `, bold: true, size: 22, font: 'SimSun' }),
          ...optRuns,
        ],
      }))
    }
  }

  // 图形嵌入（SVG → PNG → Word）
  if (q.figure && q.figure.trim().startsWith('<svg')) {
    try {
      const svgStr = q.figure.trim()
      console.log('[WordExport] Processing SVG, length:', svgStr.length, 'preview:', svgStr.substring(0, 200))

      // 用 sharp 获取实际图片尺寸并转换为 PNG
      const Sharp = await getSharp()
      const sharpInstance = Sharp(Buffer.from(svgStr, 'utf-8'), { density: 150 })
      const metadata = await sharpInstance.metadata()
      console.log('[WordExport] Sharp metadata:', JSON.stringify({ w: metadata.width, h: metadata.height, format: metadata.format }))

      const pngBuffer = await Sharp(Buffer.from(svgStr, 'utf-8'), { density: 150 })
        .png()
        .toBuffer()
      console.log('[WordExport] PNG buffer size:', pngBuffer.length, 'bytes')

      // 使用 sharp 返回的实际像素尺寸
      const pngW = metadata.width || 400
      const pngH = metadata.height || 300

      // 限制最大宽度为 450pt，等比缩放
      const maxW = 450
      const scale = pngW > maxW ? maxW / pngW : 1
      const displayW = Math.round(pngW * scale)
      const displayH = Math.round(pngH * scale)
      console.log('[WordExport] Display size:', displayW, 'x', displayH)

      paras.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 120, after: 120 },
        children: [
          new ImageRun({
            data: pngBuffer,
            transformation: { width: displayW, height: displayH },
          } as any),
        ],
      }))
    } catch (err) {
      console.error('[WordExport] Failed to embed figure:', err)
      paras.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 120, after: 120 },
        children: [
          new TextRun({
            text: '[图形转换失败: ' + (err as Error).message + ']',
            size: 20, font: 'SimSun', color: '999999', italics: true,
          }),
        ],
      }))
    }
  }

  // 答题留白区域
  const answerLines = q.answerArea || 3
  for (let i = 0; i < answerLines; i++) {
    paras.push(new Paragraph({
      spacing: { after: 200 },
      children: [new TextRun({ text: '', size: 22 })],
    }))
  }

  return paras
}

/**
 * 解析包含 LaTeX 的文本，返回 TextRun 数组
 * 将 LaTeX 公式转换为 Unicode 近似表示
 */
function parseLatexText(text: string): TextRun[] {
  if (!text) return [new TextRun({ text: '', size: 22, font: 'SimSun' })]

  const runs: TextRun[] = []
  let lastIndex = 0

  // 匹配所有 LaTeX 公式：$$...$$, $...$, \[...\], \(...\)
  const regex = /\$\$([\s\S]*?)\$\$|\$([^\$\n]+?)\$|\\\[([\s\S]*?)\\\]|\\\(([\s\S]*?)\\\)/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    // 添加公式前的普通文本
    if (match.index > lastIndex) {
      const plainText = text.substring(lastIndex, match.index)
      runs.push(new TextRun({ text: plainText, size: 22, font: 'SimSun' }))
    }

    // 转换 LaTeX 公式
    const latex = match[1] || match[2] || match[3] || match[4] || ''
    const unicode = latexToUnicode(latex.trim())
    runs.push(new TextRun({ text: unicode, size: 22, font: 'Cambria Math' }))

    lastIndex = regex.lastIndex
  }

  // 添加剩余的普通文本
  if (lastIndex < text.length) {
    runs.push(new TextRun({ text: text.substring(lastIndex), size: 22, font: 'SimSun' }))
  }

  return runs.length > 0 ? runs : [new TextRun({ text, size: 22, font: 'SimSun' })]
}

/**
 * 将 LaTeX 转换为 Unicode 近似表示
 * 改进版本，支持更多符号和更好的格式
 */
function latexToUnicode(tex: string): string {
  let t = tex

  // 希腊字母（大写）
  const greekUpper: Record<string, string> = {
    '\\Alpha': 'Α', '\\Beta': 'Β', '\\Gamma': 'Γ', '\\Delta': 'Δ',
    '\\Epsilon': 'Ε', '\\Zeta': 'Ζ', '\\Eta': 'Η', '\\Theta': 'Θ',
    '\\Iota': 'Ι', '\\Kappa': 'Κ', '\\Lambda': 'Λ', '\\Mu': 'Μ',
    '\\Nu': 'Ν', '\\Xi': 'Ξ', '\\Omicron': 'Ο', '\\Pi': 'Π',
    '\\Rho': 'Ρ', '\\Sigma': 'Σ', '\\Tau': 'Τ', '\\Upsilon': 'Υ',
    '\\Phi': 'Φ', '\\Chi': 'Χ', '\\Psi': 'Ψ', '\\Omega': 'Ω',
  }

  // 希腊字母（小写）
  const greekLower: Record<string, string> = {
    '\\alpha': 'α', '\\beta': 'β', '\\gamma': 'γ', '\\delta': 'δ',
    '\\epsilon': 'ε', '\\varepsilon': 'ε', '\\zeta': 'ζ', '\\eta': 'η',
    '\\theta': 'θ', '\\vartheta': 'ϑ', '\\iota': 'ι', '\\kappa': 'κ',
    '\\lambda': 'λ', '\\mu': 'μ', '\\nu': 'ν', '\\xi': 'ξ',
    '\\omicron': 'ο', '\\pi': 'π', '\\varpi': 'ϖ', '\\rho': 'ρ',
    '\\varrho': 'ϱ', '\\sigma': 'σ', '\\varsigma': 'ς', '\\tau': 'τ',
    '\\upsilon': 'υ', '\\phi': 'φ', '\\varphi': 'φ', '\\chi': 'χ',
    '\\psi': 'ψ', '\\omega': 'ω',
  }

  // 按长度排序，避免短的先匹配导致长的无法匹配
  for (const [k, v] of Object.entries({ ...greekUpper, ...greekLower }).sort((a, b) => b[0].length - a[0].length)) {
    t = t.split(k).join(v)
  }

  // 运算符号
  const operators: Record<string, string> = {
    '\\times': '×', '\\div': '÷', '\\pm': '±', '\\mp': '∓',
    '\\leq': '≤', '\\le': '≤', '\\geq': '≥', '\\ge': '≥',
    '\\neq': '≠', '\\ne': '≠', '\\approx': '≈', '\\equiv': '≡',
    '\\infty': '∞', '\\cdot': '·', '\\circ': '°', '\\bullet': '•',
    '\\angle': '∠', '\\triangle': '△', '\\perp': '⊥', '\\parallel': '∥',
    '\\rightarrow': '→', '\\to': '→', '\\leftarrow': '←',
    '\\Rightarrow': '⇒', '\\Leftarrow': '⇐', '\\Leftrightarrow': '⇔',
    '\\therefore': '∴', '\\because': '∵',
    '\\in': '∈', '\\notin': '∉', '\\subset': '⊂', '\\supset': '⊃',
    '\\subseteq': '⊆', '\\supseteq': '⊇',
    '\\cup': '∪', '\\cap': '∩', '\\emptyset': '∅',
    '\\forall': '∀', '\\exists': '∃', '\\neg': '¬',
    '\\sum': '∑', '\\prod': '∏', '\\int': '∫',
  }

  for (const [k, v] of Object.entries(operators)) {
    t = t.split(k).join(v)
  }

  // 空格命令
  t = t.replace(/\\quad/g, '  ')
  t = t.replace(/\\qquad/g, '    ')
  t = t.replace(/\\,/g, ' ')
  t = t.replace(/\\;/g, ' ')
  t = t.replace(/\\!/g, '')
  t = t.replace(/\\:/g, ' ')

  // 分数：\frac{a}{b} → (a/b)
  t = t.replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '($1/$2)')

  // 根号：\sqrt[n]{x} → ⁿ√x, \sqrt{x} → √x
  t = t.replace(/\\sqrt\[([^\]]*)\]\{([^}]*)\}/g, (_, n, x) => {
    const superN = toSuperscript(n)
    return `${superN}√${x}`
  })
  t = t.replace(/\\sqrt\{([^}]*)\}/g, '√$1')

  // 上标：^{...} 或 ^x
  t = t.replace(/\^{([^}]*)}/g, (_, x) => toSuperscript(x))
  t = t.replace(/\^([0-9a-zA-Z])/g, (_, c) => toSuperscript(c))

  // 下标：_{...} 或 _x
  t = t.replace(/_{([^}]*)}/g, (_, x) => toSubscript(x))
  t = t.replace(/_([0-9a-zA-Z])/g, (_, c) => toSubscript(c))

  // 函数名
  t = t.replace(/\\(sin|cos|tan|cot|sec|csc|arcsin|arccos|arctan|sinh|cosh|tanh|log|ln|lg|exp|lim|max|min|sup|inf)\b/g, '$1')

  // 文本命令
  t = t.replace(/\\(?:text|mathrm|mathbf|mathit|mathsf|mathtt)\{([^}]*)\}/g, '$1')

  // 上划线、向量
  t = t.replace(/\\overline\{([^}]*)\}/g, '$1̄')
  t = t.replace(/\\vec\{([^}]*)\}/g, '$1⃗')
  t = t.replace(/\\hat\{([^}]*)\}/g, '$1̂')
  t = t.replace(/\\tilde\{([^}]*)\}/g, '$1̃')

  // 括号命令
  t = t.replace(/\\left/g, '')
  t = t.replace(/\\right/g, '')
  t = t.replace(/\\big/g, '')
  t = t.replace(/\\Big/g, '')
  t = t.replace(/\\bigg/g, '')
  t = t.replace(/\\Bigg/g, '')

  // 其他命令
  t = t.replace(/\\displaystyle/g, '')
  t = t.replace(/\\limits/g, '')

  // 清理多余的花括号和空格
  t = t.replace(/[{}]/g, '')
  t = t.replace(/\s+/g, ' ')
  t = t.trim()

  return t
}

/** 转换为上标 Unicode */
function toSuperscript(s: string): string {
  const map: Record<string, string> = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    'a': 'ᵃ', 'b': 'ᵇ', 'c': 'ᶜ', 'd': 'ᵈ', 'e': 'ᵉ',
    'f': 'ᶠ', 'g': 'ᵍ', 'h': 'ʰ', 'i': 'ⁱ', 'j': 'ʲ',
    'k': 'ᵏ', 'l': 'ˡ', 'm': 'ᵐ', 'n': 'ⁿ', 'o': 'ᵒ',
    'p': 'ᵖ', 'r': 'ʳ', 's': 'ˢ', 't': 'ᵗ', 'u': 'ᵘ',
    'v': 'ᵛ', 'w': 'ʷ', 'x': 'ˣ', 'y': 'ʸ', 'z': 'ᶻ',
    '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
  }
  return [...s].map(c => map[c] || c).join('')
}

/** 转换为下标 Unicode */
function toSubscript(s: string): string {
  const map: Record<string, string> = {
    '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
    '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
    'a': 'ₐ', 'e': 'ₑ', 'h': 'ₕ', 'i': 'ᵢ', 'j': 'ⱼ',
    'k': 'ₖ', 'l': 'ₗ', 'm': 'ₘ', 'n': 'ₙ', 'o': 'ₒ',
    'p': 'ₚ', 'r': 'ᵣ', 's': 'ₛ', 't': 'ₜ', 'u': 'ᵤ',
    'v': 'ᵥ', 'x': 'ₓ',
    '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎',
  }
  return [...s].map(c => map[c] || c).join('')
}

