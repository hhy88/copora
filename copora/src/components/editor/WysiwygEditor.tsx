import { useRef, useEffect } from 'react'
import { EditorView } from 'prosemirror-view'
import { EditorState } from 'prosemirror-state'
import type { Transaction } from 'prosemirror-state'
import { markdownSchema, parseMarkdown, serializeMarkdown } from '../../engine/markdown'
import { inputRules, InputRule, wrappingInputRule, textblockTypeInputRule, undoInputRule } from 'prosemirror-inputrules'
import { keymap } from 'prosemirror-keymap'
import { baseKeymap, toggleMark, setBlockType, wrapIn, chainCommands, createParagraphNear, liftEmptyBlock, selectParentNode } from 'prosemirror-commands'
import { history, undo, redo } from 'prosemirror-history'
import { gapCursor } from 'prosemirror-gapcursor'
import { tableEditing } from 'prosemirror-tables'
import { wrapInList, splitListItem, liftListItem, sinkListItem } from 'prosemirror-schema-list'
import { useFileStore } from '../../stores'
import { setEditorView } from './editor-registry'

function buildInputRules() {
  const rules: InputRule[] = []

  rules.push(textblockTypeInputRule(
    /^(#{1,6})\s$/,
    markdownSchema.nodes.heading,
    (match) => ({ level: match[1].length })
  ))

  rules.push(wrappingInputRule(
    /^>\s$/,
    markdownSchema.nodes.blockquote
  ))

  rules.push(wrappingInputRule(
    /^(\d+)\.\s$/,
    markdownSchema.nodes.ordered_list,
    (match) => ({ order: +match[1] }),
    (match, node) => node.attrs.order === +match[1]
  ))

  rules.push(wrappingInputRule(
    /^[-*]\s$/,
    markdownSchema.nodes.bullet_list
  ))

  rules.push(new InputRule(
    /^(---|___|\*\*\*)$/,
    (state, _match, start, end) => {
      return state.tr.replaceWith(start, end, markdownSchema.nodes.horizontal_rule.create())
    }
  ))

  rules.push(new InputRule(
    /\*\*(.+?)\*\*$/,
    (state, match, start, end) => {
      const text = match[1]
      const tr = state.tr.insertText(text, start, end)
      tr.addMark(start, start + text.length, markdownSchema.marks.bold.create())
      return tr
    }
  ))

  rules.push(new InputRule(
    /\*([^*]+?)\*$/,
    (state, match, start, end) => {
      const text = match[1]
      const tr = state.tr.insertText(text, start, end)
      tr.addMark(start, start + text.length, markdownSchema.marks.italic.create())
      return tr
    }
  ))

  rules.push(new InputRule(
    /`([^`]+?)`$/,
    (state, match, start, end) => {
      const text = match[1]
      const tr = state.tr.insertText(text, start, end)
      tr.addMark(start, start + text.length, markdownSchema.marks.code_inline.create())
      return tr
    }
  ))

  return rules
}

function buildKeymap() {
  const keys: Record<string, ReturnType<typeof toggleMark>> = {}

  keys['Mod-b'] = toggleMark(markdownSchema.marks.bold)
  keys['Mod-i'] = toggleMark(markdownSchema.marks.italic)
  keys['Mod-Shift-s'] = toggleMark(markdownSchema.marks.strikethrough)
  keys['Mod-`'] = toggleMark(markdownSchema.marks.code_inline)
  keys['Mod-Shift-7'] = wrapInList(markdownSchema.nodes.ordered_list)
  keys['Mod-Shift-8'] = wrapInList(markdownSchema.nodes.bullet_list)
  keys['Mod-Shift-9'] = wrapIn(markdownSchema.nodes.blockquote)
  keys['Mod-Shift-h'] = setBlockType(markdownSchema.nodes.heading, { level: 2 })
  keys['Enter'] = chainCommands(splitListItem(markdownSchema.nodes.list_item), createParagraphNear, liftEmptyBlock)
  keys['Mod-z'] = undo
  keys['Mod-Shift-z'] = redo
  keys['Backspace'] = chainCommands(undoInputRule, selectParentNode)
  keys['Escape'] = selectParentNode
  keys['Tab'] = sinkListItem(markdownSchema.nodes.list_item)
  keys['Shift-Tab'] = liftListItem(markdownSchema.nodes.list_item)

  return keys
}

export default function WysiwygEditor() {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const lastSerializedRef = useRef<string>('')

  useEffect(() => {
    if (!containerRef.current) return

    const { content } = useFileStore.getState()
    const doc = parseMarkdown(content)
    lastSerializedRef.current = content

    const state = EditorState.create({
      doc,
      plugins: [
        inputRules({ rules: buildInputRules() }),
        keymap(buildKeymap()),
        keymap(baseKeymap),
        history(),
        gapCursor(),
        tableEditing(),
      ],
    })

    const view = new EditorView(containerRef.current, {
      state,
      dispatchTransaction: (tr: Transaction) => {
        const newState = view.state.apply(tr)
        view.updateState(newState)
        if (tr.docChanged) {
          const md = serializeMarkdown(newState.doc)
          lastSerializedRef.current = md
          useFileStore.getState().updateContent(md)
        }
        window.dispatchEvent(new CustomEvent('pm-update'))
      },
      handleDOMEvents: {
        focus: () => {
          return false
        },
        blur: () => {
          return false
        },
      },
      attributes: {
        class: 'md-render',
      },
    })

    viewRef.current = view
    setEditorView(view)

    const unsubscribeFileStore = useFileStore.subscribe((state, prevState) => {
      if (state.content !== prevState.content && state.content !== lastSerializedRef.current) {
        if (!viewRef.current) return
        const newDoc = parseMarkdown(state.content)
        const newState = EditorState.create({ doc: newDoc, plugins: viewRef.current.state.plugins })
        viewRef.current.updateState(newState)
        lastSerializedRef.current = state.content
      }
    })

    return () => {
      unsubscribeFileStore()
      view.destroy()
      viewRef.current = null
      setEditorView(null)
    }
  }, [])

  return (
    <div className="editor-container">
      <div className="editor-inner" ref={containerRef} />
    </div>
  )
}
