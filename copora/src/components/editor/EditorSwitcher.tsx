import { useEditorStore } from '../../stores'
import WysiwygEditor from './WysiwygEditor'
import SourceEditor from './SourceEditor'
import FloatingToolbar from './FloatingToolbar'
import './editor.css'

export default function EditorSwitcher() {
  const mode = useEditorStore((state) => state.mode)

  const modeLabel = mode === 'wysiwyg'
    ? 'WYSIWYG'
    : mode === 'source'
      ? 'Source'
      : 'Read Only'

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div className="editor-fade" key={mode}>
        {mode === 'wysiwyg' ? <WysiwygEditor /> : <SourceEditor />}
      </div>
      <FloatingToolbar />
      <div className="mode-indicator">{modeLabel}</div>
    </div>
  )
}
