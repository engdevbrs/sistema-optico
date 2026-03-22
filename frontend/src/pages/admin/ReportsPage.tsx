import { useState } from 'react'
import { BarChart3, ShoppingCart, Package, Users, Calendar, TrendingUp, Trophy } from 'lucide-react'
import { useSalesReport, useProductsReport, usePatientsReport } from '../../hooks/useReports'

const TABS = [
  { id: 'sales', label: 'Ventas', icon: ShoppingCart },
  { id: 'products', label: 'Productos', icon: Package },
  { id: 'patients', label: 'Pacientes', icon: Users },
] as const

type TabId = typeof TABS[number]['id']

const PAYMENT_LABELS: Record<string, string> = {
  EFECTIVO: 'Efectivo',
  DEBITO: 'Débito',
  CREDITO: 'Crédito',
  TRANSFERENCIA: 'Transferencia',
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('sales')

  // Default: current month
  const now = new Date()
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const today = now.toISOString().split('T')[0]
  const [dateFrom, setDateFrom] = useState(monthStart)
  const [dateTo, setDateTo] = useState(today)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>Reportes</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Métricas y estadísticas del negocio</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1" style={{ borderBottom: '1px solid var(--border)' }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium -mb-px"
            style={{
              color: activeTab === id ? 'var(--btn-primary-bg)' : 'var(--text-secondary)',
              borderBottom: activeTab === id ? '2px solid var(--btn-primary-bg)' : '2px solid transparent',
            }}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Date range - only for sales and products */}
      {(activeTab === 'sales' || activeTab === 'products') && (
        <div className="flex flex-wrap items-center gap-3">
          <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="text-sm py-2 px-3 outline-none"
              style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '6px', color: 'var(--text-primary)' }}
            />
            <span style={{ color: 'var(--text-muted)' }}>—</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="text-sm py-2 px-3 outline-none"
              style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '6px', color: 'var(--text-primary)' }}
            />
          </div>
          {/* Quick filters */}
          <div className="flex gap-1">
            {[
              { label: 'Hoy', from: today, to: today },
              { label: 'Este mes', from: monthStart, to: today },
              { label: 'Último mes', from: getLastMonthStart(), to: getLastMonthEnd() },
            ].map((q) => (
              <button
                key={q.label}
                onClick={() => { setDateFrom(q.from); setDateTo(q.to) }}
                className="px-3 py-1 text-xs font-medium"
                style={{
                  backgroundColor: dateFrom === q.from && dateTo === q.to ? 'var(--btn-primary-bg)' : 'var(--bg-surface)',
                  color: dateFrom === q.from && dateTo === q.to ? 'var(--btn-primary-text)' : 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                }}
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'sales' && <SalesTab dateFrom={dateFrom} dateTo={dateTo} />}
      {activeTab === 'products' && <ProductsTab dateFrom={dateFrom} dateTo={dateTo} />}
      {activeTab === 'patients' && <PatientsTab />}
    </div>
  )
}

// ── Sales Tab ───────────────────────────────────────────

function SalesTab({ dateFrom, dateTo }: { dateFrom: string; dateTo: string }) {
  const { data, isLoading } = useSalesReport(dateFrom, dateTo)
  const formatCLP = (n: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(n)

  if (isLoading) return <LoadingSpinner />
  if (!data) return null

  const maxDayTotal = Math.max(...data.ventasPorDia.map((d) => d.total), 1)

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Ingresos totales" value={formatCLP(data.totalVentas)} icon={<TrendingUp size={18} />} />
        <MetricCard label="Ventas completadas" value={String(data.cantidadVentas)} icon={<ShoppingCart size={18} />} />
        <MetricCard label="Ticket promedio" value={formatCLP(data.ticketPromedio)} icon={<BarChart3 size={18} />} />
        <MetricCard label="Descuentos otorgados" value={formatCLP(data.descuentoTotal)} icon={<Trophy size={18} />} accent="var(--status-success)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Daily chart (bar chart with CSS) */}
        <div
          className="lg:col-span-2 p-5"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px' }}
        >
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Ventas por día</h3>
          {data.ventasPorDia.length > 0 ? (
            <div className="space-y-2">
              {data.ventasPorDia.map((day) => (
                <div key={day.fecha} className="flex items-center gap-3">
                  <span className="text-xs w-20 shrink-0" style={{ color: 'var(--text-muted)' }}>
                    {new Date(day.fecha + 'T12:00:00').toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}
                  </span>
                  <div className="flex-1 h-6 rounded overflow-hidden" style={{ backgroundColor: 'var(--bg-muted)' }}>
                    <div
                      className="h-full rounded"
                      style={{
                        width: `${Math.max(2, (day.total / maxDayTotal) * 100)}%`,
                        backgroundColor: 'var(--btn-primary-bg)',
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium w-24 text-right" style={{ color: 'var(--text-primary)' }}>
                    {formatCLP(day.total)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>Sin ventas en este periodo</p>
          )}
        </div>

        {/* Payment methods */}
        <div
          className="p-5"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px' }}
        >
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Por método de pago</h3>
          {data.ventasPorMetodoPago.length > 0 ? (
            <div className="space-y-3">
              {data.ventasPorMetodoPago.map((pm) => (
                <div key={pm.metodo} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {PAYMENT_LABELS[pm.metodo] ?? pm.metodo}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{pm.cantidad} ventas</p>
                  </div>
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {formatCLP(pm.total)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>Sin datos</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Products Tab ────────────────────────────────────────

function ProductsTab({ dateFrom, dateTo }: { dateFrom: string; dateTo: string }) {
  const { data, isLoading } = useProductsReport(dateFrom, dateTo)
  const formatCLP = (n: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(n)

  if (isLoading) return <LoadingSpinner />
  if (!data) return null

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top products */}
        <div
          className="p-5"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px' }}
        >
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Top 10 productos más vendidos
          </h3>
          {data.topProductos.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['#', 'Producto', 'Uds', 'Ingresos'].map((h) => (
                      <th key={h} className="text-left text-xs font-medium pb-2" style={{ color: 'var(--text-secondary)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.topProductos.map((p, i) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="py-2">
                        <span
                          className="w-5 h-5 inline-flex items-center justify-center text-xs font-bold rounded-full"
                          style={{
                            backgroundColor: i < 3 ? 'var(--btn-primary-bg)' : 'var(--border)',
                            color: i < 3 ? '#fff' : 'var(--text-muted)',
                          }}
                        >
                          {i + 1}
                        </span>
                      </td>
                      <td className="py-2 font-medium" style={{ color: 'var(--text-primary)' }}>{p.nombre}</td>
                      <td className="py-2" style={{ color: 'var(--text-secondary)' }}>{p.cantidad}</td>
                      <td className="py-2 font-semibold" style={{ color: 'var(--text-primary)' }}>{formatCLP(p.ingresos)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>Sin ventas en este periodo</p>
          )}
        </div>

        {/* By category */}
        <div
          className="p-5"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px' }}
        >
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Ventas por categoría
          </h3>
          {data.topCategorias.length > 0 ? (
            <div className="space-y-3">
              {data.topCategorias.map((cat) => {
                const totalIngresos = data.topCategorias.reduce((s, c) => s + c.ingresos, 0)
                const pct = totalIngresos > 0 ? Math.round((cat.ingresos / totalIngresos) * 100) : 0
                return (
                  <div key={cat.nombre}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{cat.nombre}</span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{pct}% · {cat.cantidad} uds</span>
                    </div>
                    <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-muted)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: 'var(--btn-primary-bg)' }}
                      />
                    </div>
                    <p className="text-xs text-right mt-0.5" style={{ color: 'var(--text-secondary)' }}>{formatCLP(cat.ingresos)}</p>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>Sin datos</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Patients Tab ────────────────────────────────────────

function PatientsTab() {
  const { data, isLoading } = usePatientsReport()

  if (isLoading) return <LoadingSpinner />
  if (!data) return null

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard label="Total pacientes" value={String(data.totalPacientes)} icon={<Users size={18} />} />
      <MetricCard label="Nuevos este mes" value={String(data.nuevosEsteMes)} icon={<Users size={18} />} accent="var(--status-success)" />
      <MetricCard label="Con receta" value={String(data.conReceta)} icon={<BarChart3 size={18} />} />
      <MetricCard label="Con compra" value={String(data.conCompra)} icon={<ShoppingCart size={18} />} />
    </div>
  )
}

// ── Shared components ───────────────────────────────────

function MetricCard({ label, value, icon, accent }: { label: string; value: string; icon: React.ReactNode; accent?: string }) {
  return (
    <div
      className="p-5"
      style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px' }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</p>
          <p className="text-2xl font-bold mt-1" style={{ color: accent ?? 'var(--text-primary)' }}>{value}</p>
        </div>
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: 'var(--badge-primary-bg)', color: 'var(--badge-primary-text)' }}
        >
          {icon}
        </div>
      </div>
    </div>
  )
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--btn-primary-bg)' }} />
    </div>
  )
}

// ── Helpers ─────────────────────────────────────────────

function getLastMonthStart() {
  const d = new Date()
  d.setMonth(d.getMonth() - 1)
  d.setDate(1)
  return d.toISOString().split('T')[0]
}

function getLastMonthEnd() {
  const d = new Date()
  d.setDate(0)
  return d.toISOString().split('T')[0]
}
