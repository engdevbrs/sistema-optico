import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Edit, Package, ArrowUpCircle, ArrowDownCircle, TrendingUp, TrendingDown } from 'lucide-react'
import { useProduct, useStockMovements, useAdjustStock } from '../../hooks/useProducts'
import { getStockLevel, STOCK_LEVEL_CONFIG } from '../../types/product'
import toast from 'react-hot-toast'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatPrice(val: number | null): string {
  if (val === null || val === undefined) return '—'
  return `$${val.toLocaleString('es-CL')}`
}

export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: product, isLoading } = useProduct(id)
  const { data: movements } = useStockMovements(id)
  const adjustStock = useAdjustStock()

  const [showAdjust, setShowAdjust] = useState(false)
  const [adjustType, setAdjustType] = useState<'ENTRADA' | 'SALIDA'>('ENTRADA')
  const [adjustQty, setAdjustQty] = useState('')
  const [adjustNote, setAdjustNote] = useState('')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--btn-primary-bg)' }} />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-sm" style={{ color: 'var(--status-danger)' }}>Producto no encontrado</p>
        <button onClick={() => navigate('/admin/inventario')} className="mt-3 text-sm font-medium" style={{ color: 'var(--btn-primary-bg)' }}>
          Volver a inventario
        </button>
      </div>
    )
  }

  const level = getStockLevel(product, product.categoria)
  const levelConfig = STOCK_LEVEL_CONFIG[level]

  // Calcular precio venta
  let precioVenta: number | null = null
  if (product.precio_venta_fijo) {
    precioVenta = product.precio_venta_fijo
  } else if (product.precio_compra_clp) {
    const mult = product.multiplicador ?? product.categoria?.multiplicador ?? product.proveedor?.multiplicador ?? 2.5
    precioVenta = Math.round(product.precio_compra_clp * mult)
  }

  function handleAdjust() {
    const qty = parseInt(adjustQty)
    if (!qty || qty <= 0) {
      toast.error('Ingresa una cantidad válida')
      return
    }
    adjustStock.mutate(
      { productId: product!.id, tipo: adjustType, cantidad: qty, nota: adjustNote },
      {
        onSuccess: () => {
          toast.success(`Stock ${adjustType === 'ENTRADA' ? 'ingresado' : 'descontado'}`)
          setShowAdjust(false)
          setAdjustQty('')
          setAdjustNote('')
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Error al ajustar stock'),
      },
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={() => navigate('/admin/inventario')}
            className="p-2 rounded-md transition-colors shrink-0"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            aria-label="Volver"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{product.nombre}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              {product.sku && <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>SKU: {product.sku}</span>}
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{product.categoria?.nombre}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setShowAdjust(!showAdjust)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium"
            style={{ color: 'var(--btn-secondary-text)', border: '1px solid var(--btn-secondary-border)', borderRadius: '6px' }}
          >
            <Package size={16} />
            Ajustar stock
          </button>
          <Link
            to={`/admin/inventario/${product.id}/editar`}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors"
            style={{ backgroundColor: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', borderRadius: '6px' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--btn-primary-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--btn-primary-bg)')}
          >
            <Edit size={16} />
            Editar
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info */}
        <div className="lg:col-span-1 space-y-5">
          {/* Stock */}
          <div className="p-5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px' }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Stock</h3>
            <div className="text-center py-3">
              <p className="text-4xl font-bold" style={{ color: `var(${levelConfig.textVar})` }}>
                {product.stock_actual}
              </p>
              <span
                className="inline-flex px-3 py-1 mt-2 text-xs font-medium"
                style={{ backgroundColor: `var(${levelConfig.bgVar})`, color: `var(${levelConfig.textVar})`, borderRadius: '9999px' }}
              >
                {levelConfig.label}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
              <div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Óptimo</p>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{product.stock_optimo ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Umbral medio</p>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{product.umbral_stock_medio ?? product.categoria?.umbral_stock_medio ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Umbral mínimo</p>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{product.umbral_stock_minimo ?? product.categoria?.umbral_stock_minimo ?? '—'}</p>
              </div>
            </div>
          </div>

          {/* Precios */}
          <div className="p-5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px' }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Precios</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Costo (USD)</p>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{product.precio_compra_usd ? `$${product.precio_compra_usd} USD` : '—'}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Costo (CLP)</p>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{formatPrice(product.precio_compra_clp)}</p>
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Precio venta</p>
                <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{formatPrice(precioVenta)}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Multiplicador</p>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {product.multiplicador ?? product.categoria?.multiplicador ?? product.proveedor?.multiplicador ?? '2.5'}x
                </p>
              </div>
            </div>
          </div>

          {/* Proveedor */}
          {product.proveedor && (
            <div className="p-5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px' }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Proveedor</h3>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{product.proveedor.nombre}</p>
              {product.alibaba_product_url && (
                <a
                  href={product.alibaba_product_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex mt-2 text-xs font-medium"
                  style={{ color: 'var(--btn-primary-bg)' }}
                >
                  Ver en Alibaba →
                </a>
              )}
            </div>
          )}
        </div>

        {/* Stock adjust + Movements */}
        <div className="lg:col-span-2 space-y-5">
          {/* Adjust Stock */}
          {showAdjust && (
            <div className="p-5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px' }}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Ajustar stock</h3>
              <div className="flex gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setAdjustType('ENTRADA')}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium flex-1 justify-center"
                  style={{
                    backgroundColor: adjustType === 'ENTRADA' ? 'var(--badge-success-bg)' : 'transparent',
                    color: adjustType === 'ENTRADA' ? 'var(--badge-success-text)' : 'var(--text-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                  }}
                >
                  <ArrowUpCircle size={16} />
                  Entrada
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('SALIDA')}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium flex-1 justify-center"
                  style={{
                    backgroundColor: adjustType === 'SALIDA' ? 'var(--badge-danger-bg)' : 'transparent',
                    color: adjustType === 'SALIDA' ? 'var(--badge-danger-text)' : 'var(--text-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                  }}
                >
                  <ArrowDownCircle size={16} />
                  Salida
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Cantidad</label>
                  <input
                    type="number"
                    min="1"
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(e.target.value)}
                    placeholder="1"
                    className="w-full px-3 py-2 text-sm outline-none"
                    style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '6px', color: 'var(--input-text)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Nota</label>
                  <input
                    type="text"
                    value={adjustNote}
                    onChange={(e) => setAdjustNote(e.target.value)}
                    placeholder="Motivo del ajuste..."
                    className="w-full px-3 py-2 text-sm outline-none"
                    style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '6px', color: 'var(--input-text)' }}
                  />
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <button
                  onClick={handleAdjust}
                  disabled={adjustStock.isPending}
                  className="px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
                  style={{ backgroundColor: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', borderRadius: '6px' }}
                >
                  {adjustStock.isPending ? 'Ajustando...' : 'Aplicar ajuste'}
                </button>
              </div>
            </div>
          )}

          {/* Movements */}
          <div className="p-5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px' }}>
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Historial de movimientos</h3>
            {movements && movements.length > 0 ? (
              <div className="space-y-2">
                {movements.map((mov) => (
                  <div
                    key={mov.id}
                    className="flex items-center justify-between py-2 px-3 rounded-md"
                    style={{ backgroundColor: 'var(--bg-muted)', borderRadius: '6px' }}
                  >
                    <div className="flex items-center gap-3">
                      {mov.tipo === 'ENTRADA' ? (
                        <TrendingUp size={16} style={{ color: 'var(--status-success)' }} />
                      ) : (
                        <TrendingDown size={16} style={{ color: 'var(--status-danger)' }} />
                      )}
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {mov.tipo === 'ENTRADA' ? '+' : '-'}{mov.cantidad} unidades
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {mov.origen} {mov.nota && `· ${mov.nota}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                        {mov.stock_anterior} → {mov.stock_nuevo}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {formatDate(mov.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>
                Sin movimientos registrados
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
