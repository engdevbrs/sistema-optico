import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Truck, PackageCheck, Ban, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { useOrder, useUpdateOrderStatus, useReceiveOrderItems } from '../../hooks/useOrders'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { ORDER_STATUS_CONFIG } from '../../types/order'
import type { OrderStatus } from '../../types/order'

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: order, isLoading, error } = useOrder(id)
  const updateStatus = useUpdateOrderStatus()
  const receiveItems = useReceiveOrderItems()
  const [showCancel, setShowCancel] = useState(false)
  const [showReceive, setShowReceive] = useState(false)
  const [receiveQtys, setReceiveQtys] = useState<Record<string, number>>({})

  const formatUSD = (n: number) => `US$${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
  const formatCLP = (n: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(n)
  const formatDate = (d: string | null) => d ? new Date(d + 'T12:00:00').toLocaleDateString('es-CL') : '—'

  const handleStatusChange = async (newStatus: OrderStatus, extras?: Record<string, string | null>) => {
    try {
      await updateStatus.mutateAsync({ id: id!, estado: newStatus, ...extras })
      toast.success(`Estado actualizado: ${ORDER_STATUS_CONFIG[newStatus].label}`)
    } catch {
      toast.error('Error al actualizar estado')
    }
  }

  const handleReceive = async () => {
    const itemsToReceive = Object.entries(receiveQtys)
      .filter(([, qty]) => qty > 0)
      .map(([itemId, qty]) => {
        const item = order?.items?.find((i) => i.id === itemId)
        return { item_id: itemId, producto_id: item?.producto_id ?? '', cantidad_recibida: qty }
      })

    if (itemsToReceive.length === 0) {
      toast.error('Ingresa las cantidades recibidas')
      return
    }

    try {
      await receiveItems.mutateAsync({ pedido_id: id!, items: itemsToReceive })
      toast.success('Stock actualizado')
      setShowReceive(false)
      setReceiveQtys({})
    } catch {
      toast.error('Error al registrar recepción')
    }
  }

  const handleCancel = async () => {
    try {
      await updateStatus.mutateAsync({ id: id!, estado: 'CANCELADO' })
      toast.success('Pedido cancelado')
      setShowCancel(false)
    } catch {
      toast.error('Error al cancelar')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--btn-primary-bg)' }} />
      </div>
    )
  }

  if (error || !order) {
    return <div className="text-center py-12 text-sm" style={{ color: 'var(--status-danger)' }}>Error al cargar el pedido</div>
  }

  const sc = ORDER_STATUS_CONFIG[order.estado]
  const isLocal = order.tipo_cambio_usado === 1
  const canMarkSent = order.estado === 'BORRADOR'
  const canMarkTransit = order.estado === 'ENVIADO'
  const canReceive = ['ENVIADO', 'EN_TRANSITO', 'RECIBIDO_PARCIAL'].includes(order.estado)
  const canCancel = !['RECIBIDO', 'CANCELADO'].includes(order.estado)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/pedidos')} className="p-2 rounded-md shrink-0" style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }} aria-label="Volver">
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>Pedido</h1>
              <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: `var(${sc.bgVar})`, color: `var(${sc.textVar})`, borderRadius: '9999px' }}>
                {sc.label}
              </span>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {order.proveedor?.nombre} · {formatDate(order.created_at.split('T')[0])}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 self-start sm:self-auto">
          {canMarkSent && (
            <button
              onClick={() => handleStatusChange('ENVIADO', { fecha_envio: new Date().toISOString().split('T')[0] })}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium"
              style={{ backgroundColor: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', borderRadius: '6px' }}
            >
              <Truck size={16} />
              Marcar enviado
            </button>
          )}
          {canMarkTransit && (
            <button
              onClick={() => handleStatusChange('EN_TRANSITO')}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium"
              style={{ backgroundColor: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', borderRadius: '6px' }}
            >
              <Truck size={16} />
              En tránsito
            </button>
          )}
          {canReceive && (
            <button
              onClick={() => {
                const qtys: Record<string, number> = {}
                order.items?.forEach((i) => { qtys[i.id] = Math.max(0, i.cantidad_pedida - i.cantidad_recibida) })
                setReceiveQtys(qtys)
                setShowReceive(true)
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium"
              style={{ backgroundColor: 'var(--status-success)', color: '#fff', borderRadius: '6px' }}
            >
              <PackageCheck size={16} />
              Registrar recepción
            </button>
          )}
          {canCancel && (
            <button
              onClick={() => setShowCancel(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium"
              style={{ backgroundColor: 'var(--btn-danger-bg)', color: 'var(--btn-danger-text)', borderRadius: '6px' }}
            >
              <Ban size={16} />
              Cancelar
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Info */}
        <div className="space-y-4">
          <InfoCard label="PROVEEDOR" value={order.proveedor?.nombre ?? '—'} />
          <InfoCard
            label="TOTAL"
            value={formatCLP(order.total_clp)}
            sub={isLocal ? undefined : `${formatUSD(order.total_usd)} · TC: $${order.tipo_cambio_usado}`}
          />
          <InfoCard label="FECHA ENVÍO" value={formatDate(order.fecha_envio)} />
          <InfoCard label="RECEPCIÓN ESTIMADA" value={formatDate(order.fecha_recepcion_estimada)} />
          <InfoCard label="RECEPCIÓN REAL" value={formatDate(order.fecha_recepcion_real)} />
          {order.notas && <InfoCard label="NOTAS" value={order.notas} />}
        </div>

        {/* Items */}
        <div className="md:col-span-2 p-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px' }}>
          <h3 className="text-xs font-medium tracking-wider mb-4" style={{ color: 'var(--text-secondary)' }}>PRODUCTOS</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[450px]">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Producto', isLocal ? 'Precio' : 'Precio USD', 'Pedido', 'Recibido', 'Estado'].map((h) => (
                    <th key={h} className="text-left text-xs font-medium tracking-wider pb-2" style={{ color: 'var(--text-secondary)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item) => {
                  const fulfilled = item.cantidad_recibida >= item.cantidad_pedida
                  const partial = item.cantidad_recibida > 0 && !fulfilled
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="py-3">
                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{item.producto?.nombre ?? '—'}</p>
                        {item.producto?.sku && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.producto.sku}</p>}
                      </td>
                      <td className="py-3" style={{ color: 'var(--text-primary)' }}>{isLocal ? formatCLP(item.precio_unitario_usd) : formatUSD(item.precio_unitario_usd)}</td>
                      <td className="py-3" style={{ color: 'var(--text-primary)' }}>{item.cantidad_pedida}</td>
                      <td className="py-3" style={{ color: fulfilled ? 'var(--status-success)' : partial ? 'var(--badge-warning-text)' : 'var(--text-muted)' }}>
                        {item.cantidad_recibida}
                      </td>
                      <td className="py-3">
                        {fulfilled ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--status-success)' }}>
                            <Check size={12} /> Completo
                          </span>
                        ) : partial ? (
                          <span className="text-xs font-medium" style={{ color: 'var(--badge-warning-text)' }}>Parcial</span>
                        ) : (
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Pendiente</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Receive modal */}
      {showReceive && createPortal(
        <>
          <div className="fixed inset-0 bg-black/50 z-[60]" onClick={() => setShowReceive(false)} />
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" onClick={() => setShowReceive(false)}>
            <div
              className="w-full max-w-lg max-h-[90vh] overflow-y-auto"
              style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '8px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Registrar recepción</h2>
                <button onClick={() => setShowReceive(false)} aria-label="Cerrar" style={{ color: 'var(--text-secondary)' }}>✕</button>
              </div>

              <div className="p-4 space-y-3">
                {order.items?.map((item) => {
                  const remaining = item.cantidad_pedida - item.cantidad_recibida
                  if (remaining <= 0) return null
                  return (
                    <div key={item.id} className="flex items-center justify-between p-3" style={{ border: '1px solid var(--border)', borderRadius: '6px' }}>
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.producto?.nombre}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          Pedido: {item.cantidad_pedida} · Recibido: {item.cantidad_recibida} · Falta: {remaining}
                        </p>
                      </div>
                      <input
                        type="number"
                        min={0}
                        max={remaining}
                        value={receiveQtys[item.id] ?? 0}
                        onChange={(e) => setReceiveQtys((prev) => ({ ...prev, [item.id]: Math.min(remaining, Math.max(0, Number(e.target.value))) }))}
                        className="w-16 text-sm text-center py-1.5 outline-none"
                        style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '6px', color: 'var(--text-primary)' }}
                      />
                    </div>
                  )
                })}
              </div>

              <div className="p-4 flex justify-end gap-3" style={{ borderTop: '1px solid var(--border)' }}>
                <button onClick={() => setShowReceive(false)} className="px-4 py-2 text-sm" style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: '6px' }}>
                  Cancelar
                </button>
                <button
                  onClick={handleReceive}
                  disabled={receiveItems.isPending}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium"
                  style={{ backgroundColor: 'var(--status-success)', color: '#fff', borderRadius: '6px', opacity: receiveItems.isPending ? 0.6 : 1 }}
                >
                  <PackageCheck size={16} />
                  {receiveItems.isPending ? 'Procesando...' : 'Confirmar recepción'}
                </button>
              </div>
            </div>
          </div>
        </>,
        document.body,
      )}

      {showCancel && (
        <ConfirmModal
          title="Cancelar pedido"
          message="¿Estás seguro de cancelar este pedido?"
          confirmLabel="Sí, cancelar"
          danger
          onConfirm={handleCancel}
          onCancel={() => setShowCancel(false)}
        />
      )}
    </div>
  )
}

function InfoCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="p-4 space-y-1" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px' }}>
      <h3 className="text-xs font-medium tracking-wider" style={{ color: 'var(--text-secondary)' }}>{label}</h3>
      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{value}</p>
      {sub && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
    </div>
  )
}
