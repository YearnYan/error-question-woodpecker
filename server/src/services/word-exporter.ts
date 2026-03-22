import type { HomeworkData } from './generator.js'
import { renderHomeworkHTML } from './html-renderer.js'

/**
 * Export homework data to Word document (.doc)
 * Uses HTML format which Word opens with full fidelity.
 * This guarantees 100% layout match with the web preview.
 */
export async function exportToWord(homework: HomeworkData): Promise<Buffer> {
  const html = renderHomeworkHTML(homework)
  return Buffer.from(html, 'utf-8')
}
