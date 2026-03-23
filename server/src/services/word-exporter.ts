import type { HomeworkData, GeneratedQuestion } from './generator.js'

const SECTIONS = [
  { key: 'similar' as const, badge: '同考点', prefix: '一', label: '相似题' },
  { key: 'variant' as const, badge: '变题型', prefix: '二', label: '变式题' },
  { key: 'comprehensive' as const, badge: '生活应用', prefix: '三', label: '综合应用题' },
]

export async function exportToWord(homework: HomeworkData): Promise<Buffer> {
  const html = buildWordHTML(homework)
  return Buffer.from(html, 'utf-8')
}

function buildWordHTML(hw: HomeworkData): string {
  const d = new Date()
  const date = `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`

  const body = SECTIONS.map(s => {
    const qs = hw[s.key] as GeneratedQuestion[]
    if (!qs || qs.length === 0) return ''
    const qhtml = qs.map((q, i) => questionHTML(q, i + 1)).join('')
    return '<div style="margin-top:18px;">' +
      '<div style="font-size:12pt;font-weight:bold;margin-bottom:10px;">' +
      `<span style="background:#1a1a1a;color:#fff;font-size:9pt;padding:1px 8px;margin-right:8px;font-weight:normal;">${s.badge}</span>` +
      `${s.prefix}、${s.label}</div>${qhtml}</div>`
  }).filter(Boolean).join('')

  // 关键：整个HTML必须紧凑无多余空白，Word会把源码空白当文字渲染
  return '<!DOCTYPE html>' +
    '<html><head><meta charset="UTF-8">' +
    `<title>${hw.subject}举一反三练习</title>` +
    '<style>' +
    "body{font-family:'SimSun','STSong',serif;font-size:11pt;line-height:1.8;color:#000;}" +
    '.sheet{width:210mm;padding:20mm 18mm 25mm 18mm;margin:0 auto;}' +
    '</style></head><body><div class="sheet">' +
    // 页眉
    '<div style="text-align:center;border-bottom:2px solid #000;padding-bottom:10px;margin-bottom:15px;">' +
    `<div style="font-size:16pt;font-weight:bold;letter-spacing:4px;margin-bottom:4px;">${hw.subject}举一反三练习</div>` +
    '<div style="font-size:11pt;color:#333;">基于错题的巩固提升训练</div>' +
    '<div style="font-size:10pt;margin-top:8px;color:#444;">' +
    `姓名：________ &nbsp;&nbsp;&nbsp; 班级：________ &nbsp;&nbsp;&nbsp; 日期：${date}` +
    '</div></div>' +
    // 考点
    `<div style="font-size:9pt;color:#666;margin-bottom:12px;padding:6px 10px;background:#f9f9f9;border-left:3px solid #333;">原题考点：${esc(hw.originalQuestion)}</div>` +
    // 题目
    body +
    // 页脚
    '<div style="text-align:center;font-size:9pt;color:#999;margin-top:30px;">错题啄木鸟 - 举一反三练习</div>' +
    '</div></body></html>'
}

function questionHTML(q: GeneratedQuestion, num: number): string {
  let fig = ''
  if (q.figure && q.figure.trim().startsWith('<svg')) {
    const b64 = Buffer.from(q.figure).toString('base64')
    fig = `<div style="text-align:center;margin:10px 0;"><img src="data:image/svg+xml;base64,${b64}" style="max-width:100%;max-height:200px;" /></div>`
  }

  let opts = ''
  if (q.options && q.options.length > 0) {
    opts = '<div style="padding-left:2em;margin-bottom:6px;">' +
      q.options.map((o, i) =>
        `<div style="margin-bottom:2px;"><b>${String.fromCharCode(65+i)}.</b> ${mathToText(o)}</div>`
      ).join('') + '</div>'
  }

  return '<div style="margin-bottom:16px;">' +
    `<div style="margin-bottom:6px;"><b>${num}.</b> ${mathToText(q.stem)}</div>` +
    opts + fig +
    `<div style="height:${(q.answerArea||3)*28}px;"></div></div>`
}

/** 把含LaTeX的文本转成Word可读的纯文本 */
function mathToText(text: string): string {
  if (!text) return ''
  let r = text
  r = r.replace(/\$\$([\s\S]*?)\$\$/g, (_, m) => tex2uni(m.trim()))
  r = r.replace(/\$([^\$\n]+?)\$/g, (_, m) => tex2uni(m.trim()))
  r = r.replace(/\\\[([\s\S]*?)\\\]/g, (_, m) => tex2uni(m.trim()))
  r = r.replace(/\\\(([\s\S]*?)\\\)/g, (_, m) => tex2uni(m.trim()))
  return esc(r)
}

/** LaTeX → Unicode纯文本 */
function tex2uni(t: string): string {
  // 希腊字母
  const g: Record<string,string> = {
    '\\Alpha':'Α','\\Beta':'Β','\\Gamma':'Γ','\\Delta':'Δ','\\Theta':'Θ',
    '\\Lambda':'Λ','\\Xi':'Ξ','\\Pi':'Π','\\Sigma':'Σ','\\Phi':'Φ',
    '\\Psi':'Ψ','\\Omega':'Ω',
    '\\alpha':'α','\\beta':'β','\\gamma':'γ','\\delta':'δ',
    '\\epsilon':'ε','\\varepsilon':'ε','\\zeta':'ζ','\\eta':'η',
    '\\theta':'θ','\\iota':'ι','\\kappa':'κ','\\lambda':'λ',
    '\\mu':'μ','\\nu':'ν','\\xi':'ξ','\\pi':'π','\\rho':'ρ',
    '\\sigma':'σ','\\tau':'τ','\\phi':'φ','\\varphi':'φ',
    '\\chi':'χ','\\psi':'ψ','\\omega':'ω',
  }
  for (const [k,v] of Object.entries(g).sort((a,b)=>b[0].length-a[0].length))
    t = t.split(k).join(v)

  // 运算符号
  const s: Record<string,string> = {
    '\\times':'×','\\div':'÷','\\pm':'±','\\mp':'∓',
    '\\leq':'≤','\\geq':'≥','\\neq':'≠','\\approx':'≈',
    '\\infty':'∞','\\cdot':'·','\\circ':'°',
    '\\angle':'∠','\\triangle':'△','\\perp':'⊥','\\parallel':'∥',
    '\\rightarrow':'→','\\leftarrow':'←','\\Rightarrow':'⇒',
    '\\therefore':'∴','\\because':'∵',
    '\\in':'∈','\\notin':'∉','\\subset':'⊂','\\cup':'∪','\\cap':'∩',
    '\\emptyset':'∅','\\forall':'∀','\\exists':'∃',
    '\\quad':' ','\\qquad':'  ','\\,':' ','\\;':' ','\\!':'',
    '\\left':'','\\right':'','\\displaystyle':'',
  }
  for (const [k,v] of Object.entries(s)) t = t.split(k).join(v)

  // 分数、根号
  t = t.replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '($1/$2)')
  t = t.replace(/\\sqrt\[([^\]]*)\]\{([^}]*)\}/g, '$1√$2')
  t = t.replace(/\\sqrt\{([^}]*)\}/g, '√$1')

  // 上标
  const sup: Record<string,string> = {'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','n':'ⁿ','+':'⁺','-':'⁻'}
  t = t.replace(/\^{([^}]*)}/g, (_,x) => [...x].map((c:string)=>sup[c]||c).join(''))
  t = t.replace(/\^([0-9n])/g, (_,c) => sup[c]||c)

  // 下标
  const sub: Record<string,string> = {'0':'₀','1':'₁','2':'₂','3':'₃','4':'₄','5':'₅','6':'₆','7':'₇','8':'₈','9':'₉','n':'ₙ','i':'ᵢ'}
  t = t.replace(/_{([^}]*)}/g, (_,x) => [...x].map((c:string)=>sub[c]||c).join(''))
  t = t.replace(/_([0-9n])/g, (_,c) => sub[c]||c)

  // 函数名、文本命令
  t = t.replace(/\\(sin|cos|tan|log|ln|lim|max|min|sum|prod|int)\b/g, '$1')
  t = t.replace(/\\(?:text|mathrm|mathbf)\{([^}]*)\}/g, '$1')
  t = t.replace(/\\overline\{([^}]*)\}/g, '$1̄')
  t = t.replace(/\\vec\{([^}]*)\}/g, '$1⃗')
  t = t.replace(/[{}]/g, '')
  t = t.replace(/\s+/g, ' ').trim()
  return t
}

function esc(t: string): string {
  return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}
