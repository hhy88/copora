import type { Node as ProseMirrorNode, Mark as ProseMirrorMark } from 'prosemirror-model'

class SerializerState {
  out: string = ''
  prefix: string = ''
  atLineStart: boolean = true
  inTightList: boolean = false

  write(text: string): void {
    if (this.atLineStart && text.length > 0 && this.prefix) {
      this.out += this.prefix
    }
    this.out += text
    this.atLineStart = false
  }

  newline(): void {
    this.out += '\n'
    this.atLineStart = true
  }

  blankLine(): void {
    if (!this.atLineStart) {
      this.out += '\n'
    }
    this.out += '\n'
    this.atLineStart = true
  }

  addPrefix(p: string): void {
    this.prefix += p
  }

  removePrefix(len: number): void {
    this.prefix = this.prefix.slice(0, -len)
  }

  serializeContent(parent: ProseMirrorNode): void {
    parent.forEach(child => this.serializeNode(child))
  }

  serializeInline(parent: ProseMirrorNode): void {
    let activeMarks: ProseMirrorMark[] = []

    parent.forEach(child => {
      const marks = [...child.marks]
      let commonLen = 0
      while (
        commonLen < activeMarks.length &&
        commonLen < marks.length &&
        activeMarks[commonLen].eq(marks[commonLen])
      ) {
        commonLen++
      }

      for (let i = activeMarks.length - 1; i >= commonLen; i--) {
        this.write(markClose(activeMarks[i]))
      }

      for (let i = commonLen; i < marks.length; i++) {
        this.write(markOpen(marks[i]))
      }

      activeMarks = marks

      if (child.isText && child.text) {
        this.write(child.text)
      } else {
        this.serializeNode(child)
      }
    })

    for (let i = activeMarks.length - 1; i >= 0; i--) {
      this.write(markClose(activeMarks[i]))
    }
  }

  serializeNode(node: ProseMirrorNode): void {
    const ser = nodeSerializers[node.type.name]
    if (ser) ser(this, node)
  }
}

function markOpen(mark: ProseMirrorMark): string {
  switch (mark.type.name) {
    case 'bold': return '**'
    case 'italic': return '*'
    case 'strikethrough': return '~~'
    case 'highlight': return '=='
    case 'code_inline': return '`'
    case 'link': return '['
    case 'subscript': return '<sub>'
    case 'superscript': return '<sup>'
    case 'kbd': return '<kbd>'
    case 'math_inline': return '$'
    case 'underline': return '<u>'
    default: return ''
  }
}

function markClose(mark: ProseMirrorMark): string {
  switch (mark.type.name) {
    case 'bold': return '**'
    case 'italic': return '*'
    case 'strikethrough': return '~~'
    case 'highlight': return '=='
    case 'code_inline': return '`'
    case 'link': {
      let s = '](' + mark.attrs.href
      if (mark.attrs.title) s += ' "' + mark.attrs.title + '"'
      s += ')'
      return s
    }
    case 'subscript': return '</sub>'
    case 'superscript': return '</sup>'
    case 'kbd': return '</kbd>'
    case 'math_inline': return '$'
    case 'underline': return '</u>'
    default: return ''
  }
}

const nodeSerializers: Record<string, (state: SerializerState, node: ProseMirrorNode) => void> = {
  doc(state, node) {
    state.serializeContent(node)
  },

  paragraph(state, node) {
    state.serializeInline(node)
    state.newline()
    if (!state.inTightList) {
      state.blankLine()
    }
  },

  heading(state, node) {
    state.write('#'.repeat(node.attrs.level as number) + ' ')
    state.serializeInline(node)
    state.newline()
    state.blankLine()
  },

  blockquote(state, node) {
    state.addPrefix('> ')
    state.serializeContent(node)
    state.removePrefix(2)
    state.blankLine()
  },

  ordered_list(state, node) {
    const tight = node.attrs.tight as boolean
    const oldTight = state.inTightList
    state.inTightList = tight
    let idx = (node.attrs.order as number) || 1
    node.forEach(child => {
      const marker = String(idx) + '. '
      state.write(marker)
      state.addPrefix(' '.repeat(marker.length))
      state.serializeContent(child)
      state.removePrefix(marker.length)
      idx++
    })
    state.inTightList = oldTight
    state.blankLine()
  },

  bullet_list(state, node) {
    const tight = node.attrs.tight as boolean
    const oldTight = state.inTightList
    state.inTightList = tight
    node.forEach(child => {
      const isTask = child.type.name === 'task_list_item'
      if (isTask) {
        const checked = child.attrs.checked as boolean
        state.write('- [' + (checked ? 'x' : ' ') + '] ')
        state.addPrefix('    ')
      } else {
        state.write('- ')
        state.addPrefix('  ')
      }
      state.serializeContent(child)
      state.removePrefix(isTask ? 4 : 2)
    })
    state.inTightList = oldTight
    state.blankLine()
  },

  list_item() {},

  task_list_item() {},

  code_block(state, node) {
    const lang = (node.attrs.language as string) || ''
    const text = node.textContent
    const fenceLen = computeFenceLen(text)
    const fence = '`'.repeat(fenceLen)
    state.write(fence + lang)
    state.newline()
    state.write(text)
    state.newline()
    state.write(fence)
    state.newline()
    state.blankLine()
  },

  math_block(state, node) {
    const src = (node.attrs.source as string) || node.textContent
    state.write('```math')
    state.newline()
    state.write(src)
    state.newline()
    state.write('```')
    state.newline()
    state.blankLine()
  },

  mermaid_block(state, node) {
    const src = (node.attrs.source as string) || node.textContent
    state.write('```mermaid')
    state.newline()
    state.write(src)
    state.newline()
    state.write('```')
    state.newline()
    state.blankLine()
  },

  table(state, node) {
    serializeTable(state, node)
    state.blankLine()
  },

  table_row() {},

  table_cell() {},

  horizontal_rule(state) {
    state.write('---')
    state.newline()
    state.blankLine()
  },

  image(state, node) {
    const alt = node.attrs.alt as string
    const src = node.attrs.src as string
    const title = node.attrs.title as string
    state.write('![' + alt + '](' + src)
    if (title) state.write(' "' + title + '"')
    state.write(')')
  },

  footnote_ref(state, node) {
    state.write('[^' + (node.attrs.label as string) + ']')
  },

  footnote_block() {},

  alert_block(state, node) {
    const alertType = ((node.attrs.alertType as string) || 'info').toUpperCase()
    state.addPrefix('> ')
    state.write('[!' + alertType + ']')
    state.newline()
    state.serializeContent(node)
    state.removePrefix(2)
    state.blankLine()
  },

  html_block(state, node) {
    state.write(node.textContent || '')
    state.newline()
    state.blankLine()
  },

  text(state, node) {
    if (node.text) state.write(node.text)
  },

  hard_break(state) {
    state.write('  ')
    state.newline()
  },
}

function computeFenceLen(text: string): number {
  let maxLen = 3
  for (const line of text.split('\n')) {
    const m = line.match(/^`{3,}/)
    if (m) maxLen = Math.max(maxLen, m[0].length + 1)
  }
  return maxLen
}

function serializeTable(state: SerializerState, node: ProseMirrorNode): void {
  const rows: ProseMirrorNode[] = []
  node.forEach(row => rows.push(row))
  if (rows.length === 0) return

  const alignments: (string | null)[] = []
  const cellTexts: string[][] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowTexts: string[] = []
    for (let j = 0; j < row.childCount; j++) {
      const cell = row.child(j)
      if (i === 0) {
        alignments.push((cell.attrs.alignment as string) || null)
      }
      const inner = new SerializerState()
      inner.serializeInline(cell)
      rowTexts.push(inner.out.replace(/\n/g, ' ').trim())
    }
    cellTexts.push(rowTexts)
  }

  const colCount = rows[0].childCount

  state.write('|')
  for (let j = 0; j < colCount; j++) {
    state.write(' ' + (cellTexts[0][j] || '') + ' |')
  }
  state.newline()

  state.write('|')
  for (let j = 0; j < colCount; j++) {
    const a = alignments[j]
    if (a === 'center') state.write(':---:|')
    else if (a === 'right') state.write('---:|')
    else if (a === 'left') state.write(':---|')
    else state.write('---|')
  }
  state.newline()

  for (let i = 1; i < rows.length; i++) {
    state.write('|')
    for (let j = 0; j < colCount; j++) {
      state.write(' ' + (cellTexts[i][j] || '') + ' |')
    }
    state.newline()
  }
}

export function serializeMarkdown(doc: ProseMirrorNode): string {
  const state = new SerializerState()

  const footnoteLabels: string[] = []
  let footnoteBlock: ProseMirrorNode | null = null

  doc.descendants(node => {
    if (node.type.name === 'footnote_ref') {
      const label = node.attrs.label as string
      if (!footnoteLabels.includes(label)) footnoteLabels.push(label)
    }
    if (node.type.name === 'footnote_block' && !footnoteBlock) {
      footnoteBlock = node
    }
  })

  state.serializeContent(doc)

  if (footnoteBlock && footnoteLabels.length > 0) {
    let idx = 0
    footnoteBlock.forEach(block => {
      if (idx < footnoteLabels.length) {
        state.write('[^' + footnoteLabels[idx] + ']: ')
        const inner = new SerializerState()
        inner.serializeInline(block)
        state.write(inner.out.trim())
        state.newline()
        idx++
      }
    })
  }

  return state.out.replace(/\n+$/, '') + '\n'
}
