import { useEditorStore } from '../../stores'
import './layout.css'

export function StatusBar() {
  const cursorLine = useEditorStore((s) => s.cursorLine)
  const cursorCol = useEditorStore((s) => s.cursorCol)
  const encoding = useEditorStore((s) => s.encoding)
  const lineEnding = useEditorStore((s) => s.lineEnding)
  const isReadOnly = useEditorStore((s) => s.isReadOnly)
  const wordStats = useEditorStore((s) => s.wordStats)

  return (
    <div className="status-bar">
      <div className="status-bar-left">
        <span className="status-bar-item" title="Cursor position">
          行 {cursorLine}, 列 {cursorCol}
        </span>
      </div>
      <div className="status-bar-center">
        <span className="status-bar-item" title="File encoding">
          {encoding}
        </span>
        <span className="status-bar-item" title="Line ending">
          {lineEnding}
        </span>
      </div>
      <div className="status-bar-right">
        <span className="status-bar-item" title="Character count">
          {wordStats.totalChars} 字符
        </span>
        {isReadOnly && (
          <span className="status-bar-item" title="Read only">
            只读
          </span>
        )}
      </div>
    </div>
  )
}
