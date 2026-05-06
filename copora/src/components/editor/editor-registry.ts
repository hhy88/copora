import type { EditorView } from 'prosemirror-view'

let currentView: EditorView | null = null

export function getEditorView(): EditorView | null {
  return currentView
}

export function setEditorView(view: EditorView | null): void {
  currentView = view
}
