import { useRef, useCallback } from 'react'
import type { HomeworkData } from '../types'
import HomeworkSheet from './HomeworkSheet'
import '../styles/homework-sheet.css'

interface Props {
  homework: HomeworkData
}

export default function HomeworkPreview({ homework }: Props) {
  const sheetRef = useRef<HTMLDivElement>(null)

  const handlePrint = useCallback(() => {
    const printContent = sheetRef.current
    if (!printContent) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('请允许弹出窗口以打印作业')
      return
    }

    printWindow.document.write(`
      <!DOCTYPE html>
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
          ${getHomeworkStyles()}
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `)
    printWindow.document.close()
    setTimeout(() => {
      printWindow.print()
    }, 500)
  }, [homework])

  const handleExportPDF = useCallback(async () => {
    try {
      const res = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ homework }),
      })

      if (!res.ok) {
        // Fallback to browser print
        handlePrint()
        return
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `举一反三练习_${homework.subject}_${new Date().toLocaleDateString('zh-CN')}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      handlePrint()
    }
  }, [homework, handlePrint])

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
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            打印
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            导出 PDF
          </button>
        </div>
      </div>

      {/* 作业纸 */}
      <div className="overflow-x-auto pb-4">
        <div ref={sheetRef} className="mx-auto" style={{ width: 'fit-content' }}>
          <HomeworkSheet homework={homework} />
        </div>
      </div>
    </div>
  )
}

function getHomeworkStyles(): string {
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
    .homework-header .school-name { font-size: 9pt; color: #666; margin-bottom: 2px; }
    .homework-header .title { font-size: 16pt; font-weight: bold; letter-spacing: 4px; margin-bottom: 4px; }
    .homework-header .subtitle { font-size: 11pt; color: #333; }
    .homework-header .info-row { display: flex; justify-content: space-between; font-size: 10pt; margin-top: 8px; color: #444; }
    .homework-header .info-row .underline-blank { display: inline-block; width: 80px; border-bottom: 1px solid #000; }
    .section-title { font-size: 12pt; font-weight: bold; margin: 18px 0 10px 0; }
    .section-badge { display: inline-block; background: #1a1a1a; color: #fff; font-size: 9pt; padding: 1px 8px; border-radius: 2px; margin-right: 8px; font-weight: normal; vertical-align: middle; }
    .question-block { margin-bottom: 16px; }
    .question-number { font-weight: bold; margin-right: 6px; }
    .question-stem { text-align: justify; margin-bottom: 6px; }
    .question-options { padding-left: 2em; margin-bottom: 6px; }
    .question-options .option-item { margin-bottom: 2px; }
    .answer-area { margin-top: 8px; }
    .answer-line { border-bottom: 1px solid #ccc; height: 28px; width: 100%; }
    .figure-container { display: flex; justify-content: center; margin: 10px 0; padding: 8px; }
    .figure-container img, .figure-container svg { max-width: 100%; max-height: 200px; }
    .section-divider { border: none; border-top: 1px dashed #ccc; margin: 15px 0; }
    .homework-footer { position: absolute; bottom: 15mm; left: 0; right: 0; text-align: center; font-size: 9pt; color: #999; }
  `
}
