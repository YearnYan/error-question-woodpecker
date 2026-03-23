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

  // Fix double-escaped LaTeX: \\frac -> \frac, \\sqrt -> \sqrt, etc.
  // This handles cases where JSON parsing preserved double backslashes
  result = result.replace(/\\\\(frac|sqrt|theta|alpha|beta|gamma|delta|pi|omega|Omega|Theta|Delta|Gamma|Pi|Sigma|Lambda|Phi|Psi|Xi|times|div|pm|leq|geq|neq|approx|sin|cos|tan|log|ln|lim|sum|prod|int|infty|cdot|circ|angle|triangle|perp|parallel|vec|overline|overrightarrow|hat|bar|dot|ddot|text|mathrm|mathbf|left|right|begin|end|quad|qquad|hspace|vspace|displaystyle|rightarrow|leftarrow|Rightarrow|therefore|because|in|notin|subset|supset|cup|cap|emptyset|forall|exists)/g, '\\$1')

  // Detect bare LaTeX commands not wrapped in $...$ and wrap them
  // Match patterns like \frac{...}{...}, \sqrt{...}, etc. that are NOT inside $...$
  result = wrapBareLatex(result)

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

/**
 * Detect bare LaTeX commands (not wrapped in $...$) and wrap them.
 * This handles cases where AI outputs \frac{a}{b} without dollar signs.
 */
function wrapBareLatex(text: string): string {
  // Skip if no backslash-commands exist outside of $...$
  // First, temporarily replace already-wrapped math
  const mathPlaceholders: string[] = []
  let temp = text.replace(/\$\$[\s\S]*?\$\$/g, (m) => {
    mathPlaceholders.push(m)
    return `\x00MATH${mathPlaceholders.length - 1}\x00`
  })
  temp = temp.replace(/\$[^\$\n]+?\$/g, (m) => {
    mathPlaceholders.push(m)
    return `\x00MATH${mathPlaceholders.length - 1}\x00`
  })

  // Now check if there are bare LaTeX commands
  const latexCmdPattern = /\\(frac|sqrt|theta|alpha|beta|gamma|delta|pi|omega|Omega|Theta|Delta|Gamma|Pi|Sigma|Lambda|Phi|Psi|Xi|times|div|pm|leq|geq|neq|approx|sin|cos|tan|log|ln|lim|sum|prod|int|infty|cdot|circ|angle|triangle|perp|parallel|vec|overline|overrightarrow|rightarrow|leftarrow|Rightarrow|therefore|because)\b/
  if (latexCmdPattern.test(temp)) {
    // Wrap sequences of LaTeX commands and their arguments in $...$
    temp = temp.replace(/(\\(?:frac|sqrt|theta|alpha|beta|gamma|delta|pi|omega|Omega|Theta|Delta|Gamma|Pi|Sigma|Lambda|Phi|Psi|Xi|times|div|pm|leq|geq|neq|approx|sin|cos|tan|log|ln|lim|sum|prod|int|infty|cdot|circ|angle|triangle|perp|parallel|vec|overline|overrightarrow|rightarrow|leftarrow|Rightarrow|therefore|because)(?:\{[^}]*\})*(?:\[[^\]]*\])?(?:\{[^}]*\})*(?:[_^]\{[^}]*\})*)/g, (match) => {
      return `$${match}$`
    })
  }

  // Restore math placeholders
  temp = temp.replace(/\x00MATH(\d+)\x00/g, (_, idx) => mathPlaceholders[parseInt(idx)])

  return temp
}
