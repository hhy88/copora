import {
  Schema,
  type NodeSpec,
  type MarkSpec,
  type AttributeSpec,
} from 'prosemirror-model'

const tableCellAttrs: Record<string, AttributeSpec> = {
  colspan: { default: 1 },
  rowspan: { default: 1 },
  alignment: { default: null },
}

const nodes: Record<string, NodeSpec> = {
  doc: {
    content: 'block+',
  },

  paragraph: {
    content: 'inline*',
    group: 'block',
    parseDOM: [{ tag: 'p' }],
    toDOM() {
      return ['p', 0]
    },
  },

  heading: {
    attrs: { level: { default: 1, validate: 'number' } },
    content: 'inline*',
    group: 'block',
    defining: true,
    parseDOM: [1, 2, 3, 4, 5, 6].map((level) => ({
      tag: `h${level}`,
      attrs: { level },
    })),
    toDOM(node) {
      return [`h${node.attrs.level}`, 0]
    },
  },

  blockquote: {
    content: 'block+',
    group: 'block',
    defining: true,
    parseDOM: [{ tag: 'blockquote' }],
    toDOM() {
      return ['blockquote', 0]
    },
  },

  ordered_list: {
    content: 'list_item+',
    group: 'block',
    attrs: { order: { default: 1, validate: 'number' }, tight: { default: false } },
    parseDOM: [
      {
        tag: 'ol',
        getAttrs(dom: HTMLElement) {
          return {
            order: dom.hasAttribute('start') ? Number(dom.getAttribute('start')) : 1,
            tight: dom.hasAttribute('data-tight'),
          }
        },
      },
    ],
    toDOM(node) {
      const attrs: Record<string, string> = {}
      if (node.attrs.order !== 1) attrs.start = String(node.attrs.order)
      if (node.attrs.tight) attrs['data-tight'] = 'true'
      return ['ol', attrs, 0]
    },
  },

  bullet_list: {
    content: 'list_item+',
    group: 'block',
    attrs: { tight: { default: false } },
    parseDOM: [
      {
        tag: 'ul',
        getAttrs(dom: HTMLElement) {
          return { tight: dom.hasAttribute('data-tight') }
        },
      },
    ],
    toDOM(node) {
      return ['ul', node.attrs.tight ? { 'data-tight': 'true' } : {}, 0]
    },
  },

  list_item: {
    content: 'paragraph block*',
    group: 'block',
    parseDOM: [{ tag: 'li' }],
    toDOM() {
      return ['li', 0]
    },
    defining: true,
  },

  task_list_item: {
    content: 'paragraph block*',
    group: 'block',
    attrs: { checked: { default: false, validate: 'boolean' } },
    parseDOM: [
      {
        tag: 'li[data-type="task_item"]',
        getAttrs(dom: HTMLElement) {
          return { checked: dom.getAttribute('data-checked') === 'true' }
        },
      },
    ],
    toDOM(node) {
      return ['li', { 'data-type': 'task_item', 'data-checked': String(node.attrs.checked) }, 0]
    },
    defining: true,
  },

  code_block: {
    content: 'text*',
    group: 'block',
    attrs: { language: { default: '' } },
    code: true,
    defining: true,
    parseDOM: [
      {
        tag: 'pre',
        preserveWhitespace: 'full' as const,
        getAttrs(dom: HTMLElement) {
          const code = dom.querySelector('code')
          if (!code) return { language: '' }
          const cls = code.className || ''
          const match = cls.match(/language-(\S+)/)
          return { language: match ? match[1] : '' }
        },
      },
    ],
    toDOM(node) {
      const codeAttrs: Record<string, string> = {}
      if (node.attrs.language) codeAttrs.class = `language-${node.attrs.language}`
      return ['pre', ['code', codeAttrs, 0]]
    },
  },

  math_block: {
    content: 'text*',
    group: 'block',
    attrs: { source: { default: '' } },
    code: true,
    defining: true,
    parseDOM: [{ tag: 'div[data-type="math_block"]' }],
    toDOM(node) {
      return ['div', { 'data-type': 'math_block' }, node.attrs.source]
    },
  },

  mermaid_block: {
    content: 'text*',
    group: 'block',
    attrs: { source: { default: '' } },
    code: true,
    defining: true,
    parseDOM: [{ tag: 'div[data-type="mermaid_block"]' }],
    toDOM(node) {
      return ['div', { 'data-type': 'mermaid_block' }, node.attrs.source]
    },
  },

  table: {
    content: 'table_row+',
    group: 'block',
    tableRole: 'table',
    isolating: true,
    parseDOM: [{ tag: 'table' }],
    toDOM() {
      return ['table', ['tbody', 0]]
    },
  },

  table_row: {
    content: 'table_cell+',
    tableRole: 'row',
    parseDOM: [{ tag: 'tr' }],
    toDOM() {
      return ['tr', 0]
    },
  },

  table_cell: {
    content: 'inline*',
    attrs: tableCellAttrs,
    tableRole: 'cell',
    isolating: true,
    parseDOM: [
      {
        tag: 'td',
        getAttrs(dom: HTMLElement) {
          return {
            colspan: Number(dom.getAttribute('colspan') || 1),
            rowspan: Number(dom.getAttribute('rowspan') || 1),
            alignment: dom.style.textAlign || null,
          }
        },
      },
    ],
    toDOM(node) {
      const attrs: Record<string, string> = {}
      if (node.attrs.colspan !== 1) attrs.colspan = String(node.attrs.colspan)
      if (node.attrs.rowspan !== 1) attrs.rowspan = String(node.attrs.rowspan)
      if (node.attrs.alignment) attrs.style = `text-align: ${node.attrs.alignment}`
      return ['td', attrs, 0]
    },
  },

  horizontal_rule: {
    group: 'block',
    parseDOM: [{ tag: 'hr' }],
    toDOM() {
      return ['hr']
    },
  },

  image: {
    inline: true,
    attrs: {
      src: { default: '' },
      alt: { default: '' },
      title: { default: '' },
    },
    group: 'inline',
    draggable: true,
    parseDOM: [
      {
        tag: 'img[src]',
        getAttrs(dom: HTMLElement) {
          return {
            src: dom.getAttribute('src') || '',
            alt: dom.getAttribute('alt') || '',
            title: dom.getAttribute('title') || '',
          }
        },
      },
    ],
    toDOM(node) {
      return ['img', { src: node.attrs.src, alt: node.attrs.alt, title: node.attrs.title }]
    },
  },

  footnote_ref: {
    inline: true,
    group: 'inline',
    attrs: { label: { default: '' } },
    parseDOM: [{ tag: 'sup[data-type="footnote_ref"]' }],
    toDOM(node) {
      return ['sup', { 'data-type': 'footnote_ref' }, node.attrs.label]
    },
  },

  footnote_block: {
    content: 'block+',
    group: 'block',
    defining: true,
    parseDOM: [{ tag: 'section[data-type="footnote_block"]' }],
    toDOM() {
      return ['section', { 'data-type': 'footnote_block' }, 0]
    },
  },

  alert_block: {
    content: 'block+',
    group: 'block',
    attrs: { alertType: { default: 'info' } },
    defining: true,
    parseDOM: [
      {
        tag: 'div[data-type="alert_block"]',
        getAttrs(dom: HTMLElement) {
          return { alertType: dom.getAttribute('data-alert-type') || 'info' }
        },
      },
    ],
    toDOM(node) {
      return ['div', { 'data-type': 'alert_block', 'data-alert-type': node.attrs.alertType }, 0]
    },
  },

  html_block: {
    content: 'text*',
    group: 'block',
    code: true,
    defining: true,
    parseDOM: [{ tag: 'div[data-type="html_block"]' }],
    toDOM(node) {
      return ['div', { 'data-type': 'html_block' }, node.textContent || '']
    },
  },

  text: {
    group: 'inline',
  },

  hard_break: {
    inline: true,
    group: 'inline',
    selectable: false,
    parseDOM: [{ tag: 'br' }],
    toDOM() {
      return ['br']
    },
  },
}

const marks: Record<string, MarkSpec> = {
  bold: {
    parseDOM: [
      { tag: 'strong' },
      { tag: 'b' },
      { style: 'font-weight=bold' },
      { style: 'font-weight=700' },
    ],
    toDOM() {
      return ['strong', 0]
    },
  },

  italic: {
    parseDOM: [{ tag: 'em' }, { tag: 'i' }, { style: 'font-style=italic' }],
    toDOM() {
      return ['em', 0]
    },
  },

  strikethrough: {
    parseDOM: [{ tag: 's' }, { tag: 'del' }, { tag: 'strike' }, { style: 'text-decoration=line-through' }],
    toDOM() {
      return ['s', 0]
    },
  },

  highlight: {
    parseDOM: [{ tag: 'mark' }],
    toDOM() {
      return ['mark', 0]
    },
  },

  code_inline: {
    parseDOM: [{ tag: 'code' }],
    toDOM() {
      return ['code', 0]
    },
  },

  link: {
    attrs: {
      href: { default: '' },
      title: { default: '' },
    },
    inclusive: false,
    parseDOM: [
      {
        tag: 'a[href]',
        getAttrs(dom: HTMLElement) {
          return {
            href: dom.getAttribute('href') || '',
            title: dom.getAttribute('title') || '',
          }
        },
      },
    ],
    toDOM(mark) {
      const attrs: Record<string, string> = { href: mark.attrs.href }
      if (mark.attrs.title) attrs.title = mark.attrs.title
      return ['a', attrs, 0]
    },
  },

  subscript: {
    parseDOM: [{ tag: 'sub' }],
    toDOM() {
      return ['sub', 0]
    },
  },

  superscript: {
    parseDOM: [{ tag: 'sup' }],
    toDOM() {
      return ['sup', 0]
    },
  },

  kbd: {
    parseDOM: [{ tag: 'kbd' }],
    toDOM() {
      return ['kbd', 0]
    },
  },

  math_inline: {
    parseDOM: [{ tag: 'span[data-type="math_inline"]' }],
    toDOM(mark) {
      return ['span', { 'data-type': 'math_inline' }, mark.attrs.source || '']
    },
    attrs: { source: { default: '' } },
    inclusive: true,
  },

  underline: {
    parseDOM: [{ tag: 'u' }, { style: 'text-decoration=underline' }],
    toDOM() {
      return ['u', 0]
    },
  },
}

export const markdownSchema = new Schema({ nodes, marks })
