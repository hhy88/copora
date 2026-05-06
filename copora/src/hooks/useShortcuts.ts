import { useEffect } from 'react'
import { useFileStore, useEditorStore, useAppStore } from '../stores'
import { FileService } from '../services/file-service'
import { isMac } from '../utils/platform-utils'
import { generateId } from '../utils/string-utils'
import { getEditorView } from '../components/editor/editor-registry'
import { toggleMark } from 'prosemirror-commands'
import { markdownSchema } from '../engine/markdown'

function isMetaOrCtrl(e: KeyboardEvent): boolean {
  return isMac() ? e.metaKey : e.ctrlKey
}

export function useShortcuts(): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const meta = isMetaOrCtrl(e)

      if (meta && !e.shiftKey && e.key === 'n') {
        e.preventDefault()
        const id = generateId()
        const tab = {
          id,
          filePath: `untitled-${id.slice(0, 8)}.md`,
          fileName: `untitled-${id.slice(0, 8)}.md`,
          isModified: false,
          isPinned: false,
        }
        useFileStore.getState().openFile(tab)
        useFileStore.getState().updateContent('')
        return
      }

      if (meta && !e.shiftKey && e.key === 'o') {
        e.preventDefault()
        FileService.openFile().then((result) => {
          if (result) {
            const id = generateId()
            useFileStore.getState().openFile({
              id,
              filePath: result.path,
              fileName: result.name,
              isModified: false,
              isPinned: false,
            })
            useFileStore.getState().updateContent(result.content)
            useFileStore.getState().addRecentFile(result.path, result.name)
          }
        })
        return
      }

      if (meta && !e.shiftKey && e.key === 's') {
        e.preventDefault()
        const { content, activeTabId, openTabs } = useFileStore.getState()
        const activeTab = openTabs.find((t) => t.id === activeTabId)
        if (activeTab) {
          FileService.saveFile(activeTab.filePath, content).then(() => {
            useFileStore.getState().markModified(activeTab.id, false)
          })
        }
        return
      }

      if (meta && e.shiftKey && e.key === 'S') {
        e.preventDefault()
        const { content } = useFileStore.getState()
        FileService.saveFileAs(content, 'untitled.md')
        return
      }

      if (meta && !e.shiftKey && e.key === 'w') {
        e.preventDefault()
        const { activeTabId } = useFileStore.getState()
        if (activeTabId) {
          useFileStore.getState().closeTab(activeTabId)
        }
        return
      }

      if (meta && !e.shiftKey && e.key === 'b') {
        e.preventDefault()
        const view = getEditorView()
        if (view) {
          toggleMark(markdownSchema.marks.bold)(view.state, (tr) => view.dispatch(tr))
          view.focus()
        }
        return
      }

      if (meta && !e.shiftKey && e.key === 'i') {
        e.preventDefault()
        const view = getEditorView()
        if (view) {
          toggleMark(markdownSchema.marks.italic)(view.state, (tr) => view.dispatch(tr))
          view.focus()
        }
        return
      }

      if (meta && !e.shiftKey && e.key === 'k') {
        e.preventDefault()
        const view = getEditorView()
        if (view) {
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
          view.focus()
        }
        return
      }

      if (meta && !e.shiftKey && e.key === 'f') {
        e.preventDefault()
        useEditorStore.getState().toggleFindReplace()
        return
      }

      if (meta && !e.shiftKey && e.key === 'h') {
        e.preventDefault()
        useEditorStore.getState().setFindReplace({ visible: true })
        return
      }

      if (meta && e.key === '/') {
        e.preventDefault()
        const { mode } = useEditorStore.getState()
        useEditorStore.getState().setMode(mode === 'source' ? 'wysiwyg' : 'source')
        return
      }

      if (meta && e.key === ',') {
        e.preventDefault()
        useAppStore.getState().showModal('settings')
        return
      }

      if (meta && !e.shiftKey && e.key === 'z') {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('editor-undo'))
        return
      }

      if (meta && e.key === 'y') {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('editor-redo'))
        return
      }

      if (meta && e.shiftKey && e.key === 'Z') {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('editor-redo'))
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])
}
