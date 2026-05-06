import { useRef, useState, useCallback, useEffect } from 'react'
import { useFileStore } from '../../stores/file-store'
import type { OpenTab } from '../../stores/file-store'

interface TabContextMenuState {
  visible: boolean
  x: number
  y: number
  tabId: string | null
  tabIndex: number
}

const initialContextMenu: TabContextMenuState = {
  visible: false,
  x: 0,
  y: 0,
  tabId: null,
  tabIndex: -1,
}

export default function TabBar() {
  const openTabs = useFileStore((s) => s.openTabs)
  const activeTabId = useFileStore((s) => s.activeTabId)
  const setActiveTab = useFileStore((s) => s.setActiveTab)
  const closeTab = useFileStore((s) => s.closeTab)
  const moveTab = useFileStore((s) => s.moveTab)

  const [contextMenu, setContextMenu] = useState<TabContextMenuState>(initialContextMenu)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [dragOverSide, setDragOverSide] = useState<'left' | 'right' | null>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const tabListRef = useRef<HTMLDivElement>(null)

  const updateScrollButtons = useCallback(() => {
    const el = tabListRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 0)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }, [])

  useEffect(() => {
    updateScrollButtons()
    const el = tabListRef.current
    if (!el) return
    el.addEventListener('scroll', updateScrollButtons)
    const observer = new ResizeObserver(updateScrollButtons)
    observer.observe(el)
    return () => {
      el.removeEventListener('scroll', updateScrollButtons)
      observer.disconnect()
    }
  }, [updateScrollButtons, openTabs])

  const scrollLeft = useCallback(() => {
    tabListRef.current?.scrollBy({ left: -150, behavior: 'smooth' })
  }, [])

  const scrollRight = useCallback(() => {
    tabListRef.current?.scrollBy({ left: 150, behavior: 'smooth' })
  }, [])

  const handleTabClick = useCallback(
    (tabId: string) => {
      setActiveTab(tabId)
    },
    [setActiveTab]
  )

  const handleClose = useCallback(
    (e: React.MouseEvent, tabId: string) => {
      e.stopPropagation()
      closeTab(tabId)
    },
    [closeTab]
  )

  const handleContextMenu = useCallback((e: React.MouseEvent, tab: OpenTab, index: number) => {
    e.preventDefault()
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, tabId: tab.id, tabIndex: index })
  }, [])

  const closeContextMenu = useCallback(() => {
    setContextMenu(initialContextMenu)
  }, [])

  const handleCloseOthers = useCallback(() => {
    if (!contextMenu.tabId) return
    const tabId = contextMenu.tabId
    for (const t of openTabs) {
      if (t.id !== tabId) {
        closeTab(t.id)
      }
    }
    setActiveTab(tabId)
    closeContextMenu()
  }, [contextMenu.tabId, openTabs, closeTab, setActiveTab, closeContextMenu])

  const handleCloseLeft = useCallback(() => {
    if (contextMenu.tabIndex < 0) return
    const tabsToClose = openTabs.slice(0, contextMenu.tabIndex)
    for (const t of tabsToClose) {
      closeTab(t.id)
    }
    closeContextMenu()
  }, [contextMenu.tabIndex, openTabs, closeTab, closeContextMenu])

  const handleCloseRight = useCallback(() => {
    if (contextMenu.tabIndex < 0) return
    const tabsToClose = openTabs.slice(contextMenu.tabIndex + 1)
    for (const t of tabsToClose) {
      closeTab(t.id)
    }
    closeContextMenu()
  }, [contextMenu.tabIndex, openTabs, closeTab, closeContextMenu])

  const handleCloseAll = useCallback(() => {
    for (const t of [...openTabs]) {
      closeTab(t.id)
    }
    closeContextMenu()
  }, [openTabs, closeTab, closeContextMenu])

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(index))
    setDragIndex(index)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    const midX = rect.left + rect.width / 2
    setDragOverIndex(index)
    setDragOverSide(e.clientX < midX ? 'left' : 'right')
  }, [])

  const handleDragEnd = useCallback(() => {
    setDragIndex(null)
    setDragOverIndex(null)
    setDragOverSide(null)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent, toIndex: number) => {
      e.preventDefault()
      const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10)
      if (fromIndex === toIndex) {
        handleDragEnd()
        return
      }
      moveTab(fromIndex, toIndex)
      handleDragEnd()
    },
    [moveTab, handleDragEnd]
  )

  useEffect(() => {
    if (contextMenu.visible) {
      const handleClick = () => closeContextMenu()
      document.addEventListener('click', handleClick)
      return () => document.removeEventListener('click', handleClick)
    }
  }, [contextMenu.visible, closeContextMenu])

  if (openTabs.length === 0) return null

  return (
    <div className="tab-bar">
      {canScrollLeft && (
        <button className="tab-scroll-btn" onClick={scrollLeft}>
          ◀
        </button>
      )}
      <div className="tab-list" ref={tabListRef}>
        {openTabs.map((tab, index) => (
          <div
            key={tab.id}
            className={`tab-item${tab.id === activeTabId ? ' active' : ''}${
              dragOverIndex === index && dragIndex !== index
                ? dragOverSide === 'left'
                  ? ' drag-over-left'
                  : ' drag-over-right'
                : ''
            }`}
            onClick={() => handleTabClick(tab.id)}
            onContextMenu={(e) => handleContextMenu(e, tab, index)}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            onDrop={(e) => handleDrop(e, index)}
          >
            {tab.isModified && <span className="tab-modified" />}
            <span className="tab-name">{tab.fileName}</span>
            <span
              className="tab-close"
              onClick={(e) => handleClose(e, tab.id)}
            >
              ×
            </span>
          </div>
        ))}
      </div>
      {canScrollRight && (
        <button className="tab-scroll-btn" onClick={scrollRight}>
          ▶
        </button>
      )}
      {contextMenu.visible && (
        <div
          className="context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <div className="context-menu-item" onClick={() => { closeTab(contextMenu.tabId!); closeContextMenu() }}>
            关闭
          </div>
          <div className="context-menu-item" onClick={handleCloseOthers}>
            关闭其他
          </div>
          <div className="context-menu-item" onClick={handleCloseLeft}>
            关闭左侧
          </div>
          <div className="context-menu-item" onClick={handleCloseRight}>
            关闭右侧
          </div>
          <div className="context-menu-separator" />
          <div className="context-menu-item" onClick={handleCloseAll}>
            关闭全部
          </div>
        </div>
      )}
    </div>
  )
}
