import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  VerticalAlign,
  convertInchesToTwip,
} from 'docx'
import type { HomeworkData, GeneratedQuestion } from './generator.js'

/**
 * Export homework data to Word document (.docx)
 */
export async function exportToWord(homework: HomeworkData): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.79), // 20mm
              right: convertInchesToTwip(0.71), // 18mm
              bottom: convertInchesToTwip(0.98), // 25mm
              left: convertInchesToTwip(0.71), // 18mm
            },
          },
        },
        children: [
          // Header
          ...createHeader(homework),

          // Similar questions section
          ...createSectionTitle('相似题', '同考点练习'),
          ...createQuestions(homework.similar, 1),

          // Divider
          createDivider(),

          // Variant questions section
          ...createSectionTitle('变式题', '变换题型练习'),
          ...createQuestions(homework.variant, 4),

          // Divider
          createDivider(),

          // Comprehensive questions section
          ...createSectionTitle('综合应用题', '生活场景应用'),
          ...createQuestions(homework.comprehensive, 7),

          // Footer
          createFooter(),
        ],
      },
    ],
  })

  return await Packer.toBuffer(doc)
}

function createHeader(homework: HomeworkData): Paragraph[] {
  return [
    // School name
    new Paragraph({
      text: '学校名称',
      alignment: AlignmentType.CENTER,
      spacing: { after: 50 },
      style: 'Normal',
      run: {
        size: 18, // 9pt
        color: '666666',
      },
    }),

    // Title
    new Paragraph({
      text: '举一反三练习',
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      style: 'Heading1',
      run: {
        size: 32, // 16pt
        bold: true,
      },
    }),

    // Subtitle
    new Paragraph({
      text: `${homework.subject}学科 · 错题专项训练`,
      alignment: AlignmentType.CENTER,
      spacing: { after: 160 },
      run: {
        size: 22, // 11pt
        color: '333333',
      },
    }),

    // Info row
    new Paragraph({
      children: [
        new TextRun({ text: '姓名：', size: 20 }),
        new TextRun({ text: '____________', size: 20 }),
        new TextRun({ text: '    班级：', size: 20 }),
        new TextRun({ text: '____________', size: 20 }),
        new TextRun({ text: '    日期：', size: 20 }),
        new TextRun({ text: '____________', size: 20 }),
      ],
      spacing: { after: 200 },
      border: {
        bottom: {
          color: '000000',
          space: 1,
          style: BorderStyle.SINGLE,
          size: 6,
        },
      },
    }),
  ]
}

function createSectionTitle(title: string, subtitle: string): Paragraph[] {
  return [
    new Paragraph({
      children: [
        new TextRun({
          text: title,
          bold: true,
          size: 24, // 12pt
        }),
        new TextRun({
          text: `  ${subtitle}`,
          size: 20, // 10pt
          color: '666666',
        }),
      ],
      spacing: { before: 360, after: 200 },
    }),
  ]
}

function createQuestions(questions: GeneratedQuestion[], startNumber: number): Paragraph[] {
  const paragraphs: Paragraph[] = []

  questions.forEach((q, idx) => {
    const questionNumber = startNumber + idx

    // Question stem
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${questionNumber}. `,
            bold: true,
            size: 22,
          }),
          new TextRun({
            text: cleanLatex(q.stem),
            size: 22,
          }),
        ],
        spacing: { before: 160, after: 120 },
      })
    )

    // Options (if any)
    if (q.options && q.options.length > 0) {
      q.options.forEach((option: string) => {
        paragraphs.push(
          new Paragraph({
            text: cleanLatex(option),
            indent: { left: convertInchesToTwip(0.5) },
            spacing: { after: 40 },
            run: {
              size: 22,
            },
          })
        )
      })
    }

    // Answer area
    const answerLines = q.answerArea || 3
    for (let i = 0; i < answerLines; i++) {
      paragraphs.push(
        new Paragraph({
          text: '',
          spacing: { after: 280 },
          border: {
            bottom: {
              color: 'CCCCCC',
              space: 1,
              style: BorderStyle.SINGLE,
              size: 6,
            },
          },
        })
      )
    }
  })

  return paragraphs
}

function createDivider(): Paragraph {
  return new Paragraph({
    text: '',
    spacing: { before: 300, after: 300 },
    border: {
      top: {
        color: 'CCCCCC',
        space: 1,
        style: BorderStyle.DASH_SMALL_GAP,
        size: 6,
      },
    },
  })
}

function createFooter(): Paragraph {
  return new Paragraph({
    text: '本练习由错题啄木鸟AI生成 · 举一反三专项训练',
    alignment: AlignmentType.CENTER,
    spacing: { before: 600 },
    run: {
      size: 18, // 9pt
      color: '999999',
    },
  })
}

/**
 * Clean LaTeX formulas from text for Word export
 * Convert LaTeX to plain text representation
 */
function cleanLatex(text: string): string {
  if (!text) return ''

  let result = text

  // Remove display math $$...$$
  result = result.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
    return ` ${simplifyLatex(math.trim())} `
  })

  // Remove inline math $...$
  result = result.replace(/\$([^\$\n]+?)\$/g, (_, math) => {
    return simplifyLatex(math.trim())
  })

  // Remove \[...\] display math
  result = result.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => {
    return ` ${simplifyLatex(math.trim())} `
  })

  // Remove \(...\) inline math
  result = result.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => {
    return simplifyLatex(math.trim())
  })

  // Clean up extra spaces
  result = result.replace(/\s+/g, ' ').trim()

  return result
}

/**
 * Simplify LaTeX to readable plain text
 */
function simplifyLatex(latex: string): string {
  let result = latex

  // Common LaTeX commands to plain text
  result = result.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1/$2)')
  result = result.replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
  result = result.replace(/\\sqrt\[([^\]]+)\]\{([^}]+)\}/g, '$2^(1/$1)')
  result = result.replace(/\^(\{[^}]+\}|\w)/g, (_, exp) => {
    const clean = exp.replace(/[{}]/g, '')
    return `^${clean}`
  })
  result = result.replace(/_(\{[^}]+\}|\w)/g, (_, sub) => {
    const clean = sub.replace(/[{}]/g, '')
    return `_${clean}`
  })

  // Greek letters
  result = result.replace(/\\alpha/g, 'α')
  result = result.replace(/\\beta/g, 'β')
  result = result.replace(/\\gamma/g, 'γ')
  result = result.replace(/\\delta/g, 'δ')
  result = result.replace(/\\theta/g, 'θ')
  result = result.replace(/\\pi/g, 'π')
  result = result.replace(/\\omega/g, 'ω')

  // Operators
  result = result.replace(/\\times/g, '×')
  result = result.replace(/\\div/g, '÷')
  result = result.replace(/\\pm/g, '±')
  result = result.replace(/\\leq/g, '≤')
  result = result.replace(/\\geq/g, '≥')
  result = result.replace(/\\neq/g, '≠')
  result = result.replace(/\\approx/g, '≈')

  // Remove remaining backslashes and braces
  result = result.replace(/\\[a-zA-Z]+/g, '')
  result = result.replace(/[{}]/g, '')

  return result.trim()
}
