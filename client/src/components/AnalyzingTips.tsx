import { useState, useEffect, useRef } from 'react'

const STEP_MESSAGES = [
  '正在识别题目内容...',
  '正在分析知识点...',
  '正在匹配考点...',
  '正在生成解答思路...',
  '正在整理分析结果...',
  '马上就好，请稍候...',
]

const TIPS = [
  '研究表明，整理错题可以提高 30% 的学习效率',
  '每道错题都是进步的阶梯，重复练习是巩固知识的关键',
  '举一反三是最高效的学习方法之一',
  'AI 正在为你匹配最精准的知识点和考点',
  '错题本被公认为提分最快的学习工具',
  '同类型题目反复练习 3 遍以上，掌握率可达 90%',
  '把错题归类整理，能帮助发现薄弱知识点',
  '坚持每天复习错题，一个月后你会看到明显进步',
]

const STEP_INTERVAL = 3000
const TIP_INTERVAL = 4000

export default function AnalyzingTips() {
  const [stepIndex, setStepIndex] = useState(0)
  const [tipIndex, setTipIndex] = useState(() => Math.floor(Math.random() * TIPS.length))
  const [tipFade, setTipFade] = useState(true)
  const [progress, setProgress] = useState(10)
  const tipTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  // 步骤文案轮播
  useEffect(() => {
    const timer = setInterval(() => {
      setStepIndex(i => (i < STEP_MESSAGES.length - 1 ? i + 1 : i))
    }, STEP_INTERVAL)
    return () => clearInterval(timer)
  }, [])

  // 小贴士轮播（带淡入淡出）
  useEffect(() => {
    tipTimer.current = setInterval(() => {
      setTipFade(false)
      setTimeout(() => {
        setTipIndex(i => (i + 1) % TIPS.length)
        setTipFade(true)
      }, 300)
    }, TIP_INTERVAL)
    return () => { if (tipTimer.current) clearInterval(tipTimer.current) }
  }, [])

  // 伪进度条（前50%每秒+2%，后50%每秒+1%，上限98%）
  useEffect(() => {
    progressTimer.current = setInterval(() => {
      setProgress(p => {
        if (p >= 98) return 98
        const step = p < 50 ? 2 : 1
        return Math.min(p + step, 98)
      })
    }, 1000)
    return () => { if (progressTimer.current) clearInterval(progressTimer.current) }
  }, [])

  return (
    <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
      {/* 步骤文案 + 旋转动画 */}
      <div className="flex items-center gap-3">
        <div className="relative w-10 h-10 flex-shrink-0">
          <svg className="animate-spin w-10 h-10 text-primary-500" viewBox="0 0 24 24">
            <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none"/>
            <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-base font-medium text-gray-800 transition-all duration-300">
            {STEP_MESSAGES[stepIndex]}
          </p>
        </div>
      </div>

      {/* 伪进度条 */}
      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 学习小贴士 */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex items-start gap-2.5">
        <span className="text-amber-500 text-lg leading-none mt-0.5">💡</span>
        <p
          className={`text-sm text-amber-700 transition-opacity duration-300 ${tipFade ? 'opacity-100' : 'opacity-0'}`}
        >
          {TIPS[tipIndex]}
        </p>
      </div>
    </div>
  )
}
