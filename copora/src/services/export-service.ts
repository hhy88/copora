import MarkdownIt from 'markdown-it'
import taskLists from 'markdown-it-task-lists'
import footnotePlugin from 'markdown-it-footnote'
import markPlugin from 'markdown-it-mark'

const md = new MarkdownIt('commonmark', { html: true })
md.enable(['table', 'strikethrough'])
md.use(taskLists)
md.use(footnotePlugin)
md.use(markPlugin)

function stripMarkdown(content: string): string {
  return content
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/~~(.+?)~~/g, '$1')
    .replace(/==(.+?)==/g, '$1')
    .replace(/`{3}[\s\S]*?`{3}/g, (match) => match.replace(/`{3}.*?\n?/g, '').trim())
    .replace(/`(.+?)`/g, '$1')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[(.+?)\]\(.*?\)/g, '$1')
    .replace(/^>\s+/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/^---+$/gm, '')
    .replace(/\[([^\]]+)\]\[([^\]]*)\]/g, '$1')
    .replace(/\[\^.+?\]/g, '')
    .replace(/^\|.*\|$/gm, (line) =>
      line
        .split('|')
        .map((cell) => cell.trim())
        .filter(Boolean)
        .join(' ')
    )
    .replace(/^[-:]+$/gm, '')
    .trim()
}

function markdownToLatex(content: string): string {
  const lines = content.split('\n')
  let inCodeBlock = false
  let inList = false
  const result: string[] = []

  for (const line of lines) {
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        result.push('\\end{verbatim}')
        inCodeBlock = false
      } else {
        result.push('\\begin{verbatim}')
        inCodeBlock = true
      }
      continue
    }
    if (inCodeBlock) {
      result.push(line)
      continue
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/)
    if (headingMatch) {
      const level = headingMatch[1].length
      const text = headingMatch[2].replace(/\*\*(.+?)\*\*/g, '\\textbf{$1}').replace(/\*(.+?)\*/g, '\\textit{$1}')
      const commands = ['\\section', '\\subsection', '\\subsubsection', '\\paragraph', '\\subparagraph', '\\subparagraph']
      result.push(`${commands[level - 1] || '\\subparagraph'}{${text}}`)
      inList = false
      continue
    }

    if (line.match(/^[-*+]\s+/)) {
      if (!inList) {
        result.push('\\begin{itemize}')
        inList = true
      }
      const item = line.replace(/^[-*+]\s+/, '').replace(/\*\*(.+?)\*\*/g, '\\textbf{$1}').replace(/\*(.+?)\*/g, '\\textit{$1}')
      result.push(`  \\item ${item}`)
      continue
    }

    if (line.match(/^\d+\.\s+/)) {
      if (!inList) {
        result.push('\\begin{enumerate}')
        inList = true
      }
      const item = line.replace(/^\d+\.\s+/, '').replace(/\*\*(.+?)\*\*/g, '\\textbf{$1}').replace(/\*(.+?)\*/g, '\\textit{$1}')
      result.push(`  \\item ${item}`)
      continue
    }

    if (inList && line.trim() === '') {
      result.push('\\end{itemize}')
      inList = false
    }

    if (line.trim() === '') {
      result.push('')
      continue
    }

    const processed = line
      .replace(/\*\*(.+?)\*\*/g, '\\textbf{$1}')
      .replace(/\*(.+?)\*/g, '\\textit{$1}')
      .replace(/`(.+?)`/g, '\\texttt{$1}')
      .replace(/\[(.+?)\]\((.+?)\)/g, '\\href{$2}{$1}')
      .replace(/!\[(.+?)\]\((.+?)\)/g, '\\includegraphics{$2}')

    result.push(processed)
  }

  if (inList) {
    result.push('\\end{itemize}')
  }

  return result.join('\n')
}

function buildHtmlDocument(body: string, standalone: boolean, includeTheme: boolean): string {
  if (!standalone) return body

  const themeCss = includeTheme
    ? `<style>
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.6; color: #333; }
h1, h2, h3, h4, h5, h6 { margin-top: 1.5em; margin-bottom: 0.5em; }
p { margin: 0.5em 0; }
code { background: #f4f4f4; padding: 0.2em 0.4em; border-radius: 3px; font-size: 0.9em; }
pre { background: #f4f4f4; padding: 1em; border-radius: 5px; overflow-x: auto; }
pre code { background: none; padding: 0; }
blockquote { border-left: 4px solid #ddd; margin: 0.5em 0; padding: 0.5em 1em; color: #666; }
table { border-collapse: collapse; width: 100%; margin: 1em 0; }
th, td { border: 1px solid #ddd; padding: 0.5em 1em; text-align: left; }
img { max-width: 100%; }
</style>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Exported Document</title>
${themeCss}
</head>
<body>
${body}
</body>
</html>`
}

export async function exportPDF(
  _content: string,
  _options: { theme: string; pageSize: string; margins: object }
): Promise<void> {
  window.print()
}

export async function exportHTML(
  content: string,
  options: { standalone: boolean; includeTheme: boolean }
): Promise<string> {
  const body = md.render(content)
  return buildHtmlDocument(body, options.standalone, options.includeTheme)
}

export async function exportDOCX(content: string): Promise<void> {
  const html = md.render(content)
  const fullHtml = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>Export</title></head>
<body>${html}</body>
</html>`
  const blob = new Blob([fullHtml], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'document.docx'
  a.click()
  URL.revokeObjectURL(url)
}

export async function exportTXT(content: string): Promise<string> {
  return stripMarkdown(content)
}

export async function exportLaTeX(content: string): Promise<string> {
  return markdownToLatex(content)
}

export const ExportService = {
  exportPDF,
  exportHTML,
  exportDOCX,
  exportTXT,
  exportLaTeX,
}
