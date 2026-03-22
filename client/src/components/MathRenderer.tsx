import { useEffect, useRef } from 'react'
import katex from 'katex'

interface Props {
  content: string
  block?: boolean
}

export default function MathRenderer({ content, block = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || !content) return

    // Process content: render LaTeX expressions within $...$ and $$...$$
    const html = renderMathInText(content)
    containerRef.current.innerHTML = html
  }, [content])

  return (
    <div
      ref={containerRef}
      className={block ? 'katex-display' : 'katex-inline'}
      style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
    />
  )
}

function renderMathInText(text: string): string {
  if (!text) return ''

  // Clean up markdown artifacts and literal escape sequences
  let result = text
    .replace(/\\n/g, '\n')           // Convert literal \n to actual newline
    .replace(/\*\*/g, '')            // Remove markdown bold markers
    .replace(/^[\s\n]+|[\s\n]+$/g, '') // Trim leading/trailing whitespace

  // Replace display math $$...$$
  result = result.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), {
        displayMode: true,
        throwOnError: false,
        trust: true,
        strict: false,
      })
    } catch {
      return `<span class="text-red-500">[公式渲染错误]</span>`
    }
  })

  // Replace inline math $...$
  result = result.replace(/\$([^\$\n]+?)\$/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), {
        displayMode: false,
        throwOnError: false,
        trust: true,
        strict: false,
      })
    } catch {
      return `<span class="text-red-500">[公式渲染错误]</span>`
    }
  })

  // Replace \[...\] display math
  result = result.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), {
        displayMode: true,
        throwOnError: false,
        trust: true,
        strict: false,
      })
    } catch {
      return `<span class="text-red-500">[公式渲染错误]</span>`
    }
  })

  // Replace \(...\) inline math
  result = result.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), {
        displayMode: false,
        throwOnError: false,
        trust: true,
        strict: false,
      })
    } catch {
      return `<span class="text-red-500">[公式渲染错误]</span>`
    }
  })

  // Convert newlines to <br>
  result = result.replace(/\n/g, '<br/>')

  return result
}
