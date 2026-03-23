import { useState, useCallback, useRef, useEffect } from 'react'
import type { UploadedImage, AnalysisResult, HomeworkData, LoadingState, Subject } from './types'
import UploadPanel from './components/UploadPanel'
import AnalysisResultPanel from './components/AnalysisResult'
import HomeworkPreview from './components/HomeworkPreview'
import LoadingSkeleton from './components/LoadingSkeleton'
import AnalyzingTips from './components/AnalyzingTips'

interface ProgressInfo {
  phase: string
  message: string
  percent: number
}

function App() {
  const [image, setImage] = useState<UploadedImage | null>(null)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [homework, setHomework] = useState<HomeworkData | null>(null)
  const [loadingState, setLoadingState] = useState<LoadingState>('idle')
  const [error, setError] = useState<string>('')
  const [mobileView, setMobileView] = useState<'left' | 'right'>('left')
  const [progress, setProgress] = useState<ProgressInfo | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const abortRef = useRef<AbortController | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Timer for loading states
  useEffect(() => {
    if (loadingState !== 'idle') {
      setElapsed(0)
      timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
      timerRef.current = null
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [loadingState])

  // Auto-generate homework after analysis completes
  const autoGenerateRef = useRef(false)
  useEffect(() => {
    if (analysis && image && !homework && autoGenerateRef.current) {
      autoGenerateRef.current = false
      handleGenerate()
    }
  }, [analysis])

  const handleImageUpload = useCallback((uploaded: UploadedImage) => {
    setImage(uploaded)
    setAnalysis(null)
    setHomework(null)
    setError('')
  }, [])

  const handleAnalyze = useCallback(async () => {
    if (!image) return
    setLoadingState('analyzing')
    setError('')
    setAnalysis(null)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: image.base64 }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || '分析失败')
      autoGenerateRef.current = true
      setAnalysis(data.data)
    } catch (err: any) {
      setError(err.message || '分析请求失败，请重试')
    } finally {
      setLoadingState('idle')
    }
  }, [image])

  const handleGenerate = useCallback(async () => {
    if (!analysis || !image) return
    setLoadingState('generating')
    setError('')
    setHomework(null)
    setProgress({ phase: 'starting', message: '正在连接...', percent: 5 })

    const abort = new AbortController()
    abortRef.current = abort

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: image.base64, analysis }),
        signal: abort.signal,
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || '生成失败')
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error('浏览器不支持流式读取')

      const decoder = new TextDecoder()
      let buffer = ''
      let currentHomework: HomeworkData | null = null

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Parse SSE events from buffer
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep incomplete line in buffer

        let eventType = ''
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7).trim()
          } else if (line.startsWith('data: ')) {
            const dataStr = line.slice(6)
            try {
              const data = JSON.parse(dataStr)

              if (eventType === 'progress') {
                setProgress(data)
              } else if (eventType === 'questions') {
                // Questions ready (without figures) — show immediately
                currentHomework = { ...data }
                setHomework({ ...data })
                setMobileView('right')
              } else if (eventType === 'figure') {
                // Individual figure arrived — patch into homework
                if (currentHomework) {
                  const { section, index, svg } = data
                  const sectionArr = currentHomework[section as keyof HomeworkData] as any[]
                  if (sectionArr && sectionArr[index]) {
                    sectionArr[index].figure = svg
                    setHomework({ ...currentHomework })
                  }
                }
              } else if (eventType === 'done') {
                currentHomework = data
                setHomework({ ...data })
                setProgress({ phase: 'done', message: '生成完成', percent: 100 })
              } else if (eventType === 'error') {
                throw new Error(data.error || '生成失败')
              }
            } catch (parseErr: any) {
              if (parseErr.message?.includes('生成失败')) throw parseErr
              // Ignore JSON parse errors for incomplete data
            }
            eventType = ''
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || '生成请求失败，请重试')
      }
    } finally {
      setLoadingState('idle')
      setProgress(null)
      abortRef.current = null
    }
  }, [analysis, image])

  const handleReset = useCallback(() => {
    setImage(null)
    setAnalysis(null)
    setHomework(null)
    setLoadingState('idle')
    setError('')
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1 className="text-lg font-bold text-gray-800">错题啄木鸟</h1>
            <span className="text-xs text-gray-400 hidden sm:inline">举一反三作业生成</span>
          </div>
          <div className="flex items-center gap-2">
            {/* 移动端切换按钮 */}
            <div className="flex lg:hidden bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setMobileView('left')}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  mobileView === 'left' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500'
                }`}
              >
                上传分析
              </button>
              <button
                onClick={() => setMobileView('right')}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  mobileView === 'right' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500'
                }`}
              >
                作业预览
              </button>
            </div>
            {image && (
              <button
                onClick={handleReset}
                className="text-xs text-gray-500 hover:text-red-500 transition-colors px-2 py-1"
              >
                重新开始
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 主体 - 左右分栏 */}
      <main className="max-w-[1600px] mx-auto p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          {/* 左侧面板 - 上传与分析 */}
          <div className={`w-full lg:w-[42%] xl:w-[40%] flex-shrink-0 space-y-4 ${
            mobileView === 'right' ? 'hidden lg:block' : ''
          }`}>
            {/* 上传区 */}
            <UploadPanel
              image={image}
              onUpload={handleImageUpload}
              loading={loadingState === 'uploading'}
            />

            {/* 错题分析按钮 */}
            {image && !analysis && (
              <>
                <button
                  onClick={handleAnalyze}
                  disabled={loadingState === 'analyzing'}
                  className="w-full py-3 bg-primary-600 text-white rounded-xl font-medium
                    hover:bg-primary-700 disabled:bg-primary-300 disabled:cursor-not-allowed
                    transition-all duration-200 shadow-sm hover:shadow-md
                    flex items-center justify-center gap-2"
                >
                  {loadingState === 'analyzing' ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      AI 正在分析中...
                    </>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      错题分析并生成作业
                    </>
                  )}
                </button>
                {loadingState === 'analyzing' && (
                  <AnalyzingTips />
                )}
              </>
            )}

            {/* 分析结果 */}
            {analysis && (
              <AnalysisResultPanel analysis={analysis} />
            )}

            {/* 生成作业按钮 */}
            {analysis && (
              <button
                onClick={handleGenerate}
                disabled={loadingState === 'generating'}
                className="w-full py-3 bg-green-600 text-white rounded-xl font-medium
                  hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed
                  transition-all duration-200 shadow-sm hover:shadow-md
                  flex items-center justify-center gap-2"
              >
                {loadingState === 'generating' ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    AI 正在生成举一反三作业...
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    生成举一反三作业
                  </>
                )}
              </button>
            )}

            {/* 错误提示 */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                  </svg>
                  <div>
                    <p className="font-medium">出错了</p>
                    <p className="mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 右侧面板 - 作业预览 */}
          <div className={`w-full lg:flex-1 ${
            mobileView === 'left' ? 'hidden lg:block' : ''
          }`}>
            {loadingState === 'generating' && !homework ? (
              <LoadingSkeleton progress={progress} />
            ) : homework ? (
              <div>
                {progress && progress.phase !== 'done' && (
                  <div className="mb-4 bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-3">
                    <div className="flex items-center gap-3">
                      <svg className="animate-spin h-4 w-4 text-primary-500" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      <span className="text-sm text-gray-600">{progress.message}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2 ml-2">
                        <div
                          className="bg-primary-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${progress.percent}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 ml-2">{progress.percent}%</span>
                    </div>
                  </div>
                )}
                <HomeworkPreview homework={homework} />
              </div>
            ) : (
              <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 min-h-[600px] flex flex-col items-center justify-center text-gray-400">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mb-4 text-gray-300">
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p className="text-lg font-medium mb-2">作业预览区</p>
                <p className="text-sm">上传错题并分析后，点击"生成举一反三作业"</p>
                <p className="text-sm">即可在此预览生成的作业试卷</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
