import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart, Plus, Search, Eye, Calendar, X, Ban, CalendarCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { useSales, useCancelSale } from '../../hooks/useSales'
import { useConfig } from '../../hooks/useConfig'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { SALE_STATUS_CONFIG, PAYMENT_METHOD_LABELS } from '../../types/sale'
import type { SaleStatus } from '../../types/sale'

export default function SalesPage() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [statusFilter, setStatusFilter] = useState<SaleStatus | ''>('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [cancelId, setCancelId] = useState<string | null>(null)
  const cancelSale = useCancelSale()
  const { data: config } = useConfig()

  const today = new Date().toISOString().slice(0, 10)
  const isTodayFilter = dateFrom === today && dateTo === today

  const handleTodayFilter = () => {
    if (isTodayFilter) {
      setDateFrom('')
      setDateTo('')
      setStatusFilter('')
    } else {
      setDateFrom(today)
      setDateTo(today)
      setStatusFilter('COMPLETADA')
    }
  }

  const { data: sales, isLoading, error } = useSales({
    search: debouncedSearch,
    status: statusFilter || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  })

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
  }

  const formatCLP = (amount: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Ventas
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {sales?.length ?? 0} ventas registradas
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleTodayFilter}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors"
            style={{
              backgroundColor: isTodayFilter ? 'var(--btn-primary-bg)' : 'var(--bg-surface)',
              color: isTodayFilter ? 'var(--btn-primary-text)' : 'var(--text-secondary)',
              border: isTodayFilter ? '1px solid var(--btn-primary-bg)' : '1px solid var(--border)',
              borderRadius: '6px',
            }}
          >
            <CalendarCheck size={18} />
            Hoy
          </button>
          <Link
            to="/admin/ventas/nueva"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium"
            style={{
              backgroundColor: 'var(--btn-primary-bg)',
              color: 'var(--btn-primary-text)',
              borderRadius: '6px',
            }}
          >
            <Plus size={18} />
            Nueva venta
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div
        className="p-4"
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
        }}
      >
        {/* Search - full width */}
        <div
          className="flex items-center gap-2 px-3 mb-3"
          style={{
            backgroundColor: 'var(--input-bg)',
            border: '1px solid var(--input-border)',
            borderRadius: '6px',
          }}
        >
          <Search size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Buscar por nombre o email del paciente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-sm py-2.5 outline-none bg-transparent"
            style={{ color: 'var(--text-primary)' }}
          />
          {search && (
            <button onClick={() => setSearch('')} aria-label="Limpiar búsqueda">
              <X size={16} style={{ color: 'var(--text-muted)' }} />
            </button>
          )}
        </div>

        {/* Filters row: desktop = row, mobile = grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Status */}
          <div>
            <label className="block text-xs mb-1 font-medium" style={{ color: 'var(--text-muted)' }}>
              Estado
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as SaleStatus | '')}
              className="w-full text-sm py-2.5 px-3"
              style={{
                backgroundColor: 'var(--input-bg)',
                border: '1px solid var(--input-border)',
                borderRadius: '6px',
                color: 'var(--text-primary)',
              }}
            >
              <option value="">Todos los estados</option>
              <option value="EN_PROGRESO">En progreso</option>
              <option value="COMPLETADA">Completada</option>
              <option value="ANULADA">Anulada</option>
            </select>
          </div>

          {/* Date from */}
          <div>
            <label className="block text-xs mb-1 font-medium" style={{ color: 'var(--text-muted)' }}>
              Desde
            </label>
            <div
              className="flex items-center gap-2 px-3"
              style={{
                backgroundColor: 'var(--input-bg)',
                border: '1px solid var(--input-border)',
                borderRadius: '6px',
              }}
            >
              <Calendar size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="flex-1 text-sm py-2.5 outline-none bg-transparent"
                style={{ color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          {/* Date to */}
          <div>
            <label className="block text-xs mb-1 font-medium" style={{ color: 'var(--text-muted)' }}>
              Hasta
            </label>
            <div
              className="flex items-center gap-2 px-3"
              style={{
                backgroundColor: 'var(--input-bg)',
                border: '1px solid var(--input-border)',
                borderRadius: '6px',
              }}
            >
              <Calendar size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="flex-1 text-sm py-2.5 outline-none bg-transparent"
                style={{ color: 'var(--text-primary)' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary — only when filtering completed sales */}
      {statusFilter === 'COMPLETADA' && sales && sales.length > 0 && (() => {
        const completedSales = sales.filter((s) => s.estado === 'COMPLETADA')
        const totalVentas = completedSales.reduce((sum, s) => sum + s.total, 0)
        const totalDescuentos = completedSales.reduce((sum, s) => sum + s.descuento_total, 0)
        const gananciaFinal = totalVentas - totalDescuentos
        const metaDiaria = config?.meta_ventas_diaria ?? 200000
        const porcentajeMeta = metaDiaria > 0 ? (totalVentas / metaDiaria) * 100 : 0

        const getGoalColor = () => {
          if (porcentajeMeta >= 100) return 'var(--status-success)'
          if (porcentajeMeta >= 50) return 'var(--status-warning)'
          return 'var(--status-danger)'
        }

        const getGoalBg = () => {
          if (porcentajeMeta >= 100) return 'var(--badge-success-bg)'
          if (porcentajeMeta >= 50) return 'var(--badge-warning-bg)'
          return 'var(--badge-danger-bg)'
        }

        const getGoalLabel = () => {
          if (porcentajeMeta >= 100) return 'Meta alcanzada'
          if (porcentajeMeta >= 50) return 'En progreso'
          return 'Por debajo de la meta'
        }

        return (
          <div
            className="p-5"
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
            }}
          >
            {/* Top: Ganancia final + badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--text-muted)' }}>
                  Resumen de ventas completadas
                </p>
                <p className="text-3xl font-semibold" style={{ color: getGoalColor() }}>
                  {formatCLP(gananciaFinal)}
                </p>
              </div>
              <span
                className="inline-flex items-center px-3 py-1 text-xs font-medium self-start sm:self-auto"
                style={{
                  backgroundColor: getGoalBg(),
                  color: getGoalColor(),
                  borderRadius: '9999px',
                }}
              >
                {getGoalLabel()} — {Math.round(porcentajeMeta)}%
              </span>
            </div>

            {/* Progress bar */}
            <div
              className="h-2 w-full overflow-hidden mb-4"
              style={{ backgroundColor: 'var(--bg-muted)', borderRadius: '9999px' }}
            >
              <div
                className="h-full transition-all"
                style={{
                  width: `${Math.min(porcentajeMeta, 100)}%`,
                  backgroundColor: getGoalColor(),
                  borderRadius: '9999px',
                }}
              />
            </div>

            {/* Bottom: detail row */}
            <div
              className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4"
              style={{ borderTop: '1px solid var(--border)' }}
            >
              <div>
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Ventas</p>
                <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {completedSales.length}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Total vendido</p>
                <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {formatCLP(totalVentas)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Descuentos</p>
                <p className="text-lg font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  -{formatCLP(totalDescuentos)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Meta diaria</p>
                <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {formatCLP(metaDiaria)}
                </p>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Table */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div
              className="w-6 h-6 border-2 rounded-full animate-spin"
              style={{ borderColor: 'var(--border)', borderTopColor: 'var(--btn-primary-bg)' }}
            />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-sm" style={{ color: 'var(--status-danger)' }}>
            Error al cargar las ventas
          </div>
        ) : sales && sales.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr style={{ backgroundColor: 'var(--table-header-bg)' }}>
                  {['FECHA', 'PACIENTE', 'TOTAL', 'ESTADO', 'PAGO', ''].map((h) => (
                    <th
                      key={h}
                      className="text-left text-xs font-medium tracking-wider px-4 py-3"
                      style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => {
                  const statusConfig = SALE_STATUS_CONFIG[sale.estado]
                  return (
                    <tr
                      key={sale.id}
                      style={{ borderBottom: '1px solid var(--border)' }}
                      className="cursor-pointer"
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--table-row-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {formatDate(sale.created_at)}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {formatTime(sale.created_at)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {sale.paciente?.nombre ?? '—'}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {sale.paciente?.email ?? ''}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {formatCLP(sale.total)}
                        </span>
                        {sale.descuento_total > 0 && (
                          <div className="text-xs" style={{ color: 'var(--status-success)' }}>
                            -{formatCLP(sale.descuento_total)} desc.
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center px-2 py-0.5 text-xs font-medium"
                          style={{
                            backgroundColor: `var(${statusConfig.bgVar})`,
                            color: `var(${statusConfig.textVar})`,
                            borderRadius: '9999px',
                          }}
                        >
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {sale.metodo_pago ? PAYMENT_METHOD_LABELS[sale.metodo_pago] : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Link
                            to={`/admin/ventas/${sale.id}`}
                            className="p-1.5 rounded-md inline-flex"
                            style={{ color: 'var(--text-secondary)' }}
                            title="Ver detalle"
                          >
                            <Eye size={16} />
                          </Link>
                          {(sale.estado === 'EN_PROGRESO' || sale.estado === 'COMPLETADA') && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setCancelId(sale.id)
                              }}
                              className="p-1.5 rounded-md inline-flex"
                              style={{ color: 'var(--status-danger)' }}
                              title="Cancelar venta"
                            >
                              <Ban size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <ShoppingCart size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              No hay ventas registradas
            </p>
            <Link
              to="/admin/ventas/nueva"
              className="text-sm font-medium mt-2 inline-block"
              style={{ color: 'var(--btn-primary-bg)' }}
            >
              Crear primera venta
            </Link>
          </div>
        )}
      </div>

      {cancelId && (
        <ConfirmModal
          title="Cancelar venta en progreso"
          message="Esta venta no fue completada. Los productos reservados se liberarán del inventario."
          confirmLabel="Sí, cancelar"
          loadingLabel="Cancelando venta..."
          danger
          loading={cancelSale.isPending}
          onConfirm={async () => {
            try {
              await cancelSale.mutateAsync(cancelId)
              toast.success('Venta cancelada. Stock liberado.')
              setCancelId(null)
            } catch {
              toast.error('Error al cancelar la venta')
            }
          }}
          onCancel={() => setCancelId(null)}
        />
      )}
    </div>
  )
}
