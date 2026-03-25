import { useCallback, useRef, useState } from 'react'
import type { UploadedImage } from '../types'

interface Props {
  image: UploadedImage | null
  onUpload: (image: UploadedImage) => void
  loading: boolean
}

const MAX_UPLOAD_SIZE = 10 * 1024 * 1024
const IMAGE_MAX_EDGE = 1500
const IMAGE_JPEG_QUALITY = 0.8

function readBlobAsDataURL(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsDataURL(file)
  })
}

function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('图片加载失败'))
    }

    image.src = objectUrl
  })
}

function buildCompressedFileName(originalName: string): string {
  const base = originalName.replace(/\.[^.]+$/, '')
  return `${base}-compressed.jpg`
}

async function compressImageFile(file: File): Promise<File> {
  const image = await loadImageElement(file)
  const longestEdge = Math.max(image.naturalWidth, image.naturalHeight)
  const scale = longestEdge > IMAGE_MAX_EDGE ? IMAGE_MAX_EDGE / longestEdge : 1
  const targetWidth = Math.max(1, Math.round(image.naturalWidth * scale))
  const targetHeight = Math.max(1, Math.round(image.naturalHeight * scale))

  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('浏览器不支持 Canvas 2D')
  }

  // 压缩后统一使用 JPEG，透明区域用白底填充。
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, targetWidth, targetHeight)
  ctx.drawImage(image, 0, 0, targetWidth, targetHeight)

  const compressedBlob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', IMAGE_JPEG_QUALITY)
  })

  if (!compressedBlob) {
    throw new Error('图片压缩失败')
  }

  return new File([compressedBlob], buildCompressedFileName(file.name), {
    type: 'image/jpeg',
  })
}

export default function UploadPanel({ image, onUpload, loading }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const processFile = useCallback(async (file: File) => {
    const isImage = file.type.startsWith('image/')
    const isPDF = file.type === 'application/pdf'

    if (!isImage && !isPDF) {
      alert('请上传图片（JPG、PNG、BMP）或 PDF 文件')
      return
    }

    if (file.size > MAX_UPLOAD_SIZE) {
      alert('文件大小不能超过10MB')
      return
    }

    try {
      const processedFile = isImage ? await compressImageFile(file) : file
      const base64 = await readBlobAsDataURL(processedFile)

      const uploaded: UploadedImage = {
        id: Date.now().toString(),
        file: processedFile,
        previewUrl: URL.createObjectURL(processedFile),
        base64,
      }

      onUpload(uploaded)
    } catch (error) {
      console.error('[Upload] process file failed:', error)
      alert('图片处理失败，请重试')
    }
  }, [onUpload])

  const handleClick = () => {
    if (!loading) {
      fileInputRef.current?.click()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      void processFile(file)
    }
    e.target.value = ''
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (loading) return

    const file = e.dataTransfer.files[0]
    if (file) {
      void processFile(file)
    }
  }, [processFile, loading])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!loading) {
      setDragOver(true)
    }
  }, [loading])

  const handleDragLeave = useCallback(() => {
    setDragOver(false)
  }, [])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    if (loading) return

    const items = e.clipboardData.items
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) {
          void processFile(file)
        }
        break
      }
    }
  }, [processFile, loading])

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
          <div className="relative">
            <img
              src={image.previewUrl}
              alt="错题图片"
              className="w-full rounded-lg border border-gray-200 max-h-[400px] object-contain bg-gray-50"
            />
            <button
              onClick={handleClick}
              disabled={loading}
              className="absolute top-3 right-3 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              上传题目
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
          } ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
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
              {dragOver ? '松开即可上传' : '点击或拖拽上传错题'}
            </p>
            <p className="text-xs text-gray-400">
              支持 JPG、PNG、BMP、PDF 格式，也可直接粘贴截图
            </p>
            <p className="text-xs text-amber-500 mt-1.5 font-medium">
              每次只允许上传 1 道题目（错题专项训练）
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
        accept="image/*,.pdf"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}
