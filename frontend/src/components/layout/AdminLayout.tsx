import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { Sidebar } from './Sidebar'

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-page)' }}>
      {/* Mobile header */}
      <header
        className="sticky top-0 z-40 flex items-center gap-3 px-4 py-3 border-b lg:hidden"
        style={{
          backgroundColor: 'var(--sidebar-bg)',
          borderColor: 'var(--border)',
        }}
      >
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-1.5 rounded-md transition-colors hover:opacity-80"
          style={{ color: 'var(--text-primary)' }}
          aria-label="Abrir menú"
        >
          <Menu size={24} />
        </button>
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-semibold text-xs"
          style={{ backgroundColor: 'var(--btn-primary-bg)' }}
        >
          VM
        </div>
        <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
          Visiora
        </span>
      </header>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="lg:ml-64 p-4 sm:p-6 min-w-0 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  )
}
