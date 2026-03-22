import { useRef, useState, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { MoreVertical } from 'lucide-react'

interface DropdownMenuProps {
  children: (close: () => void) => React.ReactNode
}

export function DropdownMenu({ children }: DropdownMenuProps) {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    const menuWidth = 160
    const menuHeight = 140

    let top = rect.bottom + 4
    let left = rect.right - menuWidth

    // Keep within viewport
    if (left < 8) left = 8
    if (top + menuHeight > window.innerHeight) {
      top = rect.top - menuHeight - 4
    }

    setPos({ top, left })
  }, [open])

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className="p-1 rounded-md transition-colors"
        style={{ color: 'var(--text-muted)' }}
        aria-label="Acciones"
      >
        <MoreVertical size={16} />
      </button>

      {open &&
        createPortal(
          <>
            <div className="fixed inset-0 z-50" onClick={() => setOpen(false)} />
            <div
              ref={menuRef}
              className="fixed z-50 w-40 py-1"
              style={{
                top: pos.top,
                left: pos.left,
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              {children(() => setOpen(false))}
            </div>
          </>,
          document.body,
        )}
    </>
  )
}

interface DropdownItemProps {
  icon: React.ReactNode
  label: string
  danger?: boolean
  onClick?: () => void
  href?: string
}

export function DropdownItem({ icon, label, danger, onClick, href }: DropdownItemProps) {
  const className = 'flex items-center gap-2 px-3 py-2 text-sm transition-colors w-full text-left'
  const style = { color: danger ? 'var(--status-danger)' : 'var(--text-primary)' }

  const handleHover = (e: React.MouseEvent<HTMLElement>) =>
    (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)')
  const handleLeave = (e: React.MouseEvent<HTMLElement>) =>
    (e.currentTarget.style.backgroundColor = 'transparent')

  if (href) {
    // Use a regular anchor to avoid importing Link here; React Router's <Link> isn't needed for same-app navigation via window.location
    // Actually we need to use proper routing. We'll accept an onClick with navigate instead.
    return (
      <button
        onClick={onClick}
        className={className}
        style={style}
        onMouseEnter={handleHover}
        onMouseLeave={handleLeave}
      >
        {icon}
        {label}
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      className={className}
      style={style}
      onMouseEnter={handleHover}
      onMouseLeave={handleLeave}
    >
      {icon}
      {label}
    </button>
  )
}
