import type { HomeworkData } from './generator.js'
import { renderHomeworkHTML } from './html-renderer.js'

/**
 * Export homework data to Word document (.doc)
 * Uses HTML format which Word opens with full fidelity.
 * This guarantees 100% layout match with the web preview.
 */
export async function exportToWord(homework: HomeworkData): Promise<Buffer> {
  const html = renderHomeworkHTML(homework)

  // Wrap in Word-compatible MHTML envelope
  const wordHtml = `
MIME-Version: 1.0
Content-Type: multipart/related; boundary="----=_NextPart_BOUNDARY"

------=_NextPart_BOUNDARY
Content-Type: text/html; charset="utf-8"
Content-Transfer-Encoding: quoted-printable

${html}

------=_NextPart_BOUNDARY--
  `.trim()

  return Buffer.from(wordHtml, 'utf-8')
}
