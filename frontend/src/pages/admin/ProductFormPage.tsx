import { useState, useMemo, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Info } from 'lucide-react'
import { productFormSchema, type ProductFormData } from '../../types/product'
import { useProduct, useCreateProduct, useUpdateProduct, useCategories, useSuppliers } from '../../hooks/useProducts'
import { useExchangeRate } from '../../hooks/useExchangeRate'
import toast from 'react-hot-toast'

export default function ProductFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const { data: product, isLoading: loadingProduct } = useProduct(id)
  const { data: categories } = useCategories()
  const { data: suppliers } = useSuppliers()
  const createMutation = useCreateProduct()
  const updateMutation = useUpdateProduct()
  const { data: rateData, isLoading: loadingRate } = useExchangeRate()
  const exchangeRate = rateData?.tasa

  const [form, setForm] = useState<ProductFormData>({
    nombre: '',
    sku: '',
    categoria_id: '',
    proveedor_id: '',
    precio_compra_usd: null,
    precio_venta_fijo: null,
    multiplicador: null,
    stock_actual: 0,
    stock_optimo: null,
    umbral_stock_medio: null,
    umbral_stock_minimo: null,
    alibaba_product_url: '',
    descripcion: '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({})
  const [initialized, setInitialized] = useState(false)

  if (isEdit && product && !initialized) {
    setForm({
      nombre: product.nombre,
      sku: product.sku ?? '',
      categoria_id: product.categoria_id,
      proveedor_id: product.proveedor_id ?? '',
      precio_compra_usd: product.precio_compra_usd,
      precio_venta_fijo: product.precio_venta_fijo,
      multiplicador: product.multiplicador,
      stock_actual: product.stock_actual,
      stock_optimo: product.stock_optimo,
      umbral_stock_medio: product.umbral_stock_medio,
      umbral_stock_minimo: product.umbral_stock_minimo,
      alibaba_product_url: product.alibaba_product_url ?? '',
      descripcion: product.descripcion ?? '',
    })
    setInitialized(true)
  }

  function handleChange(field: keyof ProductFormData, value: string) {
    setForm((prev) => {
      const next = { ...prev, [field]: value }

      const costoCLP = (() => {
        const raw = Number(field === 'precio_compra_usd' ? value : next.precio_compra_usd)
        if (!raw || raw <= 0) return null
        if (isLocalSupplier) return raw
        if (!exchangeRate) return null
        return raw * exchangeRate
      })()

      // Multiplicador → calcula precio venta fijo
      if (field === 'multiplicador' && costoCLP) {
        const mult = Number(value)
        if (mult > 0) {
          next.precio_venta_fijo = String(Math.round(costoCLP * mult))
        }
      }

      // Precio venta fijo → calcula multiplicador
      if (field === 'precio_venta_fijo' && costoCLP) {
        const pvf = Number(value)
        if (pvf > 0) {
          next.multiplicador = String(Math.round((pvf / costoCLP) * 10) / 10)
        }
      }

      // Precio compra USD → recalcula precio venta si hay multiplicador
      if (field === 'precio_compra_usd' && costoCLP) {
        const mult = Number(next.multiplicador)
        if (mult > 0) {
          next.precio_venta_fijo = String(Math.round(costoCLP * mult))
        }
      }

      return next
    })
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErrors({})

    const result = productFormSchema.safeParse(form)
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ProductFormData, string>> = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof ProductFormData
        fieldErrors[field] = issue.message
      }
      setErrors(fieldErrors)
      return
    }

    const payload = { ...result.data, precio_compra_clp: precioCompraCLP }

    try {
      if (isEdit && id) {
        await updateMutation.mutateAsync({ ...payload, id })
        toast.success('Producto actualizado')
      } else {
        await createMutation.mutateAsync(payload)
        toast.success('Producto creado')
      }
      navigate('/admin/inventario')
    } catch {
      toast.error(isEdit ? 'Error al actualizar' : 'Error al crear producto')
    }
  }

  const submitting = createMutation.isPending || updateMutation.isPending

  // ── Tipo de proveedor y conversión automática ──
  const selectedSupplier = suppliers?.find((s) => s.id === form.proveedor_id)
  const isLocalSupplier = selectedSupplier?.tipo === 'LOCAL'

  const precioCompraUsd = form.precio_compra_usd ? Number(form.precio_compra_usd) : null
  const multiplicadorNum = form.multiplicador ? Number(form.multiplicador) : null

  const precioCompraCLP = useMemo(() => {
    if (isLocalSupplier) {
      // Proveedor local: precio_compra_usd se usa como campo CLP directamente
      if (precioCompraUsd == null || precioCompraUsd <= 0) return null
      return Math.round(precioCompraUsd)
    }
    if (precioCompraUsd == null || precioCompraUsd <= 0 || !exchangeRate) return null
    return Math.round(precioCompraUsd * exchangeRate)
  }, [precioCompraUsd, exchangeRate, isLocalSupplier])

  const precioVentaEstimado = useMemo(() => {
    if (precioCompraCLP == null) return null
    const selectedCategory = categories?.find((c) => c.id === form.categoria_id)
    const mult = multiplicadorNum
      ?? selectedCategory?.multiplicador
      ?? selectedSupplier?.multiplicador
      ?? null
    if (mult == null || mult <= 0) return null
    return Math.round(precioCompraCLP * mult)
  }, [precioCompraCLP, multiplicadorNum, categories, selectedSupplier, form.categoria_id])

  const multiplierFeedback = useMemo((): { label: string; color: string } | null => {
    if (multiplicadorNum == null || multiplicadorNum <= 0) return null
    if (multiplicadorNum < 1.5) return { label: 'Muy bajo — margen insuficiente', color: 'var(--status-danger)' }
    if (multiplicadorNum < 2.0) return { label: 'Bajo — margen ajustado', color: 'var(--status-warning)' }
    if (multiplicadorNum <= 3.5) return { label: 'Normal — buen margen', color: 'var(--status-success)' }
    if (multiplicadorNum <= 5.0) return { label: 'Excelente — margen alto', color: 'var(--status-info)' }
    return { label: 'Muy alto — podría ser excesivo', color: 'var(--status-warning)' }
  }, [multiplicadorNum])

  if (isEdit && loadingProduct) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--btn-primary-bg)' }} />
      </div>
    )
  }

  function renderInput(field: keyof ProductFormData, label: string, opts?: { type?: string; placeholder?: string; step?: string; required?: boolean; tooltip?: string }) {
    return (
      <div>
        <label className="flex items-center gap-1.5 text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
          {label}{opts?.required ? ' *' : ''}
          {opts?.tooltip && (
            <span className="relative group">
              <Info size={13} className="cursor-help" style={{ color: 'var(--text-muted)' }} />
              <span
                className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 px-2.5 py-1.5 text-xs font-normal rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                }}
              >
                {opts.tooltip}
              </span>
            </span>
          )}
        </label>
        <input
          type={opts?.type ?? 'text'}
          step={opts?.step}
          value={(form[field] as string | number) ?? ''}
          onChange={(e) => handleChange(field, e.target.value)}
          placeholder={opts?.placeholder}
          className="w-full px-3 py-2 text-sm outline-none transition-colors"
          style={{
            backgroundColor: 'var(--input-bg)',
            border: `1px solid ${errors[field] ? 'var(--status-danger)' : 'var(--input-border)'}`,
            borderRadius: '6px',
            color: 'var(--input-text)',
          }}
          onFocus={(e) => (e.target.style.borderColor = errors[field] ? 'var(--status-danger)' : 'var(--border-focus)')}
          onBlur={(e) => (e.target.style.borderColor = errors[field] ? 'var(--status-danger)' : 'var(--input-border)')}
        />
        {errors[field] && <p className="text-xs mt-1" style={{ color: 'var(--status-danger)' }}>{errors[field]}</p>}
      </div>
    )
  }

  function renderSelect(field: keyof ProductFormData, label: string, options: { value: string; label: string }[], required?: boolean) {
    return (
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
          {label}{required ? ' *' : ''}
        </label>
        <select
          value={form[field] as string ?? ''}
          onChange={(e) => handleChange(field, e.target.value)}
          className="w-full px-3 py-2 text-sm outline-none"
          style={{
            backgroundColor: 'var(--input-bg)',
            border: `1px solid ${errors[field] ? 'var(--status-danger)' : 'var(--input-border)'}`,
            borderRadius: '6px',
            color: 'var(--input-text)',
          }}
        >
          <option value="">Seleccionar...</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {errors[field] && <p className="text-xs mt-1" style={{ color: 'var(--status-danger)' }}>{errors[field]}</p>}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/admin/inventario')}
          className="p-2 rounded-md transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          aria-label="Volver"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          {isEdit ? 'Editar producto' : 'Nuevo producto'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-5">
        {/* Info básica */}
        <div className="p-5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px' }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Información básica</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              {renderInput('nombre', 'Nombre del producto', { placeholder: 'Armazón Ray-Ban RB5154', required: true })}
            </div>
            {renderInput('sku', 'SKU', { placeholder: 'RB-5154-BLK' })}
            {renderSelect(
              'categoria_id',
              'Categoría',
              categories?.map((c) => ({ value: c.id, label: c.nombre })) ?? [],
              true,
            )}
            {renderSelect(
              'proveedor_id',
              'Proveedor',
              suppliers?.map((s) => ({ value: s.id, label: s.nombre })) ?? [],
            )}
            {renderInput('alibaba_product_url', 'URL Alibaba', { placeholder: 'https://alibaba.com/...' })}
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Descripción</label>
            <textarea
              value={form.descripcion ?? ''}
              onChange={(e) => handleChange('descripcion', e.target.value)}
              rows={2}
              placeholder="Descripción del producto..."
              className="w-full px-3 py-2 text-sm outline-none resize-none"
              style={{
                backgroundColor: 'var(--input-bg)',
                border: '1px solid var(--input-border)',
                borderRadius: '6px',
                color: 'var(--input-text)',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--border-focus)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--input-border)')}
            />
          </div>
        </div>

        {/* Precios */}
        <div className="p-5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Precios</h3>
            {!isLocalSupplier && (
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium"
                style={{
                  backgroundColor: 'var(--bg-surface-hover)',
                  border: '1px solid var(--border)',
                  borderRadius: '9999px',
                  color: 'var(--text-primary)',
                }}
              >
                <span style={{ color: 'var(--status-success)' }}>$</span>
                <span>1 USD = {loadingRate ? '...' : exchangeRate ? `$${exchangeRate.toLocaleString('es-CL')} CLP` : 'sin datos'}</span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              {isLocalSupplier
                ? renderInput('precio_compra_usd', 'Precio compra (CLP)', { type: 'number', step: '100', placeholder: '12000' })
                : renderInput('precio_compra_usd', 'Precio compra (USD)', { type: 'number', step: '0.01', placeholder: '15.00' })
              }
              {!isLocalSupplier && precioCompraCLP != null && (
                <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
                  ≈ ${precioCompraCLP.toLocaleString('es-CL')} CLP
                </p>
              )}
            </div>
            {renderInput('precio_venta_fijo', 'Precio venta fijo (CLP)', { type: 'number', step: '100', placeholder: '35000' })}
            <div>
              {renderInput('multiplicador', 'Multiplicador propio', { type: 'number', step: '0.1', placeholder: '2.5' })}
              {multiplierFeedback && (
                <p className="text-xs mt-1.5 font-medium" style={{ color: multiplierFeedback.color }}>
                  {multiplierFeedback.label}
                </p>
              )}
            </div>
          </div>

          {/* Preview de precio estimado */}
          {precioVentaEstimado != null && !form.precio_venta_fijo && (
            <div className="mt-4 px-3 py-2.5 rounded-md" style={{ backgroundColor: 'var(--bg-surface-hover)', border: '1px dashed var(--border)' }}>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Precio venta estimado: <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>${precioVentaEstimado.toLocaleString('es-CL')} CLP</span>
                <span className="text-xs ml-2 opacity-60">
                  (${precioCompraCLP?.toLocaleString('es-CL')} × {multiplicadorNum ?? 'mult.'})
                </span>
              </p>
            </div>
          )}

          <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
            Prioridad: precio fijo → multiplicador propio → multiplicador de categoría → multiplicador de proveedor
          </p>
        </div>

        {/* Stock */}
        <div className="p-5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px' }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Stock</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {renderInput('stock_actual', 'Stock actual', { type: 'number', placeholder: '0', required: true })}
            {renderInput('stock_optimo', 'Stock óptimo', { type: 'number', placeholder: '20' })}
            {renderInput('umbral_stock_medio', 'Umbral medio', { type: 'number', placeholder: '10', tooltip: 'Bajo este nivel se muestra alerta amarilla — considerar reponer.' })}
            {renderInput('umbral_stock_minimo', 'Umbral mínimo', { type: 'number', placeholder: '3', tooltip: 'Bajo este nivel se muestra alerta roja — reponer urgente.' })}
          </div>
          <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
            Si no defines umbrales, se usan los de la categoría
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/inventario')}
            className="px-4 py-2 text-sm font-medium"
            style={{ color: 'var(--btn-secondary-text)', border: '1px solid var(--btn-secondary-border)', borderRadius: '6px' }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
            style={{ backgroundColor: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', borderRadius: '6px' }}
            onMouseEnter={(e) => !submitting && (e.currentTarget.style.backgroundColor = 'var(--btn-primary-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--btn-primary-bg)')}
          >
            <Save size={16} />
            {submitting ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear producto'}
          </button>
        </div>
      </form>
    </div>
  )
}
