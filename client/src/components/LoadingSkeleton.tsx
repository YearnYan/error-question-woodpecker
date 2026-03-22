export default function LoadingSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
        <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
      </div>

      <div className="p-8">
        {/* 模拟作业纸骨架 */}
        <div className="max-w-[600px] mx-auto space-y-6">
          {/* 标题骨架 */}
          <div className="flex flex-col items-center space-y-2">
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
            <div className="w-full h-0.5 bg-gray-200 mt-2" />
          </div>

          {/* 信息行骨架 */}
          <div className="flex justify-between">
            <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
            <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
            <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
          </div>

          {/* 题目区骨架 x3 */}
          {[1, 2, 3].map((section) => (
            <div key={section} className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-5 w-16 bg-gray-300 rounded animate-pulse" />
                <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
              </div>

              <div className="space-y-2 pl-4">
                <div className="h-3 w-full bg-gray-100 rounded animate-pulse" />
                <div className="h-3 w-5/6 bg-gray-100 rounded animate-pulse" />
                <div className="h-3 w-4/6 bg-gray-100 rounded animate-pulse" />
              </div>

              {/* 图形占位 */}
              {section === 1 && (
                <div className="flex justify-center">
                  <div className="w-40 h-32 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <path d="M21 15l-5-5L5 21"/>
                    </svg>
                  </div>
                </div>
              )}

              {/* 答题线骨架 */}
              <div className="space-y-3 mt-2">
                {[1, 2, 3].map((line) => (
                  <div key={line} className="h-6 border-b border-gray-100" />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 加载提示 */}
        <div className="flex items-center justify-center mt-8 text-gray-400 text-sm gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          AI 正在生成举一反三作业，请稍候...
        </div>
      </div>
    </div>
  )
}
