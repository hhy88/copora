import './modals.css'

export interface ConfirmModalProps {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'default'
  onConfirm: () => void
  onCancel: () => void
}

const variantIcons: Record<string, string> = {
  danger: '⚠️',
  warning: '⚡',
  default: 'ℹ️',
}

export function ConfirmModal({
  title,
  message,
  confirmText = '确定',
  cancelText = '取消',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const btnClass = variant === 'danger'
    ? 'btn btn-danger'
    : variant === 'warning'
      ? 'btn btn-warning'
      : 'btn btn-primary'

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-dialog" style={{ width: 400 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className={`confirm-modal-icon ${variant}`}>
            {variantIcons[variant]}
          </div>
          <div className="confirm-modal-message">{message}</div>
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onCancel}>{cancelText}</button>
          <button className={btnClass} onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  )
}
