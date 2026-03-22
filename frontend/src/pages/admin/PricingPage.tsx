import { useState, type FormEvent } from 'react'
import { Tag, TrendingUp, Plus, Pencil, Trash2, X, Check, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  useDiscountRules,
  useCreateDiscountRule,
  useUpdateDiscountRule,
  useDeleteDiscountRule,
} from '../../hooks/useSales'
import { useProducts, useCategories, useSuppliers } from '../../hooks/useProducts'
import { calculateSalePrice } from '../../hooks/usePricingEngine'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import {
  DISCOUNT_LEVEL_LABELS,
  discountRuleFormSchema,
} from '../../types/sale'
import type { DiscountRule, DiscountRuleFormData, DiscountLevel } from '../../types/sale'

const TABS = [
  { id: 'discounts', label: 'Reglas de descuento', icon: Tag },
  { id: 'profitability', label: 'Rentabilidad', icon: TrendingUp },
] as const

type TabId = typeof TABS[number]['id']

export default function PricingPage() {
  const [activeTab, setActiveTab] = useState<TabId>('discounts')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          Precios y descuentos
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Gestiona reglas de descuento y revisa márgenes de rentabilidad
        </p>
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

      {activeTab === 'discounts' && <DiscountsTab />}
      {activeTab === 'profitability' && <ProfitabilityTab />}
    </div>
  )
}

// ── Discounts Tab ───────────────────────────────────────

function DiscountsTab() {
  const { data: rules, isLoading } = useDiscountRules(false)
  const createRule = useCreateDiscountRule()
  const updateRule = useUpdateDiscountRule()
  const deleteRule = useDeleteDiscountRule()
  const [editingRule, setEditingRule] = useState<DiscountRule | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleSave = async (formData: DiscountRuleFormData, id?: string) => {
    try {
      if (id) {
        await updateRule.mutateAsync({ id, ...formData })
        toast.success('Regla actualizada')
      } else {
        await createRule.mutateAsync(formData)
        toast.success('Regla creada')
      }
      setShowForm(false)
      setEditingRule(null)
    } catch {
      toast.error('Error al guardar la regla')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteRule.mutateAsync(deleteId)
      toast.success('Regla eliminada')
      setDeleteId(null)
    } catch {
      toast.error('Error al eliminar. Puede estar en uso en ventas.')
    }
  }

  const isExpired = (rule: DiscountRule) => {
    if (rule.nivel !== 'TEMPORAL' || !rule.fecha_fin) return false
    return new Date(rule.fecha_fin) < new Date()
  }

  if (showForm || editingRule) {
    return (
      <DiscountRuleForm
        rule={editingRule}
        onSave={handleSave}
        onCancel={() => { setShowForm(false); setEditingRule(null) }}
        isPending={createRule.isPending || updateRule.isPending}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium"
          style={{
            backgroundColor: 'var(--btn-primary-bg)',
            color: 'var(--btn-primary-text)',
            borderRadius: '6px',
          }}
        >
          <Plus size={16} />
          Nueva regla
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div
            className="w-6 h-6 border-2 rounded-full animate-spin"
            style={{ borderColor: 'var(--border)', borderTopColor: 'var(--btn-primary-bg)' }}
          />
        </div>
      ) : rules && rules.length > 0 ? (
        <div className="space-y-3">
          {rules.map((rule) => {
            const expired = isExpired(rule)
            return (
              <div
                key={rule.id}
                className="flex items-center justify-between p-4"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: `1px solid ${!rule.activo || expired ? 'var(--border)' : 'var(--border)'}`,
                  borderRadius: '8px',
                  opacity: !rule.activo || expired ? 0.6 : 1,
                }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {rule.nombre}
                    </p>
                    <span
                      className="inline-flex items-center px-2 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor: 'var(--badge-primary-bg)',
                        color: 'var(--badge-primary-text)',
                        borderRadius: '9999px',
                      }}
                    >
                      {DISCOUNT_LEVEL_LABELS[rule.nivel]}
                    </span>
                    {!rule.activo && (
                      <span
                        className="inline-flex items-center px-2 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: 'var(--badge-danger-bg)',
                          color: 'var(--badge-danger-text)',
                          borderRadius: '9999px',
                        }}
                      >
                        Inactiva
                      </span>
                    )}
                    {expired && (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: 'var(--badge-warning-bg)',
                          color: 'var(--badge-warning-text)',
                          borderRadius: '9999px',
                        }}
                      >
                        <AlertTriangle size={10} />
                        Expirada
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <span className="font-semibold text-sm" style={{ color: 'var(--status-success)' }}>
                      -{rule.porcentaje}%
                    </span>
                    {rule.categoria && <span>Categoría: {rule.categoria.nombre}</span>}
                    {rule.proveedor && <span>Proveedor: {rule.proveedor.nombre}</span>}
                    {rule.producto && <span>Producto: {rule.producto.nombre}</span>}
                    {rule.fecha_inicio && rule.fecha_fin && (
                      <span>
                        {new Date(rule.fecha_inicio + 'T12:00:00').toLocaleDateString('es-CL')} — {new Date(rule.fecha_fin + 'T12:00:00').toLocaleDateString('es-CL')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingRule(rule)}
                    className="p-2 rounded-md"
                    style={{ color: 'var(--text-secondary)' }}
                    aria-label="Editar"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteId(rule.id)}
                    className="p-2 rounded-md"
                    style={{ color: 'var(--status-danger)' }}
                    aria-label="Eliminar"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <Tag size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            No hay reglas de descuento
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="text-sm font-medium mt-2 inline-block"
            style={{ color: 'var(--btn-primary-bg)' }}
          >
            Crear primera regla
          </button>
        </div>
      )}

      {deleteId && (
        <ConfirmModal
          title="Eliminar regla de descuento"
          message="¿Estás seguro? Si la regla está siendo usada en ventas existentes, no se podrá eliminar."
          confirmLabel="Sí, eliminar"
          danger
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  )
}

// ── Discount Rule Form ──────────────────────────────────

interface DiscountRuleFormProps {
  rule: DiscountRule | null
  onSave: (data: DiscountRuleFormData, id?: string) => void
  onCancel: () => void
  isPending: boolean
}

function DiscountRuleForm({ rule, onSave, onCancel, isPending }: DiscountRuleFormProps) {
  const { data: categories } = useCategories()
  const { data: suppliers } = useSuppliers()
  const { data: products } = useProducts()

  const [form, setForm] = useState<DiscountRuleFormData>({
    nombre: rule?.nombre ?? '',
    nivel: rule?.nivel ?? 'GLOBAL',
    porcentaje: rule?.porcentaje ?? 10,
    categoria_id: rule?.categoria_id ?? '',
    proveedor_id: rule?.proveedor_id ?? '',
    producto_id: rule?.producto_id ?? '',
    fecha_inicio: rule?.fecha_inicio ?? '',
    fecha_fin: rule?.fecha_fin ?? '',
    activo: rule?.activo ?? true,
  })

  const [errors, setErrors] = useState<Partial<Record<string, string>>>({})

  const handleChange = (field: keyof DiscountRuleFormData, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setErrors({})

    const result = discountRuleFormSchema.safeParse(form)
    if (!result.success) {
      const fieldErrors: Partial<Record<string, string>> = {}
      for (const issue of result.error.issues) {
        fieldErrors[issue.path[0] as string] = issue.message
      }
      setErrors(fieldErrors)
      return
    }

    // Validate level-specific fields
    if (form.nivel === 'CATEGORIA' && !form.categoria_id) {
      setErrors({ categoria_id: 'Selecciona una categoría' })
      return
    }
    if (form.nivel === 'PROVEEDOR' && !form.proveedor_id) {
      setErrors({ proveedor_id: 'Selecciona un proveedor' })
      return
    }
    if (form.nivel === 'PRODUCTO' && !form.producto_id) {
      setErrors({ producto_id: 'Selecciona un producto' })
      return
    }
    if (form.nivel === 'TEMPORAL' && (!form.fecha_inicio || !form.fecha_fin)) {
      setErrors({ fecha_inicio: 'Las fechas son obligatorias para descuentos temporales' })
      return
    }

    onSave(result.data as DiscountRuleFormData, rule?.id)
  }

  const inputStyle = (field: string) => ({
    backgroundColor: 'var(--input-bg)',
    border: `1px solid ${errors[field] ? 'var(--status-danger)' : 'var(--input-border)'}`,
    borderRadius: '6px',
    color: 'var(--text-primary)',
  })

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          {rule ? 'Editar regla' : 'Nueva regla de descuento'}
        </h2>
        <button type="button" onClick={onCancel} aria-label="Cerrar">
          <X size={20} style={{ color: 'var(--text-secondary)' }} />
        </button>
      </div>

      <div
        className="p-4 space-y-4"
        style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px' }}
      >
        {/* Nombre */}
        <div>
          <label className="block text-sm mb-1 font-medium" style={{ color: 'var(--text-secondary)' }}>
            Nombre de la regla *
          </label>
          <input
            type="text"
            value={form.nombre}
            onChange={(e) => handleChange('nombre', e.target.value)}
            className="w-full text-sm py-2 px-3 outline-none"
            style={inputStyle('nombre')}
            placeholder="Ej: Descuento temporada verano"
          />
          {errors.nombre && <p className="text-xs mt-1" style={{ color: 'var(--status-danger)' }}>{errors.nombre}</p>}
        </div>

        {/* Nivel + Porcentaje */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1 font-medium" style={{ color: 'var(--text-secondary)' }}>
              Nivel *
            </label>
            <select
              value={form.nivel}
              onChange={(e) => handleChange('nivel', e.target.value)}
              className="w-full text-sm py-2 px-3"
              style={inputStyle('nivel')}
            >
              {(Object.keys(DISCOUNT_LEVEL_LABELS) as DiscountLevel[]).map((level) => (
                <option key={level} value={level}>{DISCOUNT_LEVEL_LABELS[level]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1 font-medium" style={{ color: 'var(--text-secondary)' }}>
              Porcentaje de descuento *
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={100}
                value={form.porcentaje}
                onChange={(e) => handleChange('porcentaje', e.target.value)}
                className="w-full text-sm py-2 px-3 outline-none"
                style={inputStyle('porcentaje')}
              />
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>%</span>
            </div>
            {errors.porcentaje && <p className="text-xs mt-1" style={{ color: 'var(--status-danger)' }}>{errors.porcentaje}</p>}
          </div>
        </div>

        {/* Level-specific fields */}
        {form.nivel === 'CATEGORIA' && (
          <div>
            <label className="block text-sm mb-1 font-medium" style={{ color: 'var(--text-secondary)' }}>
              Categoría *
            </label>
            <select
              value={form.categoria_id}
              onChange={(e) => handleChange('categoria_id', e.target.value)}
              className="w-full text-sm py-2 px-3"
              style={inputStyle('categoria_id')}
            >
              <option value="">Seleccionar...</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
            {errors.categoria_id && <p className="text-xs mt-1" style={{ color: 'var(--status-danger)' }}>{errors.categoria_id}</p>}
          </div>
        )}

        {form.nivel === 'PROVEEDOR' && (
          <div>
            <label className="block text-sm mb-1 font-medium" style={{ color: 'var(--text-secondary)' }}>
              Proveedor *
            </label>
            <select
              value={form.proveedor_id}
              onChange={(e) => handleChange('proveedor_id', e.target.value)}
              className="w-full text-sm py-2 px-3"
              style={inputStyle('proveedor_id')}
            >
              <option value="">Seleccionar...</option>
              {suppliers?.map((s) => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>
            {errors.proveedor_id && <p className="text-xs mt-1" style={{ color: 'var(--status-danger)' }}>{errors.proveedor_id}</p>}
          </div>
        )}

        {form.nivel === 'PRODUCTO' && (
          <div>
            <label className="block text-sm mb-1 font-medium" style={{ color: 'var(--text-secondary)' }}>
              Producto *
            </label>
            <select
              value={form.producto_id}
              onChange={(e) => handleChange('producto_id', e.target.value)}
              className="w-full text-sm py-2 px-3"
              style={inputStyle('producto_id')}
            >
              <option value="">Seleccionar...</option>
              {products?.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
            {errors.producto_id && <p className="text-xs mt-1" style={{ color: 'var(--status-danger)' }}>{errors.producto_id}</p>}
          </div>
        )}

        {form.nivel === 'TEMPORAL' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1 font-medium" style={{ color: 'var(--text-secondary)' }}>
                Fecha inicio *
              </label>
              <input
                type="date"
                value={form.fecha_inicio}
                onChange={(e) => handleChange('fecha_inicio', e.target.value)}
                className="w-full text-sm py-2 px-3 outline-none"
                style={inputStyle('fecha_inicio')}
              />
              {errors.fecha_inicio && <p className="text-xs mt-1" style={{ color: 'var(--status-danger)' }}>{errors.fecha_inicio}</p>}
            </div>
            <div>
              <label className="block text-sm mb-1 font-medium" style={{ color: 'var(--text-secondary)' }}>
                Fecha fin *
              </label>
              <input
                type="date"
                value={form.fecha_fin}
                onChange={(e) => handleChange('fecha_fin', e.target.value)}
                className="w-full text-sm py-2 px-3 outline-none"
                style={inputStyle('fecha_fin')}
              />
            </div>
          </div>
        )}

        {/* Activo toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleChange('activo', !form.activo)}
            className="relative w-10 h-5 rounded-full transition-colors"
            style={{
              backgroundColor: form.activo ? 'var(--btn-primary-bg)' : 'var(--border)',
            }}
          >
            <span
              className="absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform"
              style={{ left: form.activo ? '22px' : '2px' }}
            />
          </button>
          <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
            {form.activo ? 'Activa' : 'Inactiva'}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm"
          style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: '6px' }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium"
          style={{
            backgroundColor: 'var(--btn-primary-bg)',
            color: 'var(--btn-primary-text)',
            borderRadius: '6px',
            opacity: isPending ? 0.6 : 1,
          }}
        >
          <Check size={16} />
          {isPending ? 'Guardando...' : rule ? 'Actualizar' : 'Crear regla'}
        </button>
      </div>
    </form>
  )
}

// ── Profitability Tab ───────────────────────────────────

function ProfitabilityTab() {
  const { data: products, isLoading } = useProducts()

  const formatCLP = (n: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(n)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div
          className="w-6 h-6 border-2 rounded-full animate-spin"
          style={{ borderColor: 'var(--border)', borderTopColor: 'var(--btn-primary-bg)' }}
        />
      </div>
    )
  }

  const productData = products?.map((p) => {
    const precioVenta = calculateSalePrice(p)
    const costoClp = p.precio_compra_clp ?? 0
    const margen = precioVenta && costoClp > 0 ? ((precioVenta - costoClp) / precioVenta) * 100 : null
    const ganancia = precioVenta && costoClp > 0 ? precioVenta - costoClp : null
    return { ...p, precioVenta, costoClp, margen, ganancia }
  }) ?? []

  const avgMargin = productData.filter((p) => p.margen !== null).reduce((acc, p) => acc + (p.margen ?? 0), 0) /
    (productData.filter((p) => p.margen !== null).length || 1)

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          className="p-4"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px' }}
        >
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Margen promedio</p>
          <p className="text-2xl font-bold mt-1" style={{ color: avgMargin >= 40 ? 'var(--status-success)' : avgMargin >= 20 ? 'var(--badge-warning-text)' : 'var(--status-danger)' }}>
            {avgMargin.toFixed(1)}%
          </p>
        </div>
        <div
          className="p-4"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px' }}
        >
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Productos sin precio</p>
          <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
            {productData.filter((p) => p.precioVenta === null).length}
          </p>
        </div>
        <div
          className="p-4"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px' }}
        >
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Margen bajo (&lt;30%)</p>
          <p className="text-2xl font-bold mt-1" style={{ color: 'var(--status-danger)' }}>
            {productData.filter((p) => p.margen !== null && p.margen < 30).length}
          </p>
        </div>
      </div>

      {/* Products table */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr style={{ backgroundColor: 'var(--table-header-bg)' }}>
                {['PRODUCTO', 'COSTO', 'PRECIO VENTA', 'GANANCIA', 'MARGEN'].map((h) => (
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
              {productData.map((p) => {
                const marginColor = p.margen === null
                  ? 'var(--text-muted)'
                  : p.margen >= 50
                  ? 'var(--status-success)'
                  : p.margen >= 30
                  ? 'var(--badge-warning-text)'
                  : 'var(--status-danger)'

                return (
                  <tr
                    key={p.id}
                    style={{ borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--table-row-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{p.nombre}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {p.categoria?.nombre ?? '—'}
                        {p.sku && ` · ${p.sku}`}
                      </p>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>
                      {p.costoClp > 0 ? formatCLP(p.costoClp) : '—'}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>
                      {p.precioVenta ? formatCLP(p.precioVenta) : (
                        <span style={{ color: 'var(--status-danger)' }}>Sin precio</span>
                      )}
                    </td>
                    <td className="px-4 py-3" style={{ color: p.ganancia && p.ganancia > 0 ? 'var(--status-success)' : 'var(--text-muted)' }}>
                      {p.ganancia !== null ? formatCLP(p.ganancia) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold" style={{ color: marginColor }}>
                        {p.margen !== null ? `${p.margen.toFixed(1)}%` : '—'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
