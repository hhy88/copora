import type { WordStats } from '../types'

export function extractHeadings(content: string): Array<{ level: number; text: string; line: number }> {
  const headings: Array<{ level: number; text: string; line: number }> = []
  const lines = content.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^(#{1,6})\s+(.+)$/)
    if (match) {
      headings.push({
        level: match[1].length,
        text: match[2].trim(),
        line: i + 1,
      })
    }
  }
  return headings
}

export function countWords(content: string): WordStats {
  const totalChars = content.length
  const chineseChars = (content.match(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g) || []).length
  const englishChars = (content.match(/[a-zA-Z]/g) || []).length
  const charsNoSpaces = content.replace(/\s/g, '').length
  const paragraphs = content
    .split(/\n\s*\n/)
    .filter((p) => p.trim().length > 0).length
  const images = (content.match(/!\[.*?\]\(.*?\)/g) || []).length
  return { totalChars, chineseChars, englishChars, charsNoSpaces, paragraphs, images }
}

export function generateAnchor(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s\u4e00-\u9fff-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function extractCodeBlocks(content: string): Array<{ language: string; code: string; startLine: number }> {
  const blocks: Array<{ language: string; code: string; startLine: number }> = []
  const lines = content.split('\n')
  let i = 0
  while (i < lines.length) {
    const match = lines[i].match(/^```(\w*)/)
    if (match) {
      const language = match[1] || ''
      const startLine = i + 1
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      blocks.push({ language, code: codeLines.join('\n'), startLine })
    }
    i++
  }
  return blocks
}
