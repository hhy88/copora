import { useState, useRef, useCallback } from 'react'
import type { ReactNode } from 'react'
import '../modals/modals.css'

export interface TooltipProps {
  content: string
  children: ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = useCallback(() => {
    timerRef.current = setTimeout(() => setVisible(true), 500)
  }, [])

  const hide = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setVisible(false)
  }, [])

  return (
    <div
      className="tooltip-wrapper"
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      {children}
      {visible && (
        <div className={`tooltip tooltip-${position}`}>
          {content}
        </div>
      )}
    </div>
  )
}
