import { useFileStore } from '../../stores'
import TabBar from '../tabs/TabBar'
import EditorSwitcher from '../editor/EditorSwitcher'
import './layout.css'

export default function EditorCanvas() {
  const openTabs = useFileStore((s) => s.openTabs)
  const hasOpenFiles = openTabs.length > 0

  return (
    <div className="editor-canvas">
      {hasOpenFiles ? (
        <>
          <TabBar />
          <EditorSwitcher />
        </>
      ) : (
        <div className="welcome-screen">
          <h1>Copora</h1>
          <p>A markdown editor</p>
        </div>
      )}
    </div>
  )
}
