import { useEffect, useRef, useState } from 'react'
import '../modals/modals.css'

export interface ContextMenuItem {
  label: string
  shortcut?: string
  disabled?: boolean
  separator?: boolean
  checked?: boolean
  onClick?: () => void
}

export interface ContextMenuProps {
  items: ContextMenuItem[]
  position: { x: number; y: number }
  onClose: () => void
}

export function ContextMenu({ items, position, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [adjustedPos, setAdjustedPos] = useState(position)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  useEffect(() => {
    if (!menuRef.current) return
    const rect = menuRef.current.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight

    let x = position.x
    let y = position.y

    if (rect.width > 0 && x + rect.width > vw) {
      x = vw - rect.width - 4
    }
    if (rect.height > 0 && y + rect.height > vh) {
      y = vh - rect.height - 4
    }
    if (x < 0) x = 4
    if (y < 0) y = 4

    setAdjustedPos({ x, y })
  }, [position])

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{ left: adjustedPos.x, top: adjustedPos.y }}
    >
      {items.map((item, index) => {
        if (item.separator) {
          return <div key={index} className="context-menu-separator" />
        }

        return (
          <div
            key={index}
            className={`context-menu-item${item.disabled ? ' disabled' : ''}`}
            onClick={() => {
              if (!item.disabled && item.onClick) {
                item.onClick()
                onClose()
              }
            }}
          >
            <span className="item-label">
              {item.checked !== undefined && (
                <span className="item-check">{item.checked ? '✓' : ''}</span>
              )}
              {item.label}
            </span>
            {item.shortcut && (
              <span className="item-shortcut">{item.shortcut}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
