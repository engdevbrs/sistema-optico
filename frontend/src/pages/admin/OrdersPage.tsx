import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, Plus, Eye } from 'lucide-react'
import { useOrders } from '../../hooks/useOrders'
import { ORDER_STATUS_CONFIG } from '../../types/order'
import type { OrderStatus } from '../../types/order'

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('')
  const { data: orders, isLoading, error } = useOrders(statusFilter || undefined)

  const formatCLP = (n: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(n)
  const formatUSD = (n: number) => `US$${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
  const formatDate = (d: string) => new Date(d).toLocaleDateString('es-CL')

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>Pedidos</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {orders?.length ?? 0} pedidos registrados
          </p>
        </div>
        <Link
          to="/admin/pedidos/nuevo"
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium self-start sm:self-auto"
          style={{ backgroundColor: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', borderRadius: '6px' }}
        >
          <Plus size={18} />
          Nuevo pedido
        </Link>
      </div>

      <div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as OrderStatus | '')}
          className="text-sm py-2.5 px-3"
          style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '6px', color: 'var(--text-primary)' }}
        >
          <option value="">Todos los estados</option>
          {(Object.keys(ORDER_STATUS_CONFIG) as OrderStatus[]).map((s) => (
            <option key={s} value={s}>{ORDER_STATUS_CONFIG[s].label}</option>
          ))}
        </select>
      </div>

      <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--btn-primary-bg)' }} />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-sm" style={{ color: 'var(--status-danger)' }}>Error al cargar los pedidos</div>
        ) : orders && orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr style={{ backgroundColor: 'var(--table-header-bg)' }}>
                  {['FECHA', 'PROVEEDOR', 'TOTAL', 'ESTADO', ''].map((h) => (
                    <th key={h} className="text-left text-xs font-medium tracking-wider px-4 py-3" style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const sc = ORDER_STATUS_CONFIG[order.estado]
                  return (
                    <tr
                      key={order.id}
                      style={{ borderBottom: '1px solid var(--border)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--table-row-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td className="px-4 py-3">
                        <span style={{ color: 'var(--text-primary)' }}>{formatDate(order.created_at)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{order.proveedor?.nombre ?? '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{formatCLP(order.total_clp)}</span>
                          {order.tipo_cambio_usado !== 1 && (
                            <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>{formatUSD(order.total_usd)}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center px-2 py-0.5 text-xs font-medium"
                          style={{ backgroundColor: `var(${sc.bgVar})`, color: `var(${sc.textVar})`, borderRadius: '9999px' }}
                        >
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link to={`/admin/pedidos/${order.id}`} className="p-1.5 rounded-md inline-flex" style={{ color: 'var(--text-secondary)' }} title="Ver detalle">
                          <Eye size={16} />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Package size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No hay pedidos</p>
            <Link to="/admin/pedidos/nuevo" className="text-sm font-medium mt-2 inline-block" style={{ color: 'var(--btn-primary-bg)' }}>
              Crear primer pedido
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
