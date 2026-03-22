import type { AnalysisResult as AnalysisResultType } from '../types'
import MathRenderer from './MathRenderer'

interface Props {
  analysis: AnalysisResultType
}

export default function AnalysisResultPanel({ analysis }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
        <h2 className="font-semibold text-gray-700 text-sm flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          错题分析结果
        </h2>
        <span className="text-xs px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full font-medium">
          {analysis.subject}
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* 知识点 */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">知识点</h3>
          <div className="flex flex-wrap gap-2">
            {analysis.knowledgePoints.map((point, i) => (
              <span key={i} className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg">
                {point}
              </span>
            ))}
          </div>
        </div>

        {/* 考点 */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">考点定位</h3>
          <div className="flex flex-wrap gap-2">
            {analysis.examPoints.map((point, i) => (
              <span key={i} className="text-xs px-2.5 py-1 bg-green-50 text-green-700 rounded-lg">
                {point}
              </span>
            ))}
          </div>
        </div>

        {/* 答案 */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">答案</h3>
          <div className="text-sm text-gray-800 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100">
            <MathRenderer content={analysis.answer} />
          </div>
        </div>

        {/* 解析 */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">答案解析</h3>
          <div className="text-sm text-gray-700 leading-relaxed bg-gray-50 px-4 py-3 rounded-lg">
            <MathRenderer content={analysis.solution} />
          </div>
        </div>
      </div>
    </div>
  )
}
