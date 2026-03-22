import { type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle } from 'lucide-react'

interface ConfirmModalProps {
  title: string
  message: string | ReactNode
  confirmLabel?: string
  loadingLabel?: string
  cancelLabel?: string
  danger?: boolean
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirmar',
  loadingLabel,
  cancelLabel = 'Volver',
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return createPortal(
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={loading ? undefined : onCancel} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="w-full max-w-sm p-6"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: '8px',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div className="flex items-start gap-4">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: danger ? 'var(--badge-danger-bg)' : 'var(--badge-warning-bg)',
                color: danger ? 'var(--badge-danger-text)' : 'var(--badge-warning-text)',
              }}
            >
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3
                className="text-base font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                {title}
              </h3>
              <div
                className="text-sm mt-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                {message}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
              style={{
                color: 'var(--btn-secondary-text)',
                border: '1px solid var(--btn-secondary-border)',
                borderRadius: '6px',
              }}
              onMouseEnter={(e) =>
                !loading && (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = 'transparent')
              }
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors disabled:opacity-80"
              style={{
                backgroundColor: danger ? 'var(--btn-danger-bg)' : 'var(--btn-primary-bg)',
                color: danger ? 'var(--btn-danger-text)' : 'var(--btn-primary-text)',
                borderRadius: '6px',
              }}
              onMouseEnter={(e) =>
                !loading && (e.currentTarget.style.backgroundColor = danger
                  ? 'var(--btn-danger-hover)'
                  : 'var(--btn-primary-hover)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = danger
                  ? 'var(--btn-danger-bg)'
                  : 'var(--btn-primary-bg)')
              }
            >
              {loading && (
                <div
                  className="w-4 h-4 border-2 rounded-full animate-spin"
                  style={{
                    borderColor: 'currentColor',
                    borderTopColor: 'transparent',
                  }}
                />
              )}
              {loading ? (loadingLabel ?? confirmLabel) : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  )
}
