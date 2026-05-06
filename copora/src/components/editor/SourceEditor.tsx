import { useRef, useEffect } from 'react'
import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view'
import type { ViewUpdate } from '@codemirror/view'
import { EditorState, Compartment } from '@codemirror/state'
import { markdown } from '@codemirror/lang-markdown'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { search, highlightSelectionMatches } from '@codemirror/search'
import { bracketMatching, indentOnInput } from '@codemirror/language'
import { useFileStore, useEditorStore, useSettingsStore } from '../../stores'

const lineNumberCompartment = new Compartment()
const readOnlyCompartment = new Compartment()

const editorTheme = EditorView.theme({
  '&': {
    height: '100%',
    backgroundColor: 'var(--bg-primary)',
  },
  '.cm-scroller': {
    overflow: 'auto',
    fontFamily: 'var(--font-family-mono)',
  },
  '.cm-content': {
    fontFamily: 'var(--font-family-mono)',
    fontSize: 'var(--font-size-base)',
    lineHeight: 'var(--line-height)',
    color: 'var(--text-primary)',
    caretColor: 'var(--text-primary)',
  },
  '.cm-gutters': {
    backgroundColor: 'var(--bg-primary)',
    borderRight: '1px solid var(--border-color)',
    color: 'var(--text-tertiary)',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-secondary)',
  },
  '&.cm-focused': {
    outline: 'none',
  },
  '.cm-activeLine': {
    backgroundColor: 'var(--bg-secondary)',
  },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
    backgroundColor: 'var(--selection-bg) !important',
  },
  '.cm-cursor': {
    borderLeftColor: 'var(--text-primary)',
  },
  '.cm-matchingBracket': {
    backgroundColor: 'var(--accent-color)',
    color: 'var(--bg-primary)',
  },
})

export default function SourceEditor() {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const lastContentRef = useRef<string>('')

  useEffect(() => {
    if (!containerRef.current) return

    const { content } = useFileStore.getState()
    const { isReadOnly } = useEditorStore.getState()
    const { showLineNumber } = useSettingsStore.getState()
    lastContentRef.current = content

    const state = EditorState.create({
      doc: content,
      extensions: [
        markdown(),
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
        history(),
        search(),
        highlightSelectionMatches(),
        bracketMatching(),
        indentOnInput(),
        lineNumberCompartment.of(showLineNumber ? lineNumbers() : []),
        highlightActiveLine(),
        readOnlyCompartment.of(EditorState.readOnly.of(isReadOnly)),
        editorTheme,
        EditorView.updateListener.of((update: ViewUpdate) => {
          if (update.docChanged) {
            const newContent = update.state.doc.toString()
            lastContentRef.current = newContent
            useFileStore.getState().updateContent(newContent)
          }
          const pos = update.state.selection.main.head
          const line = update.state.doc.lineAt(pos)
          useEditorStore.getState().setCursorPosition(line.number, pos - line.from + 1)
        }),
        EditorView.lineWrapping,
      ],
    })

    const view = new EditorView({
      state,
      parent: containerRef.current,
    })

    viewRef.current = view

    const unsubscribeFileStore = useFileStore.subscribe((state, prevState) => {
      if (state.content !== prevState.content && state.content !== lastContentRef.current) {
        if (!viewRef.current) return
        viewRef.current.dispatch({
          changes: { from: 0, to: viewRef.current.state.doc.length, insert: state.content },
        })
        lastContentRef.current = state.content
      }
    })

    const unsubscribeEditorStore = useEditorStore.subscribe((state, prevState) => {
      if (state.isReadOnly !== prevState.isReadOnly && viewRef.current) {
        viewRef.current.dispatch({
          effects: readOnlyCompartment.reconfigure(EditorState.readOnly.of(state.isReadOnly)),
        })
      }
    })

    const unsubscribeSettingsStore = useSettingsStore.subscribe((state, prevState) => {
      if (state.showLineNumber !== prevState.showLineNumber && viewRef.current) {
        viewRef.current.dispatch({
          effects: lineNumberCompartment.reconfigure(state.showLineNumber ? lineNumbers() : []),
        })
      }
    })

    return () => {
      unsubscribeFileStore()
      unsubscribeEditorStore()
      unsubscribeSettingsStore()
      view.destroy()
      viewRef.current = null
    }
  }, [])

  return (
    <div className="editor-container source-editor">
      <div className="editor-inner" ref={containerRef} />
    </div>
  )
}
