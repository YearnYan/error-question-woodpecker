import type { HomeworkData, GeneratedQuestion } from './generator.js'

const SECTION_CONFIG = [
  { key: 'similar' as const, label: '相似题', badge: '同考点', numPrefix: '一' },
  { key: 'variant' as const, label: '变式题', badge: '变题型', numPrefix: '二' },
  { key: 'comprehensive' as const, label: '综合应用题', badge: '生活应用', numPrefix: '三' },
]

/**
 * Render homework to HTML (matches HomeworkSheet.tsx exactly)
 */
export function renderHomeworkHTML(homework: HomeworkData): string {
  const today = new Date()
  const dateStr = `${today.getFullYear()} 年 ${today.getMonth() + 1} 月 ${today.getDate()} 日`

  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${homework.subject}举一反三练习</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
  <style>
${getHomeworkCSS()}
  </style>
</head>
<body>
  <div class="homework-sheet">
    <!-- 页眉 -->
    <div class="homework-header">
      <div class="title">${homework.subject}举一反三练习</div>
      <div class="subtitle">基于错题的巩固提升训练</div>
      <div class="info-row">
        <span class="info-item">姓名：<span class="underline-blank"></span></span>
        <span class="info-item">班级：<span class="underline-blank"></span></span>
        <span class="info-item">日期：${dateStr}</span>
      </div>
    </div>

    <!-- 原题考点提示 -->
    <div style="font-size: 9pt; color: #666; margin-bottom: 12px; padding: 6px 10px; background: #f9f9f9; border-left: 3px solid #333;">
      原题考点：${escapeHtml(homework.originalQuestion)}
    </div>

    <!-- 三类题目 -->
${SECTION_CONFIG.map((section, sectionIdx) => {
  const questions = homework[section.key] as GeneratedQuestion[]
  if (!questions || questions.length === 0) return ''

  return `
    ${sectionIdx > 0 ? '<hr class="section-divider" />' : ''}
    <div class="section-title">
      <span class="section-badge">${section.badge}</span>
      ${section.numPrefix}、${section.label}
    </div>
${questions.map((q, qIdx) => renderQuestion(q, qIdx + 1)).join('\n')}
  `
}).join('')}

    <!-- 页脚 -->
    <div class="homework-footer">
      错题啄木鸟 - 举一反三练习 | 第 1 页
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
  <script>
    // Render all math after page load
    document.addEventListener('DOMContentLoaded', function() {
      document.querySelectorAll('[data-math]').forEach(function(el) {
        const tex = el.getAttribute('data-math') || ''
        const display = el.getAttribute('data-display') === 'true'
        try {
          katex.render(tex, el, {
            displayMode: display,
            throwOnError: false,
            trust: true,
            strict: false
          })
        } catch (e) {
          el.textContent = tex
        }
      })
    })
  </script>
</body>
</html>
  `.trim()
}

function renderQuestion(question: GeneratedQuestion, number: number): string {
  const hasFigure = question.figure && question.figure.trim().startsWith('<svg')

  return `
    <div class="question-block">
      <div class="question-stem">
        <span class="question-number">${number}.</span>
        <span>${renderMathText(question.stem)}</span>
      </div>

      ${question.options && question.options.length > 0 ? `
      <div class="question-options">
        ${question.options.map((opt, i) => `
        <div class="option-item">
          <span style="font-weight: bold; margin-right: 6px;">${String.fromCharCode(65 + i)}.</span>
          <span>${renderMathText(opt)}</span>
        </div>
        `).join('')}
      </div>
      ` : ''}

      ${hasFigure ? `
      <div class="figure-container" style="border: 1px solid #eee; border-radius: 4px; background: #fafafa;">
        <div style="width: 100%; display: flex; justify-content: center;">
          ${question.figure}
        </div>
      </div>
      ` : ''}

      <div class="answer-area" style="height: ${(question.answerArea || 3) * 28}px;"></div>
    </div>
  `
}

function renderMathText(text: string): string {
  if (!text) return ''
  let result = escapeHtml(text)

  // $$...$$ display math
  result = result.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
    return `<span data-math="${escapeHtml(math.trim())}" data-display="true"></span>`
  })

  // $...$ inline math
  result = result.replace(/\$([^\$\n]+?)\$/g, (_, math) => {
    return `<span data-math="${escapeHtml(math.trim())}" data-display="false"></span>`
  })

  // \[...\]
  result = result.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => {
    return `<span data-math="${escapeHtml(math.trim())}" data-display="true"></span>`
  })

  // \(...\)
  result = result.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => {
    return `<span data-math="${escapeHtml(math.trim())}" data-display="false"></span>`
  })

  result = result.replace(/\n/g, '<br/>')
  return result
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
/* 作业纸专用样式 - 模拟真实学校作业纸 */
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

/* 页眉区域 */
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

/* 题目区块标题 */
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

/* 题目容器 */
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

/* 答题区域（横线） */
.answer-area {
  margin-top: 8px;
  padding-top: 4px;
}

/* 图形区域 */
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

/* 页脚 */
.homework-footer {
  position: absolute;
  bottom: 15mm;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 9pt;
  color: #999;
}

/* 分隔线 */
.section-divider {
  border: none;
  border-top: 1px dashed #ccc;
  margin: 15px 0;
}

/* 打印样式 */
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
