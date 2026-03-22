import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  ShoppingCart,
  Package,
  Truck,
  Tag,
  BarChart3,
  Settings,
  ClipboardList,
  MessageSquare,
  LogOut,
  X,
  Sun,
  Moon,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../hooks/useTheme'

interface NavItem {
  label: string
  path: string
  icon: React.ReactNode
}

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={20} /> },
  { label: 'Agenda', path: '/admin/agenda', icon: <Calendar size={20} /> },
  { label: 'Pacientes', path: '/admin/pacientes', icon: <Users size={20} /> },
  { label: 'Recetas', path: '/admin/recetas', icon: <FileText size={20} /> },
  { label: 'Ventas', path: '/admin/ventas', icon: <ShoppingCart size={20} /> },
  { label: 'Inventario', path: '/admin/inventario', icon: <Package size={20} /> },
  { label: 'Pedidos', path: '/admin/pedidos', icon: <Truck size={20} /> },
  { label: 'Precios', path: '/admin/precios', icon: <Tag size={20} /> },
  { label: 'Lista de espera', path: '/admin/lista-espera', icon: <ClipboardList size={20} /> },
  { label: 'Encuestas', path: '/admin/encuestas', icon: <MessageSquare size={20} /> },
  { label: 'Reportes', path: '/admin/reportes', icon: <BarChart3 size={20} /> },
  { label: 'Configuración', path: '/admin/configuracion', icon: <Settings size={20} /> },
]

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { admin, signOut } = useAuth()
  const { isDark, toggleTheme } = useTheme()

  return (
    <aside
      className={`
        fixed left-0 top-0 h-full w-64 flex flex-col border-r z-50
        transition-transform duration-200 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}
      style={{
        backgroundColor: 'var(--sidebar-bg)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center justify-between px-6 py-5 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-semibold text-sm"
            style={{ backgroundColor: 'var(--btn-primary-bg)' }}
          >
            VM
          </div>
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            Visiora
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md transition-colors hover:opacity-80 lg:hidden"
          style={{ color: 'var(--text-muted)' }}
          aria-label="Cerrar menú"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                style={({ isActive }) => ({
                  backgroundColor: isActive ? 'var(--sidebar-item-active)' : 'transparent',
                  color: isActive ? 'var(--sidebar-text-active)' : 'var(--sidebar-text)',
                })}
              >
                {item.icon}
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Theme toggle + User info + logout */}
      <div
        className="px-4 py-4 border-t space-y-3"
        style={{ borderColor: 'var(--border)' }}
      >
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm font-medium transition-colors"
          style={{ color: 'var(--sidebar-text)' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
          {isDark ? 'Modo claro' : 'Modo oscuro'}
        </button>

        {/* User info */}
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
            style={{
              backgroundColor: 'var(--badge-primary-bg)',
              color: 'var(--badge-primary-text)',
            }}
          >
            {admin?.nombre?.charAt(0) ?? 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-medium truncate"
              style={{ color: 'var(--text-primary)' }}
            >
              {admin?.nombre ?? 'Admin'}
            </p>
            <p
              className="text-xs truncate"
              style={{ color: 'var(--text-muted)' }}
            >
              {admin?.rol === 'DUENO' ? 'Dueño' : 'Vendedor'}
            </p>
          </div>
          <button
            onClick={signOut}
            className="p-1.5 rounded-md transition-colors hover:opacity-80"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Cerrar sesión"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  )
}
