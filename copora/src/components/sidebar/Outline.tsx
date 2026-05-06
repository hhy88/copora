import { useState, useMemo, useCallback, useEffect } from 'react'
import { useFileStore } from '../../stores/file-store'

interface HeadingItem {
  id: string
  level: number
  text: string
  line: number
}

interface OutlineContextMenuState {
  visible: boolean
  x: number
  y: number
}

function parseHeadings(content: string): HeadingItem[] {
  const lines = content.split('\n')
  const headings: HeadingItem[] = []

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^(#{1,6})\s+(.+)$/)
    if (match) {
      const level = match[1].length
      const text = match[2].replace(/#+\s*$/, '').trim()
      const id = `heading-${i}-${text.replace(/\s+/g, '-').toLowerCase()}`
      headings.push({ id, level, text, line: i + 1 })
    }
  }

  return headings
}

function buildOutlineTree(headings: HeadingItem[]): OutlineNode[] {
  const root: OutlineNode[] = []
  const stack: OutlineNode[] = []

  for (const h of headings) {
    const node: OutlineNode = { ...h, children: [] }
    while (stack.length > 0 && stack[stack.length - 1].level >= h.level) {
      stack.pop()
    }
    if (stack.length > 0) {
      stack[stack.length - 1].children.push(node)
    } else {
      root.push(node)
    }
    stack.push(node)
  }

  return root
}

interface OutlineNode extends HeadingItem {
  children: OutlineNode[]
}

function OutlineNodeItem({
  node,
  activeId,
  collapsedIds,
  onToggleCollapse,
  onClick,
}: {
  node: OutlineNode
  activeId: string | null
  collapsedIds: Set<string>
  onToggleCollapse: (id: string) => void
  onClick: (node: OutlineNode) => void
}) {
  const hasChildren = node.children.length > 0
  const isCollapsed = collapsedIds.has(node.id)
  const isActive = node.id === activeId

  return (
    <>
      <div
        className={`outline-item${isActive ? ' active' : ''}`}
        style={{ '--level': node.level } as React.CSSProperties}
        onClick={() => onClick(node)}
      >
        {hasChildren && (
          <span
            className={`outline-chevron${isCollapsed ? '' : ' expanded'}`}
            onClick={(e) => {
              e.stopPropagation()
              onToggleCollapse(node.id)
            }}
          >
            ▶
          </span>
        )}
        {!hasChildren && <span style={{ width: 14, flexShrink: 0 }} />}
        <span className="outline-text">{node.text}</span>
      </div>
      {hasChildren && !isCollapsed && (
        <>
          {node.children.map((child) => (
            <OutlineNodeItem
              key={child.id}
              node={child}
              activeId={activeId}
              collapsedIds={collapsedIds}
              onToggleCollapse={onToggleCollapse}
              onClick={onClick}
            />
          ))}
        </>
      )}
    </>
  )
}

export default function Outline() {
  const content = useFileStore((s) => s.content)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set())
  const [contextMenu, setContextMenu] = useState<OutlineContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
  })

  const headings = useMemo(() => parseHeadings(content), [content])
  const outlineTree = useMemo(() => buildOutlineTree(headings), [headings])

  useEffect(() => {
    function handleScroll() {
      const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
      if (headingElements.length === 0) return

      let current: Element | null = null
      for (const el of headingElements) {
        const rect = el.getBoundingClientRect()
        if (rect.top <= 100) {
          current = el
        } else {
          break
        }
      }

      if (current) {
        const text = current.textContent ?? ''
        const line = current.getAttribute('data-line')
        const id = line
          ? `heading-${parseInt(line)}-${text.replace(/\s+/g, '-').toLowerCase()}`
          : `heading-0-${text.replace(/\s+/g, '-').toLowerCase()}`
        setActiveId(id)
      }
    }

    window.addEventListener('scroll', handleScroll, true)
    return () => window.removeEventListener('scroll', handleScroll, true)
  }, [])

  const handleToggleCollapse = useCallback((id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const handleClick = useCallback((node: OutlineNode) => {
    window.dispatchEvent(
      new CustomEvent('outline-navigate', { detail: { line: node.line } })
    )
  }, [])

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY })
  }, [])

  const closeContextMenu = useCallback(() => {
    setContextMenu({ visible: false, x: 0, y: 0 })
  }, [])

  const collapseAll = useCallback(() => {
    const allIds = new Set<string>()
    function collect(nodes: OutlineNode[]) {
      for (const n of nodes) {
        if (n.children.length > 0) {
          allIds.add(n.id)
          collect(n.children)
        }
      }
    }
    collect(outlineTree)
    setCollapsedIds(allIds)
    closeContextMenu()
  }, [outlineTree, closeContextMenu])

  const expandAll = useCallback(() => {
    setCollapsedIds(new Set())
    closeContextMenu()
  }, [closeContextMenu])

  const copyAnchorLink = useCallback(() => {
    if (activeId) {
      const heading = headings.find((h) => h.id === activeId)
      if (heading) {
        const anchor = `#${heading.text.replace(/\s+/g, '-').toLowerCase()}`
        navigator.clipboard.writeText(anchor)
      }
    }
    closeContextMenu()
  }, [activeId, headings, closeContextMenu])

  if (headings.length === 0) {
    return (
      <div className="outline-empty">文档无标题</div>
    )
  }

  return (
    <div className="outline-panel" onContextMenu={handleContextMenu}>
      {outlineTree.map((node) => (
        <OutlineNodeItem
          key={node.id}
          node={node}
          activeId={activeId}
          collapsedIds={collapsedIds}
          onToggleCollapse={handleToggleCollapse}
          onClick={handleClick}
        />
      ))}
      {contextMenu.visible && (
        <div
          className="context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={closeContextMenu}
        >
          <div className="context-menu-item" onClick={collapseAll}>
            折叠全部
          </div>
          <div className="context-menu-item" onClick={expandAll}>
            展开全部
          </div>
          <div className="context-menu-separator" />
          <div className="context-menu-item" onClick={copyAnchorLink}>
            复制锚点链接
          </div>
        </div>
      )}
    </div>
  )
}
