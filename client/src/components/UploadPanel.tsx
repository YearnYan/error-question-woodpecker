import { useCallback, useRef, useState } from 'react'
import type { UploadedImage } from '../types'

interface Props {
  image: UploadedImage | null
  onUpload: (image: UploadedImage) => void
  loading: boolean
}

export default function UploadPanel({ image, onUpload, loading }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('请上传图片文件（JPG、PNG、BMP等）')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('图片大小不能超过10MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const base64 = e.target?.result as string
      const uploaded: UploadedImage = {
        id: Date.now().toString(),
        file,
        previewUrl: URL.createObjectURL(file),
        base64,
      }
      onUpload(uploaded)
    }
    reader.readAsDataURL(file)
  }, [onUpload])

  const handleClick = () => fileInputRef.current?.click()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ''
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [processFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOver(false)
  }, [])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) processFile(file)
        break
      }
    }
  }, [processFile])

  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      onPaste={handlePaste}
      tabIndex={0}
    >
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
        <h2 className="font-semibold text-gray-700 text-sm flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          上传错题
        </h2>
      </div>

      {image ? (
        <div className="p-4">
          <div className="relative group">
            <img
              src={image.previewUrl}
              alt="错题图片"
              className="w-full rounded-lg border border-gray-200 max-h-[400px] object-contain bg-gray-50"
            />
            <button
              onClick={handleClick}
              className="absolute top-2 right-2 bg-white/90 hover:bg-white text-gray-600 text-xs px-3 py-1.5 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
            >
              更换图片
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            {image.file.name} ({(image.file.size / 1024).toFixed(0)} KB)
          </p>
        </div>
      ) : (
        <div
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`p-8 cursor-pointer transition-all duration-200 ${
            dragOver
              ? 'bg-primary-50 border-2 border-dashed border-primary-300'
              : 'hover:bg-gray-50'
          }`}
        >
          <div className="flex flex-col items-center text-center">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
              dragOver ? 'bg-primary-100' : 'bg-gray-100'
            }`}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={dragOver ? '#3b82f6' : '#9ca3af'} strokeWidth="1.5">
                <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-gray-600 font-medium mb-1">
              {dragOver ? '松开即可上传' : '点击或拖拽上传错题图片'}
            </p>
            <p className="text-xs text-gray-400">
              支持 JPG、PNG、BMP 格式，也可以直接粘贴截图
            </p>
            <p className="text-xs text-gray-400 mt-1">
              最大 10MB
            </p>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}
