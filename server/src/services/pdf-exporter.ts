import type { HomeworkData } from './generator.js'
import { renderHomeworkHTML } from './html-renderer.js'

// Lazy import html-pdf-node to avoid loading native module at startup
let htmlPdf: any = null
async function getHtmlPdf() {
  if (!htmlPdf) {
    htmlPdf = (await import('html-pdf-node')).default
  }
  return htmlPdf
}

/**
 * Export homework data to PDF
 */
export async function exportToPDF(homework: HomeworkData): Promise<Buffer> {
  const html = renderHomeworkHTML(homework)

  const options = {
    format: 'A4',
    margin: {
      top: '0mm',
      right: '0mm',
      bottom: '0mm',
      left: '0mm',
    },
    printBackground: true,
    preferCSSPageSize: true,
  }

  const file = { content: html }

  try {
    const HtmlPdf = await getHtmlPdf()
    const pdfBuffer = await HtmlPdf.generatePdf(file, options)
    return pdfBuffer as Buffer
  } catch (err) {
    console.error('[PDF Export] Failed:', err)
    throw new Error('PDF生成失败')
  }
}
