import { useState, useCallback } from 'react'
import { useFileStore } from '../../stores/file-store'
import type { FileNode } from '../../stores/file-store'

interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  node: FileNode | null
}

interface DragState {
  nodeId: string | null
  overNodeId: string | null
  position: 'before' | 'after' | 'inside' | null
}

const initialContextMenu: ContextMenuState = { visible: false, x: 0, y: 0, node: null }
const initialDrag: DragState = { nodeId: null, overNodeId: null, position: null }

function FileTreeItem({
  node,
  depth,
  selectedPath,
  onSelect,
  expandedIds,
  onToggleExpand,
  onContextMenu,
  dragState,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
}: {
  node: FileNode
  depth: number
  selectedPath: string | null
  onSelect: (node: FileNode) => void
  expandedIds: Set<string>
  onToggleExpand: (id: string) => void
  onContextMenu: (e: React.MouseEvent, node: FileNode) => void
  dragState: DragState
  onDragStart: (e: React.DragEvent, nodeId: string) => void
  onDragOver: (e: React.DragEvent, node: FileNode) => void
  onDragEnd: () => void
  onDrop: (e: React.DragEvent, targetNode: FileNode) => void
}) {
  const isExpanded = expandedIds.has(node.id)
  const isSelected = node.path === selectedPath
  const isMd = node.name.endsWith('.md')
  const isDimmed = !node.isDir && !isMd
  const isDragOver = dragState.overNodeId === node.id

  const icon = node.isDir ? '📁' : isMd ? '📄' : '📎'

  const handleClick = () => {
    if (node.isDir) {
      onToggleExpand(node.id)
    } else {
      onSelect(node)
    }
  }

  const dragOverClass = isDragOver
    ? dragState.position === 'inside'
      ? ' drag-over'
      : ''
    : ''

  return (
    <>
      <div
        className={`file-tree-item${isSelected ? ' selected' : ''}${isDimmed ? ' dimmed' : ''}${dragOverClass}`}
        style={{ '--indent': depth } as React.CSSProperties}
        onClick={handleClick}
        onContextMenu={(e) => onContextMenu(e, node)}
        draggable
        onDragStart={(e) => onDragStart(e, node.id)}
        onDragOver={(e) => onDragOver(e, node)}
        onDragEnd={onDragEnd}
        onDrop={(e) => onDrop(e, node)}
      >
        {node.isDir && (
          <span className={`file-tree-chevron${isExpanded ? ' expanded' : ''}`}>▶</span>
        )}
        {!node.isDir && <span style={{ width: 16, flexShrink: 0 }} />}
        <span className="file-tree-icon">{icon}</span>
        <span className="file-tree-name">{node.name}</span>
        {node.isModified && <span className="file-tree-modified" />}
      </div>
      {node.isDir && isExpanded && node.children && (
        <>
          {node.children.map((child) => (
            <FileTreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedPath={selectedPath}
              onSelect={onSelect}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
              onContextMenu={onContextMenu}
              dragState={dragState}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDragEnd={onDragEnd}
              onDrop={onDrop}
            />
          ))}
        </>
      )}
    </>
  )
}

export default function FileTree() {
  const files = useFileStore((s) => s.files)
  const rootPath = useFileStore((s) => s.rootPath)
  const openFile = useFileStore((s) => s.openFile)
  const activeTabId = useFileStore((s) => s.activeTabId)
  const openTabs = useFileStore((s) => s.openTabs)
  const setFiles = useFileStore((s) => s.setFiles)

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(initialContextMenu)
  const [dragState, setDragState] = useState<DragState>(initialDrag)

  const selectedPath = openTabs.find((t) => t.id === activeTabId)?.filePath ?? null

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const handleSelect = useCallback(
    (node: FileNode) => {
      if (!node.isDir) {
        openFile({
          id: node.id,
          filePath: node.path,
          fileName: node.name,
          isModified: node.isModified ?? false,
          isPinned: false,
        })
      }
    },
    [openFile]
  )

  const handleContextMenu = useCallback((e: React.MouseEvent, node: FileNode) => {
    e.preventDefault()
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, node })
  }, [])

  const closeContextMenu = useCallback(() => {
    setContextMenu(initialContextMenu)
  }, [])

  const handleContextAction = useCallback(
    (action: string) => {
      closeContextMenu()
      if (!contextMenu.node) return

      switch (action) {
        case 'new-md': {
          const parent = contextMenu.node.isDir ? contextMenu.node : null
          const newNode: FileNode = {
            id: `new-${Date.now()}`,
            name: 'untitled.md',
            path: parent ? `${parent.path}/untitled.md` : 'untitled.md',
            isDir: false,
          }
          if (parent && parent.children) {
            setFiles(
              files.map(function add(n): FileNode {
                if (n.id === parent.id) {
                  return { ...n, children: [...(n.children ?? []), newNode] }
                }
                if (n.children) {
                  return { ...n, children: n.children.map(add) }
                }
                return n
              })
            )
          }
          break
        }
        case 'new-folder': {
          const parent = contextMenu.node.isDir ? contextMenu.node : null
          const newNode: FileNode = {
            id: `new-dir-${Date.now()}`,
            name: 'new-folder',
            path: parent ? `${parent.path}/new-folder` : 'new-folder',
            isDir: true,
            children: [],
          }
          if (parent && parent.children) {
            setFiles(
              files.map(function add(n): FileNode {
                if (n.id === parent.id) {
                  return { ...n, children: [...(n.children ?? []), newNode] }
                }
                if (n.children) {
                  return { ...n, children: n.children.map(add) }
                }
                return n
              })
            )
          }
          break
        }
        case 'rename':
          break
        case 'delete': {
          const targetId = contextMenu.node.id
          setFiles(
            files
              .filter((n) => n.id !== targetId)
              .map(function remove(n): FileNode {
                if (n.children) {
                  return { ...n, children: n.children.filter((c) => c.id !== targetId).map(remove) }
                }
                return n
              })
          )
          break
        }
        case 'copy-path':
          if (contextMenu.node.path) {
            navigator.clipboard.writeText(contextMenu.node.path)
          }
          break
        case 'open-in-explorer':
          break
      }
    },
    [contextMenu, closeContextMenu, files, setFiles]
  )

  const handleDragStart = useCallback((e: React.DragEvent, nodeId: string) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', nodeId)
    setDragState((prev) => ({ ...prev, nodeId }))
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, node: FileNode) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    const position = node.isDir ? 'inside' : 'after'
    setDragState((prev) => ({ ...prev, overNodeId: node.id, position }))
  }, [])

  const handleDragEnd = useCallback(() => {
    setDragState(initialDrag)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent, targetNode: FileNode) => {
      e.preventDefault()
      const sourceId = e.dataTransfer.getData('text/plain')
      if (!sourceId || sourceId === targetNode.id) {
        setDragState(initialDrag)
        return
      }

      let sourceNode: FileNode | null = null
      let newFiles = [...files]

      function removeNode(nodes: FileNode[]): FileNode[] {
        return nodes
          .filter((n) => {
            if (n.id === sourceId) {
              sourceNode = n
              return false
            }
            return true
          })
          .map((n) => (n.children ? { ...n, children: removeNode(n.children) } : n))
      }

      newFiles = removeNode(newFiles)

      if (!sourceNode) {
        setDragState(initialDrag)
        return
      }

      function insertNode(nodes: FileNode[]): FileNode[] {
        if (targetNode.isDir && targetNode.id) {
          return nodes.map((n) => {
            if (n.id === targetNode.id) {
              return { ...n, children: [...(n.children ?? []), sourceNode!] }
            }
            if (n.children) {
              return { ...n, children: insertNode(n.children) }
            }
            return n
          })
        }
        const idx = nodes.findIndex((n) => n.id === targetNode.id)
        if (idx !== -1) {
          const result = [...nodes]
          result.splice(idx + 1, 0, sourceNode!)
          return result
        }
        return nodes.map((n) => (n.children ? { ...n, children: insertNode(n.children) } : n))
      }

      newFiles = insertNode(newFiles)
      setFiles(newFiles)
      setDragState(initialDrag)
    },
    [files, setFiles]
  )

  if (!rootPath || files.length === 0) {
    return (
      <div className="file-tree-empty">
        <span>📁</span>
        <span>打开文件夹开始编辑</span>
        <button>打开文件夹</button>
      </div>
    )
  }

  return (
    <div className="file-tree">
      {files.map((node) => (
        <FileTreeItem
          key={node.id}
          node={node}
          depth={0}
          selectedPath={selectedPath}
          onSelect={handleSelect}
          expandedIds={expandedIds}
          onToggleExpand={handleToggleExpand}
          onContextMenu={handleContextMenu}
          dragState={dragState}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDrop={handleDrop}
        />
      ))}
      {contextMenu.visible && (
        <div
          className="context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={closeContextMenu}
        >
          <div className="context-menu-item" onClick={() => handleContextAction('new-md')}>
            新建Markdown
          </div>
          <div className="context-menu-item" onClick={() => handleContextAction('new-folder')}>
            新建文件夹
          </div>
          <div className="context-menu-separator" />
          <div className="context-menu-item" onClick={() => handleContextAction('rename')}>
            重命名
          </div>
          <div className="context-menu-item danger" onClick={() => handleContextAction('delete')}>
            删除
          </div>
          <div className="context-menu-separator" />
          <div className="context-menu-item" onClick={() => handleContextAction('copy-path')}>
            复制路径
          </div>
          <div className="context-menu-item" onClick={() => handleContextAction('open-in-explorer')}>
            在资源管理器中打开
          </div>
        </div>
      )}
    </div>
  )
}
