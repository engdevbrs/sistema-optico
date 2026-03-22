import { Link } from 'react-router-dom'
import {
  Calendar, Users, ShoppingCart, Loader2,
  TrendingUp, AlertTriangle, Clock, ArrowRight, Trophy,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useDashboardStats } from '../../hooks/useDashboardStats'

export default function DashboardPage() {
  const { admin } = useAuth()
  const { data: stats, isLoading, isError } = useDashboardStats()

  const formatCLP = (n: number) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(n)

  const formatTime = (t: string) => t.slice(0, 5)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin" size={24} style={{ color: 'var(--text-secondary)' }} />
      </div>
    )
  }

  if (isError) {
    return (
      <div
        className="p-4 text-sm"
        style={{
          backgroundColor: 'var(--badge-danger-bg)',
          color: 'var(--badge-danger-text)',
          borderRadius: '8px',
        }}
      >
        No se pudieron cargar las métricas. Intenta recargar la página.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          Bienvenido, {admin?.nombre ?? 'Admin'}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Resumen de hoy — {new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Citas hoy"
          value={String(stats?.appointmentsToday ?? 0)}
          icon={<Calendar size={20} />}
          linkTo="/admin/agenda"
        />
        <StatCard
          label="Ventas del día"
          value={formatCLP(stats?.salesToday ?? 0)}
          subtitle={`${stats?.salesCountToday ?? 0} ventas`}
          icon={<ShoppingCart size={20} />}
          linkTo="/admin/ventas"
        />
        <StatCard
          label="Pacientes"
          value={String(stats?.totalPatients ?? 0)}
          icon={<Users size={20} />}
          linkTo="/admin/pacientes"
        />
        <StatCard
          label="Stock bajo"
          value={String(stats?.lowStockCount ?? 0)}
          icon={<AlertTriangle size={20} />}
          linkTo="/admin/inventario"
          danger={!!stats?.lowStockCount && stats.lowStockCount > 0}
        />
      </div>

      {/* Monthly revenue card */}
      <div
        className="p-5"
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp size={18} style={{ color: 'var(--status-success)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Ingresos del mes
              </p>
            </div>
            <p className="text-3xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
              {formatCLP(stats?.salesThisMonth ?? 0)}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {stats?.salesCountThisMonth ?? 0} ventas completadas este mes
            </p>
          </div>
          <Link
            to="/admin/ventas"
            className="flex items-center gap-1 text-sm font-medium"
            style={{ color: 'var(--btn-primary-bg)' }}
          >
            Ver ventas
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Today's appointments */}
        <div
          className="p-5 lg:col-span-1"
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Clock size={16} />
              Citas de hoy
            </h2>
            <Link
              to="/admin/agenda"
              className="text-xs font-medium"
              style={{ color: 'var(--btn-primary-bg)' }}
            >
              Ver agenda
            </Link>
          </div>

          {stats?.todayAppointments && stats.todayAppointments.length > 0 ? (
            <div className="space-y-2">
              {stats.todayAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between py-2 px-3"
                  style={{ backgroundColor: 'var(--bg-muted)', borderRadius: '6px' }}
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {(apt.paciente as unknown as { nombre: string })?.nombre ?? '—'}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {(apt.tipo_cita as unknown as { nombre: string })?.nombre ?? 'Consulta'}
                    </p>
                  </div>
                  <span
                    className="text-xs font-medium px-2 py-1"
                    style={{
                      backgroundColor: 'var(--badge-primary-bg)',
                      color: 'var(--badge-primary-text)',
                      borderRadius: '6px',
                    }}
                  >
                    {formatTime(apt.hora_inicio)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>
              No hay citas para hoy
            </p>
          )}
        </div>

        {/* Recent sales */}
        <div
          className="p-5 lg:col-span-1"
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <ShoppingCart size={16} />
              Últimas ventas
            </h2>
            <Link
              to="/admin/ventas"
              className="text-xs font-medium"
              style={{ color: 'var(--btn-primary-bg)' }}
            >
              Ver todas
            </Link>
          </div>

          {stats?.recentSales && stats.recentSales.length > 0 ? (
            <div className="space-y-2">
              {stats.recentSales.map((sale) => (
                <Link
                  key={sale.id}
                  to={`/admin/ventas/${sale.id}`}
                  className="flex items-center justify-between py-2 px-3 cursor-pointer"
                  style={{ backgroundColor: 'var(--bg-muted)', borderRadius: '6px' }}
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {(sale.paciente as unknown as { nombre: string })?.nombre ?? '—'}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {new Date(sale.created_at).toLocaleDateString('es-CL')}
                    </p>
                  </div>
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {formatCLP(sale.total)}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>
              No hay ventas recientes
            </p>
          )}
        </div>

        {/* Top products */}
        <div
          className="p-5 lg:col-span-1"
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Trophy size={16} />
              Más vendidos
            </h2>
            <Link
              to="/admin/inventario"
              className="text-xs font-medium"
              style={{ color: 'var(--btn-primary-bg)' }}
            >
              Ver inventario
            </Link>
          </div>

          {stats?.topProducts && stats.topProducts.length > 0 ? (
            <div className="space-y-2">
              {stats.topProducts.map((product, i) => (
                <div
                  key={product.producto_id}
                  className="flex items-center justify-between py-2 px-3"
                  style={{ backgroundColor: 'var(--bg-muted)', borderRadius: '6px' }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-5 h-5 flex items-center justify-center text-xs font-bold rounded-full"
                      style={{
                        backgroundColor: i === 0 ? 'var(--btn-primary-bg)' : 'var(--border)',
                        color: i === 0 ? '#fff' : 'var(--text-muted)',
                      }}
                    >
                      {i + 1}
                    </span>
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {product.nombre}
                    </p>
                  </div>
                  <span className="text-xs font-medium whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                    {product.total_vendido} uds
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>
              Sin datos de ventas aún
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── StatCard ────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: string
  subtitle?: string
  icon: React.ReactNode
  linkTo: string
  danger?: boolean
}

function StatCard({ label, value, subtitle, icon, linkTo, danger }: StatCardProps) {
  return (
    <Link
      to={linkTo}
      className="p-5 block"
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: `1px solid ${danger ? 'var(--status-danger)' : 'var(--border)'}`,
        borderRadius: '8px',
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            {label}
          </p>
          <p
            className="text-2xl font-bold mt-1"
            style={{ color: danger ? 'var(--status-danger)' : 'var(--text-primary)' }}
          >
            {value}
          </p>
          {subtitle && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {subtitle}
            </p>
          )}
        </div>
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{
            backgroundColor: danger ? 'var(--badge-danger-bg)' : 'var(--badge-primary-bg)',
            color: danger ? 'var(--badge-danger-text)' : 'var(--badge-primary-text)',
          }}
        >
          {icon}
        </div>
      </div>
    </Link>
  )
}
