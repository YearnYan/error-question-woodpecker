interface Props {
  progress?: { phase: string; message: string; percent: number } | null
}

export default function LoadingSkeleton({ progress }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
        <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
      </div>

      <div className="p-8">
        {/* 进度条 */}
        {progress && (
          <div className="mb-8 max-w-[500px] mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 font-medium">{progress.message}</span>
              <span className="text-sm text-primary-600 font-bold">{progress.percent}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-primary-400 to-primary-600 h-3 rounded-full transition-all duration-700 ease-out relative"
                style={{ width: `${progress.percent}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
              </div>
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-400">
              <span>生成题目</span>
              <span>渲染图形</span>
              <span>完成</span>
            </div>
          </div>
        )}

        {/* 骨架 */}
        <div className="max-w-[600px] mx-auto space-y-6">
          <div className="flex flex-col items-center space-y-2">
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
            <div className="w-full h-0.5 bg-gray-200 mt-2" />
          </div>

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
              <div className="space-y-3 mt-2">
                {[1, 2].map((line) => (
                  <div key={line} className="h-6 border-b border-gray-100" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
