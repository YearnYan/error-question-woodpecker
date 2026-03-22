import { useRef, useCallback, useState } from 'react'
import type { HomeworkData } from '../types'
import HomeworkSheet from './HomeworkSheet'
import '../styles/homework-sheet.css'

interface Props {
  homework: HomeworkData
}

function getPrintStyles(): string {
  return `
    .homework-sheet {
      background: white;
      width: 210mm;
      min-height: 297mm;
      padding: 20mm 18mm 25mm 18mm;
      margin: 0 auto;
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
    .homework-header .subtitle { font-size: 11pt; color: #333; }
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
    .question-block { margin-bottom: 16px; }
    .question-number { font-weight: bold; margin-right: 6px; }
    .question-stem { text-align: justify; margin-bottom: 6px; }
    .question-options { padding-left: 2em; margin-bottom: 6px; }
    .question-options .option-item { margin-bottom: 2px; }
    .answer-area { margin-top: 8px; padding-top: 4px; }
    .figure-container {
      display: flex;
      justify-content: center;
      margin: 10px 0;
      padding: 8px;
    }
    .figure-container svg { max-width: 100%; max-height: 200px; }
    .homework-footer {
      position: absolute;
      bottom: 15mm;
      left: 0; right: 0;
      text-align: center;
      font-size: 9pt;
      color: #999;
    }
    .section-divider {
      border: none;
      border-top: 1px dashed #ccc;
      margin: 15px 0;
    }
    .figure-spinner { display: none; }
    .katex { font-size: 1em; }
  `
}

export default function HomeworkPreview({ homework }: Props) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const [showAnswers, setShowAnswers] = useState(false)

  const handleExportWord = useCallback(async () => {
    try {
      const res = await fetch('/api/export/word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ homework }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        alert(errorData.error || '导出Word文档失败，请重试')
        return
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `举一反三练习_${homework.subject}_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.doc`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Word export failed:', err)
      alert('导出Word文档失败，请重试')
    }
  }, [homework])

  const handleExportPDF = useCallback(() => {
    const content = sheetRef.current
    if (!content) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('请允许弹出窗口以导出PDF')
      return
    }

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>举一反三练习 - ${homework.subject}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: white; }
    @page { size: A4; margin: 0; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    ${getPrintStyles()}
  </style>
</head>
<body>${content.innerHTML}</body>
</html>`)
    printWindow.document.close()
    setTimeout(() => printWindow.print(), 600)
  }, [homework])

  return (
    <div className="space-y-4">
      {/* 工具栏 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-3 flex items-center justify-between">
        <h2 className="font-semibold text-gray-700 text-sm flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          作业试卷预览
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAnswers(!showAnswers)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              showAnswers
                ? 'text-white bg-amber-500 hover:bg-amber-600'
                : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {showAnswers
                ? <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M3 3l18 18" strokeLinecap="round" strokeLinejoin="round"/>
                : <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeLinecap="round" strokeLinejoin="round"/>
              }
            </svg>
            {showAnswers ? '隐藏答案' : '显示答案和解析'}
          </button>
          <button
            onClick={handleExportWord}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            下载 WORD
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            下载 PDF
          </button>
        </div>
      </div>

      {/* 作业纸 */}
      <div className="overflow-x-auto pb-4">
        <div ref={sheetRef} className="mx-auto" style={{ width: 'fit-content' }}>
          <HomeworkSheet homework={homework} showAnswers={showAnswers} />
        </div>
      </div>
    </div>
  )
}
