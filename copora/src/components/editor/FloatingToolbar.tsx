import { useState, useEffect, useRef, useCallback } from 'react'
import type { EditorView } from 'prosemirror-view'
import { toggleMark, setBlockType } from 'prosemirror-commands'
import { wrapInList } from 'prosemirror-schema-list'
import { markdownSchema } from '../../engine/markdown'
import { getEditorView } from './editor-registry'
import { useEditorStore } from '../../stores'

function getSelectionRect(): DOMRect | null {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return null
  const range = selection.getRangeAt(0)
  if (range.collapsed) return null
  return range.getBoundingClientRect()
}

function runCommand(fn: (view: EditorView) => void) {
  const view = getEditorView()
  if (!view) return
  fn(view)
  view.focus()
}

const toolbarButtons = [
  {
    label: 'B',
    title: 'Bold',
    command: () => runCommand((view) => {
      toggleMark(markdownSchema.marks.bold)(view.state, (tr) => view.dispatch(tr))
    }),
  },
  {
    label: 'I',
    title: 'Italic',
    command: () => runCommand((view) => {
      toggleMark(markdownSchema.marks.italic)(view.state, (tr) => view.dispatch(tr))
    }),
  },
  {
    label: 'S',
    title: 'Strikethrough',
    command: () => runCommand((view) => {
      toggleMark(markdownSchema.marks.strikethrough)(view.state, (tr) => view.dispatch(tr))
    }),
  },
  {
    label: '🔗',
    title: 'Link',
    command: () => runCommand((view) => {
      const { from, to } = view.state.selection
      const hasLink = view.state.doc.rangeHasMark(from, to, markdownSchema.marks.link)
      if (hasLink) {
        const tr = view.state.tr.removeMark(from, to, markdownSchema.marks.link)
        view.dispatch(tr)
      } else {
        const url = window.prompt('Enter URL:')
        if (url) {
          const linkMark = markdownSchema.marks.link.create({ href: url })
          const tr = view.state.tr.addMark(from, to, linkMark)
          view.dispatch(tr)
        }
      }
    }),
  },
  {
    label: '📷',
    title: 'Image',
    command: () => runCommand((view) => {
      const url = window.prompt('Enter image URL:')
      if (url) {
        const imageNode = markdownSchema.nodes.image.create({ src: url })
        const tr = view.state.tr.replaceSelectionWith(imageNode)
        view.dispatch(tr)
      }
    }),
  },
  {
    label: 'H',
    title: 'Heading',
    command: () => runCommand((view) => {
      const { $from } = view.state.selection
      if ($from.parent.type.name === 'heading') {
        setBlockType(markdownSchema.nodes.paragraph)(view.state, (tr) => view.dispatch(tr))
      } else {
        setBlockType(markdownSchema.nodes.heading, { level: 2 })(view.state, (tr) => view.dispatch(tr))
      }
    }),
  },
  {
    label: 'OL',
    title: 'Ordered List',
    command: () => runCommand((view) => {
      wrapInList(markdownSchema.nodes.ordered_list)(view.state, (tr) => view.dispatch(tr))
    }),
  },
  {
    label: 'UL',
    title: 'Unordered List',
    command: () => runCommand((view) => {
      wrapInList(markdownSchema.nodes.bullet_list)(view.state, (tr) => view.dispatch(tr))
    }),
  },
]

export default function FloatingToolbar() {
  const [selectionVisible, setSelectionVisible] = useState(false)
  const [position, setPosition] = useState({ left: 0, top: 0 })
  const hideTimerRef = useRef<number>(0)
  const mode = useEditorStore((state) => state.mode)

  const updatePosition = useCallback(() => {
    const rect = getSelectionRect()
    if (rect && rect.width > 0) {
      setPosition({
        left: rect.left + rect.width / 2,
        top: rect.top,
      })
      return true
    }
    return false
  }, [])

  useEffect(() => {
    const handleUpdate = () => {
      if (mode !== 'wysiwyg') return
      const view = getEditorView()
      if (!view) return

      const { from, to } = view.state.selection
      const hasSelection = from !== to

      if (hasSelection) {
        clearTimeout(hideTimerRef.current)
        const found = updatePosition()
        if (found) {
          setSelectionVisible(true)
        }
      } else {
        hideTimerRef.current = window.setTimeout(() => setSelectionVisible(false), 300)
      }
    }

    window.addEventListener('pm-update', handleUpdate)
    return () => {
      window.removeEventListener('pm-update', handleUpdate)
      clearTimeout(hideTimerRef.current)
    }
  }, [mode, updatePosition])

  useEffect(() => {
    const handleSelectionChange = () => {
      if (mode !== 'wysiwyg') return
      const view = getEditorView()
      if (!view) return

      const { from, to } = view.state.selection
      if (from === to) {
        hideTimerRef.current = window.setTimeout(() => setSelectionVisible(false), 300)
      }
    }

    document.addEventListener('selectionchange', handleSelectionChange)
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange)
    }
  }, [mode])

  const visible = selectionVisible && mode === 'wysiwyg'

  if (!visible) return null

  return (
    <div
      className="floating-toolbar"
      style={{
        position: 'fixed',
        left: position.left,
        top: position.top,
        transform: 'translate(-50%, -100%)',
      }}
    >
      {toolbarButtons.map((btn) => (
        <button
          key={btn.title}
          title={btn.title}
          onMouseDown={(e) => {
            e.preventDefault()
            btn.command()
          }}
        >
          {btn.label}
        </button>
      ))}
    </div>
  )
}
