import { useState, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import type { ContextMenuItem } from './ContextMenu'
import '../modals/modals.css'

export interface DropdownProps {
  trigger: ReactNode
  items: ContextMenuItem[]
  align?: 'left' | 'right'
}

export function Dropdown({ trigger, items, align = 'left' }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div className="dropdown-wrapper" ref={wrapperRef}>
      <div onClick={() => setOpen((prev) => !prev)}>{trigger}</div>
      {open && (
        <div className={`dropdown-menu align-${align}`}>
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
                    setOpen(false)
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
      )}
    </div>
  )
}
