import { Outlet, Link } from 'react-router-dom'
import { Phone, Mail, MapPin } from 'lucide-react'
import { useConfig } from '../../hooks/useConfig'
import { useWeeklySchedule } from '../../hooks/useAppointments'

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export function PublicLayout() {
  const { data: config } = useConfig()
  const { data: schedule } = useWeeklySchedule()

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-page)' }}>
      {/* Navbar */}
      <header
        className="sticky top-0 z-50 px-4 sm:px-6 py-4"
        style={{ backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(8px)' }}
        role="banner"
      >
        <nav aria-label="Navegación principal" className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: 'var(--btn-primary-bg)' }}
            >
              {config?.nombre_optica?.slice(0, 2).toUpperCase() ?? 'OP'}
            </div>
            <span className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
              {config?.nombre_optica ?? 'Óptica'}
            </span>
          </Link>
          <Link
            to="/reservar"
            className="px-4 py-2 text-sm font-medium"
            style={{
              backgroundColor: 'var(--btn-primary-bg)',
              color: 'var(--btn-primary-text)',
              borderRadius: '6px',
            }}
          >
            Agendar cita
          </Link>
        </nav>
      </header>

      {/* Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer
        className="px-4 sm:px-6 py-10"
        style={{ backgroundColor: 'var(--bg-surface)', borderTop: '1px solid var(--border)' }}
        role="contentinfo"
      >
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
              {config?.nombre_optica ?? 'Óptica'}
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Tu salud visual es nuestra prioridad.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-medium text-sm mb-3" style={{ color: 'var(--text-primary)' }}>Contacto</h4>
            <div className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              {config?.direccion && (
                <div className="flex items-center gap-2">
                  <MapPin size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  {config.direccion}
                </div>
              )}
              {config?.telefono && (
                <div className="flex items-center gap-2">
                  <Phone size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  {config.telefono}
                </div>
              )}
              {config?.email && (
                <div className="flex items-center gap-2">
                  <Mail size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  {config.email}
                </div>
              )}
            </div>
          </div>

          {/* Schedule */}
          <div>
            <h4 className="font-medium text-sm mb-3" style={{ color: 'var(--text-primary)' }}>Horarios</h4>
            <div className="space-y-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
              {schedule?.map((day) => (
                <div key={day.dia_semana} className="flex justify-between">
                  <span>{DAY_NAMES[day.dia_semana]}</span>
                  <span style={{ color: day.activo ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {day.activo ? `${day.hora_inicio.slice(0, 5)} - ${day.hora_fin.slice(0, 5)}` : 'Cerrado'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-8 pt-6 text-center text-xs" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-muted)' }}>
          &copy; {new Date().getFullYear()} {config?.nombre_optica ?? 'Óptica'}. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  )
}
