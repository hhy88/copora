import { useCallback, useRef, useEffect, useState } from 'react'
import { useAppStore } from '../../stores/app-store'
import FileTree from './FileTree'
import Outline from './Outline'
import SearchPanel from './SearchPanel'
import './sidebar.css'

const MIN_WIDTH = 200
const MAX_WIDTH = 500

const tabs = [
  { key: 'files' as const, label: '文件', icon: '📁' },
  { key: 'outline' as const, label: '大纲', icon: '📑' },
  { key: 'search' as const, label: '搜索', icon: '🔍' },
]

export default function SidePanel() {
  const sidePanelVisible = useAppStore((s) => s.sidePanelVisible)
  const sidePanelWidth = useAppStore((s) => s.sidePanelWidth)
  const sidePanelTab = useAppStore((s) => s.sidePanelTab)
  const toggleSidePanel = useAppStore((s) => s.toggleSidePanel)
  const setSidePanelWidth = useAppStore((s) => s.setSidePanelWidth)
  const setSidePanelTab = useAppStore((s) => s.setSidePanelTab)

  const [isResizing, setIsResizing] = useState(false)
  const resizeRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setIsResizing(true)

      const startX = e.clientX
      const startWidth = sidePanelWidth

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const delta = moveEvent.clientX - startX
        const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth + delta))
        setSidePanelWidth(newWidth)
      }

      const handleMouseUp = () => {
        setIsResizing(false)
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    },
    [sidePanelWidth, setSidePanelWidth]
  )

  useEffect(() => {
    if (resizeRef.current) {
      resizeRef.current.classList.toggle('dragging', isResizing)
    }
  }, [isResizing])

  const handleCollapsedIconClick = useCallback(
    (tab: 'files' | 'outline' | 'search') => {
      setSidePanelTab(tab)
      if (!sidePanelVisible) {
        toggleSidePanel()
      }
    },
    [sidePanelVisible, toggleSidePanel, setSidePanelTab]
  )

  if (!sidePanelVisible) {
    return (
      <div className="side-panel collapsed" style={{ width: 40 }}>
        <div className="side-panel-collapsed-strip">
          {tabs.map((tab) => (
            <div
              key={tab.key}
              className="side-panel-collapsed-icon"
              onClick={() => handleCollapsedIconClick(tab.key)}
              title={tab.label}
            >
              {tab.icon}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderContent = () => {
    switch (sidePanelTab) {
      case 'files':
        return <FileTree />
      case 'outline':
        return <Outline />
      case 'search':
        return <SearchPanel />
    }
  }

  return (
    <div className="side-panel" style={{ width: sidePanelWidth }}>
      <div className="side-panel-content">
        <div className="side-panel-tabs">
          {tabs.map((tab) => (
            <div
              key={tab.key}
              className={`side-panel-tab${sidePanelTab === tab.key ? ' active' : ''}`}
              onClick={() => setSidePanelTab(tab.key)}
            >
              {tab.label}
            </div>
          ))}
        </div>
        {renderContent()}
      </div>
      <div
        ref={resizeRef}
        className={`resize-handle${isResizing ? ' dragging' : ''}`}
        onMouseDown={handleMouseDown}
      />
    </div>
  )
}
