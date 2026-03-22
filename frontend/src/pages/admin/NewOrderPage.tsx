import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Minus, X, Search, Check, Package } from 'lucide-react'
import toast from 'react-hot-toast'
import { useSuppliers, useProducts } from '../../hooks/useProducts'
import { useCreateOrder } from '../../hooks/useOrders'
import { useExchangeRate } from '../../hooks/useExchangeRate'
import type { OrderCartItem } from '../../types/order'
import type { Product } from '../../types/product'

export default function NewOrderPage() {
  const navigate = useNavigate()
  const { data: suppliers } = useSuppliers()
  const { data: rateData } = useExchangeRate()
  const exchangeRate = rateData?.tasa
  const createOrder = useCreateOrder()

  const [proveedorId, setProveedorId] = useState('')
  const [notas, setNotas] = useState('')
  const [items, setItems] = useState<OrderCartItem[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [costoEnvio, setCostoEnvio] = useState('')
  const [seguroPct, setSeguroPct] = useState('1')

  const { data: products } = useProducts(productSearch)

  const selectedSupplier = suppliers?.find((s) => s.id === proveedorId)
  const isLocal = selectedSupplier?.tipo === 'LOCAL'

  // Filter products by selected supplier
  const filteredProducts = products?.filter((p) =>
    proveedorId ? p.proveedor_id === proveedorId : true
  ) ?? []

  const formatUSD = (n: number) => `US$${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
  const formatCLP = (n: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(n)

  // For local suppliers: precio_unitario_usd stores CLP directly, tipo_cambio = 1
  const totalProductosUSD = items.reduce((sum, i) => sum + i.precio_unitario_usd * i.cantidad, 0)

  // Costos de internación (solo internacional)
  const ARANCEL_PCT = 0.06
  const IVA_IMPORT_PCT = 0.19

  const envioUsd = Number(costoEnvio) || 0
  const seguroUsd = !isLocal ? Math.round(totalProductosUSD * (Number(seguroPct) / 100) * 100) / 100 : 0
  const cifUsd = Math.round((totalProductosUSD + envioUsd + seguroUsd) * 100) / 100
  const arancelUsd = Math.round(cifUsd * ARANCEL_PCT * 100) / 100
  const ivaImportUsd = Math.round((cifUsd + arancelUsd) * IVA_IMPORT_PCT * 100) / 100
  const totalLandedUsd = Math.round((cifUsd + arancelUsd + ivaImportUsd) * 100) / 100

  const totalUSD = isLocal ? totalProductosUSD : totalProductosUSD
  const tipoCambio = isLocal ? 1 : (exchangeRate ?? 950)
  const totalCLP = isLocal ? totalProductosUSD : Math.round(totalProductosUSD * tipoCambio)
  const totalLandedCLP = Math.round(totalLandedUsd * tipoCambio)

  const handleAddProduct = (product: Product) => {
    if (items.some((i) => i.producto_id === product.id)) {
      toast.error('Producto ya agregado')
      return
    }

    const precio = isLocal
      ? (product.precio_compra_clp ?? 0)
      : (product.precio_compra_usd ?? 0)

    setItems([...items, {
      producto_id: product.id,
      nombre: product.nombre,
      sku: product.sku,
      stock_actual: product.stock_actual,
      cantidad: product.stock_optimo ? Math.max(1, (product.stock_optimo ?? 10) - product.stock_actual) : 10,
      precio_unitario_usd: precio,
    }])
  }

  const handleRemoveItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx))
  }

  const handleItemChange = (idx: number, field: 'cantidad' | 'precio_unitario_usd', value: number) => {
    const newItems = [...items]
    newItems[idx] = { ...newItems[idx], [field]: value }
    setItems(newItems)
  }

  const handleChangeSupplier = (newId: string) => {
    setProveedorId(newId)
    setItems([]) // Reset cart when changing supplier (prices change)
    setCostoEnvio('')
    setSeguroPct('1')
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!proveedorId) { toast.error('Selecciona un proveedor'); return }
    if (items.length === 0) { toast.error('Agrega al menos un producto'); return }

    try {
      const order = await createOrder.mutateAsync({
        proveedor_id: proveedorId,
        notas: notas || null,
        items: items.map((i) => ({
          producto_id: i.producto_id,
          cantidad: i.cantidad,
          precio_unitario_usd: i.precio_unitario_usd,
        })),
        tipo_cambio: tipoCambio,
        ...(!isLocal && envioUsd > 0 ? {
          costos_internacion: {
            costo_envio_usd: envioUsd,
            seguro_usd: seguroUsd,
            cif_usd: cifUsd,
            arancel_usd: arancelUsd,
            iva_importacion_usd: ivaImportUsd,
            total_landed_usd: totalLandedUsd,
            total_landed_clp: totalLandedCLP,
          },
        } : {}),
      })
      toast.success('Pedido creado')
      navigate(`/admin/pedidos/${order.id}`)
    } catch {
      toast.error('Error al crear el pedido')
    }
  }

  const currencyLabel = isLocal ? 'CLP' : 'US$'
  const formatPrice = (n: number) => isLocal ? formatCLP(n) : formatUSD(n)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/admin/pedidos')}
          className="p-2 rounded-md"
          style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
          aria-label="Volver"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          Nuevo pedido
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Supplier + info */}
        <div
          className="p-4 space-y-4"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px' }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1 font-medium" style={{ color: 'var(--text-secondary)' }}>Proveedor *</label>
              <select
                value={proveedorId}
                onChange={(e) => handleChangeSupplier(e.target.value)}
                className="w-full text-sm py-2.5 px-3"
                style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '6px', color: 'var(--text-primary)' }}
              >
                <option value="">Seleccionar...</option>
                {suppliers?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre} {s.tipo === 'LOCAL' ? '(Local)' : '(Internacional)'}
                  </option>
                ))}
              </select>
            </div>
            {isLocal ? (
              <div>
                <label className="block text-sm mb-1 font-medium" style={{ color: 'var(--text-secondary)' }}>Moneda</label>
                <div
                  className="flex items-center gap-2 w-full text-sm py-2.5 px-3"
                  style={{ backgroundColor: 'var(--bg-muted)', border: '1px solid var(--input-border)', borderRadius: '6px', color: 'var(--text-secondary)' }}
                >
                  <span
                    className="inline-flex items-center px-2 py-0.5 text-xs font-medium"
                    style={{ backgroundColor: 'var(--badge-success-bg)', color: 'var(--badge-success-text)', borderRadius: '9999px' }}
                  >
                    Local
                  </span>
                  Precios en CLP (peso chileno)
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm mb-1 font-medium" style={{ color: 'var(--text-secondary)' }}>Tipo de cambio (USD/CLP)</label>
                <div
                  className="flex items-center gap-2 w-full text-sm py-2.5 px-3"
                  style={{ backgroundColor: 'var(--bg-muted)', border: '1px solid var(--input-border)', borderRadius: '6px', color: 'var(--text-secondary)' }}
                >
                  <span
                    className="inline-flex items-center px-2 py-0.5 text-xs font-medium"
                    style={{ backgroundColor: 'var(--badge-primary-bg)', color: 'var(--badge-primary-text)', borderRadius: '9999px' }}
                  >
                    Internacional
                  </span>
                  {exchangeRate ? `$${exchangeRate.toLocaleString('es-CL')} CLP por USD` : 'Cargando...'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Product search + items */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div
            className="p-4 space-y-3"
            style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px' }}
          >
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Agregar productos</h3>
            <div className="flex items-center gap-2 px-3" style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '6px' }}>
              <Search size={16} style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Buscar producto..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="flex-1 text-sm py-2 outline-none bg-transparent"
                style={{ color: 'var(--text-primary)' }}
              />
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {filteredProducts.map((product) => {
                const inCart = items.some((i) => i.producto_id === product.id)
                const precio = isLocal ? product.precio_compra_clp : product.precio_compra_usd
                return (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-2.5"
                    style={{ border: '1px solid var(--border)', borderRadius: '6px', opacity: inCart ? 0.5 : 1 }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{product.nombre}</p>
                      <div className="flex gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <span>Stock: {product.stock_actual}</span>
                        {precio != null && <span>{isLocal ? formatCLP(precio) : `US$${precio}`}</span>}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddProduct(product)}
                      disabled={inCart}
                      className="p-1.5 rounded-md"
                      style={{ backgroundColor: inCart ? 'var(--status-success)' : 'var(--btn-primary-bg)', color: '#fff' }}
                    >
                      {inCart ? <Check size={14} /> : <Plus size={14} />}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Cart */}
          <div
            className="p-4 space-y-3"
            style={{ backgroundColor: 'var(--bg-muted)', borderRadius: '8px' }}
          >
            <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Package size={16} />
              Pedido ({items.length})
            </h3>

            {items.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>Agrega productos</p>
            ) : (
              <>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {items.map((item, idx) => (
                    <div
                      key={item.producto_id}
                      className="p-3"
                      style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '6px' }}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.nombre}</p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Stock actual: {item.stock_actual}</p>
                        </div>
                        <button type="button" onClick={() => handleRemoveItem(idx)} className="p-1" style={{ color: 'var(--status-danger)' }}>
                          <X size={14} />
                        </button>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1">
                          <label className="text-xs" style={{ color: 'var(--text-muted)' }}>Cant:</label>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleItemChange(idx, 'cantidad', Math.max(1, item.cantidad - 1))}
                              className="w-6 h-6 flex items-center justify-center rounded"
                              style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                            >
                              <Minus size={10} />
                            </button>
                            <input
                              type="number"
                              min={1}
                              value={item.cantidad}
                              onChange={(e) => handleItemChange(idx, 'cantidad', Math.max(1, Number(e.target.value)))}
                              className="w-14 text-sm text-center py-1 outline-none"
                              style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '4px', color: 'var(--text-primary)' }}
                            />
                            <button
                              type="button"
                              onClick={() => handleItemChange(idx, 'cantidad', item.cantidad + 1)}
                              className="w-6 h-6 flex items-center justify-center rounded"
                              style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                            >
                              <Plus size={10} />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <label className="text-xs" style={{ color: 'var(--text-muted)' }}>{currencyLabel}:</label>
                          <input
                            type="number"
                            min={0}
                            step={isLocal ? 1 : 0.01}
                            value={item.precio_unitario_usd}
                            onChange={(e) => handleItemChange(idx, 'precio_unitario_usd', Number(e.target.value))}
                            className="w-24 text-sm text-center py-1 outline-none"
                            style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '4px', color: 'var(--text-primary)' }}
                          />
                        </div>
                        <span className="text-sm font-semibold ml-auto" style={{ color: 'var(--text-primary)' }}>
                          {formatPrice(item.precio_unitario_usd * item.cantidad)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-3 space-y-1.5" style={{ borderTop: '1px solid var(--border)' }}>
                  {isLocal ? (
                    <div className="flex justify-between text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      <span>Total CLP</span>
                      <span>{formatCLP(totalCLP)}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <span>Productos (FOB)</span>
                        <span>{formatUSD(totalProductosUSD)}</span>
                      </div>
                      {envioUsd > 0 && (
                        <>
                          <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
                            <span>Envío</span>
                            <span>{formatUSD(envioUsd)}</span>
                          </div>
                          <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
                            <span>Seguro ({seguroPct}%)</span>
                            <span>{formatUSD(seguroUsd)}</span>
                          </div>
                          <div className="flex justify-between text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                            <span>CIF</span>
                            <span>{formatUSD(cifUsd)}</span>
                          </div>
                          <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
                            <span>Arancel (6%)</span>
                            <span>{formatUSD(arancelUsd)}</span>
                          </div>
                          <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
                            <span>IVA importación (19%)</span>
                            <span>{formatUSD(ivaImportUsd)}</span>
                          </div>
                          <div className="flex justify-between text-sm font-semibold pt-1" style={{ color: 'var(--text-primary)', borderTop: '1px dashed var(--border)' }}>
                            <span>Total landed</span>
                            <span>{formatUSD(totalLandedUsd)}</span>
                          </div>
                          <div className="flex justify-between text-sm" style={{ color: 'var(--text-secondary)' }}>
                            <span>Total landed CLP</span>
                            <span>{formatCLP(totalLandedCLP)}</span>
                          </div>
                        </>
                      )}
                      {envioUsd === 0 && (
                        <>
                          <div className="flex justify-between text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                            <span>Total USD</span>
                            <span>{formatUSD(totalUSD)}</span>
                          </div>
                          <div className="flex justify-between text-sm" style={{ color: 'var(--text-secondary)' }}>
                            <span>Total CLP (aprox.)</span>
                            <span>{formatCLP(totalCLP)}</span>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Costos de internación — solo pedidos internacionales con items */}
        {!isLocal && items.length > 0 && (
          <div
            className="p-4 space-y-3"
            style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px' }}
          >
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Costos de internación
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Ingresa el costo de envío y el sistema calcula automáticamente CIF, arancel (6%) e IVA importación (19%).
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Costo envío (USD)</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={costoEnvio}
                  onChange={(e) => setCostoEnvio(e.target.value)}
                  placeholder="45.00"
                  className="w-full text-sm py-2 px-3 outline-none"
                  style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '6px', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Seguro (%)</label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  step="0.1"
                  value={seguroPct}
                  onChange={(e) => setSeguroPct(e.target.value)}
                  placeholder="1"
                  className="w-full text-sm py-2 px-3 outline-none"
                  style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '6px', color: 'var(--text-primary)' }}
                />
              </div>
            </div>
            {envioUsd > 0 && (
              <div
                className="p-3 rounded-md space-y-1.5 text-xs"
                style={{ backgroundColor: 'var(--bg-muted)', border: '1px dashed var(--border)' }}
              >
                <div className="flex justify-between" style={{ color: 'var(--text-muted)' }}>
                  <span>FOB (productos)</span>
                  <span>{formatUSD(totalProductosUSD)}</span>
                </div>
                <div className="flex justify-between" style={{ color: 'var(--text-muted)' }}>
                  <span>+ Envío</span>
                  <span>{formatUSD(envioUsd)}</span>
                </div>
                <div className="flex justify-between" style={{ color: 'var(--text-muted)' }}>
                  <span>+ Seguro ({seguroPct}%)</span>
                  <span>{formatUSD(seguroUsd)}</span>
                </div>
                <div className="flex justify-between font-medium pt-1" style={{ color: 'var(--text-secondary)', borderTop: '1px solid var(--border)' }}>
                  <span>= CIF</span>
                  <span>{formatUSD(cifUsd)}</span>
                </div>
                <div className="flex justify-between" style={{ color: 'var(--text-muted)' }}>
                  <span>+ Arancel (6%)</span>
                  <span>{formatUSD(arancelUsd)}</span>
                </div>
                <div className="flex justify-between" style={{ color: 'var(--text-muted)' }}>
                  <span>+ IVA importación (19%)</span>
                  <span>{formatUSD(ivaImportUsd)}</span>
                </div>
                <div className="flex justify-between font-semibold text-sm pt-1" style={{ color: 'var(--text-primary)', borderTop: '1px solid var(--border)' }}>
                  <span>Total landed</span>
                  <span>{formatUSD(totalLandedUsd)}</span>
                </div>
                <div className="flex justify-between font-medium" style={{ color: 'var(--text-secondary)' }}>
                  <span>Total landed CLP</span>
                  <span>{formatCLP(totalLandedCLP)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        <div
          className="p-4"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px' }}
        >
          <label className="block text-sm mb-1 font-medium" style={{ color: 'var(--text-secondary)' }}>Notas (opcional)</label>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={2}
            className="w-full text-sm py-2 px-3 outline-none resize-none"
            style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '6px', color: 'var(--text-primary)' }}
            placeholder="Observaciones sobre el pedido..."
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/pedidos')}
            className="px-4 py-2 text-sm"
            style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: '6px' }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={createOrder.isPending || items.length === 0 || !proveedorId}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium"
            style={{
              backgroundColor: 'var(--btn-primary-bg)',
              color: 'var(--btn-primary-text)',
              borderRadius: '6px',
              opacity: createOrder.isPending || items.length === 0 || !proveedorId ? 0.6 : 1,
            }}
          >
            {createOrder.isPending ? 'Creando...' : 'Crear pedido'}
          </button>
        </div>
      </form>
    </div>
  )
}
