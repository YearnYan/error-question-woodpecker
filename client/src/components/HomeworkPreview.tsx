import { useRef, useCallback } from 'react'
import type { HomeworkData } from '../types'
import HomeworkSheet from './HomeworkSheet'
import '../styles/homework-sheet.css'

interface Props {
  homework: HomeworkData
}

export default function HomeworkPreview({ homework }: Props) {
  const sheetRef = useRef<HTMLDivElement>(null)

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
      a.download = `举一反三练习_${homework.subject}_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.docx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Word export failed:', err)
      alert('导出Word文档失败，请重试')
    }
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
            onClick={handleExportWord}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            下载 WORD
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
