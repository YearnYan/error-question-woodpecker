declare module 'html-pdf-node' {
  export interface Options {
    format?: string
    path?: string
    margin?: {
      top?: string
      right?: string
      bottom?: string
      left?: string
    }
    printBackground?: boolean
    preferCSSPageSize?: boolean
  }

  export interface File {
    content: string
  }

  export function generatePdf(
    file: File,
    options?: Options
  ): Promise<Buffer>
}
