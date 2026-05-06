import MarkdownIt from 'markdown-it'
import taskLists from 'markdown-it-task-lists'
import footnotePlugin from 'markdown-it-footnote'
import markPlugin from 'markdown-it-mark'
import { markdownSchema } from './schema'
import type { Node as ProseMirrorNode, Mark as ProseMirrorMark } from 'prosemirror-model'

interface MdToken {
  type: string
  tag: string
  nesting: number
  attrs: Array<[string, string]> | null
  children: MdToken[] | null
  content: string
  info: string
  meta: Record<string, unknown>
  hidden: boolean
  attrGet(name: string): string | null
}

const md: MarkdownIt = new MarkdownIt('commonmark', { html: true })
md.enable(['table', 'strikethrough'])
md.use(taskLists)
md.use(footnotePlugin)
md.use(markPlugin)

export function parseMarkdown(content: string): ProseMirrorNode {
  const tokens = md.parse(content, {}) as unknown as MdToken[]
  const nodes = parseBlocks(tokens, 0, tokens.length)
  if (nodes.length === 0) {
    nodes.push(markdownSchema.nodes.paragraph.create())
  }
  return markdownSchema.nodes.doc.create(null, nodes)
}

function findClose(tokens: MdToken[], pos: number): number {
  const openType = tokens[pos].type
  const closeType = openType.replace('_open', '_close')
  let depth = 1
  for (let i = pos + 1; i < tokens.length; i++) {
    if (tokens[i].type === openType && tokens[i].nesting === 1) depth++
    if (tokens[i].type === closeType && tokens[i].nesting === -1) depth--
    if (depth === 0) return i
  }
  return tokens.length - 1
}

function parseBlocks(tokens: MdToken[], start: number, end: number): ProseMirrorNode[] {
  const result: ProseMirrorNode[] = []
  let pos = start

  while (pos < end) {
    const token = tokens[pos]

    switch (token.type) {
      case 'paragraph_open': {
        const closePos = findClose(tokens, pos)
        const inlineToken = tokens[pos + 1]
        const content = inlineToken && inlineToken.type === 'inline'
          ? parseInline(inlineToken.children || [])
          : []
        result.push(markdownSchema.nodes.paragraph.create(null, content))
        pos = closePos + 1
        break
      }

      case 'heading_open': {
        const closePos = findClose(tokens, pos)
        const level = parseInt(token.tag.slice(1), 10)
        const inlineToken = tokens[pos + 1]
        const content = inlineToken && inlineToken.type === 'inline'
          ? parseInline(inlineToken.children || [])
          : []
        result.push(markdownSchema.nodes.heading.create({ level }, content))
        pos = closePos + 1
        break
      }

      case 'blockquote_open': {
        const closePos = findClose(tokens, pos)
        const content = parseBlocks(tokens, pos + 1, closePos)
        result.push(markdownSchema.nodes.blockquote.create(null, content))
        pos = closePos + 1
        break
      }

      case 'ordered_list_open': {
        const closePos = findClose(tokens, pos)
        const startAttr = token.attrGet('start')
        const order = startAttr ? parseInt(startAttr, 10) : 1
        const tight = isTightList(tokens, pos, closePos)
        const content = parseBlocks(tokens, pos + 1, closePos)
        result.push(markdownSchema.nodes.ordered_list.create({ order, tight }, content))
        pos = closePos + 1
        break
      }

      case 'bullet_list_open': {
        const closePos = findClose(tokens, pos)
        const tight = isTightList(tokens, pos, closePos)
        const content = parseBlocks(tokens, pos + 1, closePos)
        result.push(markdownSchema.nodes.bullet_list.create({ tight }, content))
        pos = closePos + 1
        break
      }

      case 'list_item_open': {
        const closePos = findClose(tokens, pos)
        const isTaskItem = token.attrGet('class')?.includes('task-list-item') ?? false
        const content = parseBlocks(tokens, pos + 1, closePos)
        if (isTaskItem) {
          const checked = detectCheckboxState(tokens, pos, closePos)
          result.push(markdownSchema.nodes.task_list_item.create({ checked }, content))
        } else {
          result.push(markdownSchema.nodes.list_item.create(null, content))
        }
        pos = closePos + 1
        break
      }

      case 'fence':
      case 'code_block': {
        const language = token.info.trim()
        const source = token.content
        if (language === 'math' || language === 'latex') {
          result.push(markdownSchema.nodes.math_block.create({ source }, markdownSchema.text(source)))
        } else if (language === 'mermaid') {
          result.push(markdownSchema.nodes.mermaid_block.create({ source }, markdownSchema.text(source)))
        } else {
          result.push(markdownSchema.nodes.code_block.create({ language }, markdownSchema.text(source)))
        }
        pos++
        break
      }

      case 'hr': {
        result.push(markdownSchema.nodes.horizontal_rule.create())
        pos++
        break
      }

      case 'table_open': {
        const closePos = findClose(tokens, pos)
        const content = parseTable(tokens, pos + 1, closePos)
        result.push(markdownSchema.nodes.table.create(null, content))
        pos = closePos + 1
        break
      }

      case 'html_block': {
        result.push(markdownSchema.nodes.html_block.create(null, markdownSchema.text(token.content)))
        pos++
        break
      }

      case 'footnote_block_open': {
        const closePos = findClose(tokens, pos)
        const content = parseBlocks(tokens, pos + 1, closePos)
        result.push(markdownSchema.nodes.footnote_block.create(null, content))
        pos = closePos + 1
        break
      }

      case 'footnote_open': {
        const closePos = findClose(tokens, pos)
        const content = parseBlocks(tokens, pos + 1, closePos)
        result.push(...content)
        pos = closePos + 1
        break
      }

      case 'footnote_anchor': {
        pos++
        break
      }

      default: {
        if (token.nesting === 1) {
          const closePos = findClose(tokens, pos)
          pos = closePos + 1
        } else {
          pos++
        }
      }
    }
  }

  return result
}

function isTightList(tokens: MdToken[], openPos: number, closePos: number): boolean {
  for (let i = openPos + 1; i < closePos; i++) {
    if (tokens[i].type === 'paragraph_open') {
      return tokens[i].hidden
    }
  }
  return false
}

function detectCheckboxState(tokens: MdToken[], openPos: number, closePos: number): boolean {
  for (let i = openPos + 1; i < closePos; i++) {
    if (tokens[i].type === 'inline' && tokens[i].children) {
      for (const child of tokens[i].children) {
        if (child.type === 'html_inline' && child.content.includes('task-list-item-checkbox')) {
          return child.content.includes('checked')
        }
      }
    }
  }
  return false
}

function parseTable(tokens: MdToken[], start: number, end: number): ProseMirrorNode[] {
  const rows: ProseMirrorNode[] = []
  let alignments: (string | null)[] = []
  let isFirstRow = true
  let pos = start

  while (pos < end) {
    const token = tokens[pos]

    if (token.type === 'tr_open') {
      const closePos = findClose(tokens, pos)
      const cells: ProseMirrorNode[] = []
      let cellPos = pos + 1
      let colIndex = 0

      while (cellPos < closePos) {
        const cellToken = tokens[cellPos]

        if (cellToken.type === 'th_open' || cellToken.type === 'td_open') {
          const cellClosePos = findClose(tokens, cellPos)
          const alignment = extractAlignment(cellToken)

          if (isFirstRow) {
            alignments.push(alignment)
          }

          const inlineToken = tokens[cellPos + 1]
          const content = inlineToken && inlineToken.type === 'inline'
            ? parseInline(inlineToken.children || [])
            : []

          const cellAlignment = isFirstRow ? alignment : (alignments[colIndex] ?? null)

          cells.push(markdownSchema.nodes.table_cell.create(
            { alignment: cellAlignment, colspan: 1, rowspan: 1 },
            content
          ))

          colIndex++
          cellPos = cellClosePos + 1
        } else {
          cellPos++
        }
      }

      rows.push(markdownSchema.nodes.table_row.create(null, cells))
      isFirstRow = false
      pos = closePos + 1
    } else {
      pos++
    }
  }

  return rows
}

function extractAlignment(token: MdToken): string | null {
  const style = token.attrGet('style')
  if (style) {
    const match = style.match(/text-align:\s*(\w+)/)
    if (match) return match[1]
  }
  return null
}

function parseInline(tokens: MdToken[]): ProseMirrorNode[] {
  const result: ProseMirrorNode[] = []
  const markStack: ProseMirrorMark[] = []

  for (const token of tokens) {
    switch (token.type) {
      case 'text': {
        if (token.content) {
          result.push(markdownSchema.text(token.content, markStack))
        }
        break
      }

      case 'softbreak': {
        result.push(markdownSchema.text(' ', markStack))
        break
      }

      case 'hardbreak': {
        result.push(markdownSchema.nodes.hard_break.create())
        break
      }

      case 'code_inline': {
        const mark = markdownSchema.marks.code_inline.create()
        result.push(markdownSchema.text(token.content, [...markStack, mark]))
        break
      }

      case 'em_open': {
        markStack.push(markdownSchema.marks.italic.create())
        break
      }

      case 'em_close': {
        markStack.pop()
        break
      }

      case 'strong_open': {
        markStack.push(markdownSchema.marks.bold.create())
        break
      }

      case 'strong_close': {
        markStack.pop()
        break
      }

      case 's_open': {
        markStack.push(markdownSchema.marks.strikethrough.create())
        break
      }

      case 's_close': {
        markStack.pop()
        break
      }

      case 'mark_open': {
        markStack.push(markdownSchema.marks.highlight.create())
        break
      }

      case 'mark_close': {
        markStack.pop()
        break
      }

      case 'link_open': {
        const href = token.attrGet('href') || ''
        const title = token.attrGet('title') || ''
        markStack.push(markdownSchema.marks.link.create({ href, title }))
        break
      }

      case 'link_close': {
        markStack.pop()
        break
      }

      case 'image': {
        const src = token.attrGet('src') || ''
        const alt = extractAltText(token.children)
        const title = token.attrGet('title') || ''
        result.push(markdownSchema.nodes.image.create({ src, alt, title }))
        break
      }

      case 'footnote_ref': {
        const meta = token.meta as Record<string, unknown>
        const label = meta.label ? String(meta.label) : String((Number(meta.id) || 0) + 1)
        result.push(markdownSchema.nodes.footnote_ref.create({ label }))
        break
      }

      case 'html_inline': {
        if (token.content && !token.content.includes('task-list-item-checkbox')) {
          result.push(markdownSchema.text(token.content, markStack))
        }
        break
      }

      default: {
        if (token.content) {
          result.push(markdownSchema.text(token.content, markStack))
        }
      }
    }
  }

  return result
}

function extractAltText(children: MdToken[] | null): string {
  if (!children) return ''
  let alt = ''
  for (const child of children) {
    if (child.type === 'text') {
      alt += child.content
    } else if (child.children) {
      alt += extractAltText(child.children)
    }
  }
  return alt
}
