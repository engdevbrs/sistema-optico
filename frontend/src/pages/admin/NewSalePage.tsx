import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, Check, UserCheck, Users, FileText,
  Search, Plus, Minus, X, Banknote, CreditCard, ArrowRightLeft,
  ShoppingCart, Printer, Eye,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { usePatients, useCreatePatient } from '../../hooks/usePatients'
import { useProducts } from '../../hooks/useProducts'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useCreateSale, useAddSaleItem, useRemoveSaleItem, useCompleteSale, useDiscountRules, usePatientPrescriptions } from '../../hooks/useSales'
import { useConfig } from '../../hooks/useConfig'
import { calculateSalePrice, findApplicableDiscount, calculateItemTotals, calculateCartTotals } from '../../hooks/usePricingEngine'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import {
  INITIAL_WIZARD_STATE,
  PAYMENT_METHOD_LABELS,
  VERIFICATION_LABELS,
} from '../../types/sale'
import type { SaleWizardState, SaleCartItem, VerificationType, PaymentMethod } from '../../types/sale'
import type { Product } from '../../types/product'
import type { Prescription } from '../../types/prescription'
import { patientFormSchema } from '../../types/patient'

const STEPS = [
  { num: 1, label: 'Cliente' },
  { num: 2, label: 'Identidad' },
  { num: 3, label: 'Productos' },
  { num: 4, label: 'Receta' },
  { num: 5, label: 'Descuentos' },
  { num: 6, label: 'Pago' },
  { num: 7, label: 'Comprobante' },
]

export default function NewSalePage() {
  const navigate = useNavigate()
  const [wizard, setWizard] = useState<SaleWizardState>({ ...INITIAL_WIZARD_STATE })
  const [showCancel, setShowCancel] = useState(false)

  const updateWizard = (updates: Partial<SaleWizardState>) => {
    setWizard((prev) => ({ ...prev, ...updates }))
  }

  const goNext = () => updateWizard({ currentStep: wizard.currentStep + 1 })
  const goPrev = () => updateWizard({ currentStep: wizard.currentStep - 1 })

  // Warn on page leave if sale in progress
  useEffect(() => {
    if (wizard.venta_id) {
      const handler = (e: BeforeUnloadEvent) => {
        e.preventDefault()
      }
      window.addEventListener('beforeunload', handler)
      return () => window.removeEventListener('beforeunload', handler)
    }
  }, [wizard.venta_id])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            if (wizard.venta_id) {
              setShowCancel(true)
            } else {
              navigate('/admin/ventas')
            }
          }}
          className="p-2 rounded-md"
          style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
          aria-label="Volver"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          Nueva venta
        </h1>
      </div>

      {/* Step indicator */}
      <StepIndicator currentStep={wizard.currentStep} />

      {/* Step content */}
      <div
        className="p-6"
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
        }}
      >
        {wizard.currentStep === 1 && (
          <Step1Customer wizard={wizard} updateWizard={updateWizard} onNext={goNext} />
        )}
        {wizard.currentStep === 2 && (
          <Step2Verification wizard={wizard} updateWizard={updateWizard} onNext={goNext} onPrev={goPrev} />
        )}
        {wizard.currentStep === 3 && (
          <Step3Products wizard={wizard} updateWizard={updateWizard} onNext={goNext} onPrev={goPrev} />
        )}
        {wizard.currentStep === 4 && (
          <Step4Prescription wizard={wizard} updateWizard={updateWizard} onNext={goNext} onPrev={goPrev} />
        )}
        {wizard.currentStep === 5 && (
          <Step5Discounts wizard={wizard} updateWizard={updateWizard} onNext={goNext} onPrev={goPrev} />
        )}
        {wizard.currentStep === 6 && (
          <Step6Payment wizard={wizard} updateWizard={updateWizard} onNext={goNext} onPrev={goPrev} />
        )}
        {wizard.currentStep === 7 && (
          <Step7Receipt wizard={wizard} />
        )}
      </div>

      {showCancel && (
        <ConfirmModal
          title="Cancelar venta"
          message="Tienes una venta en progreso. Los productos reservados se liberarán automáticamente."
          confirmLabel="Sí, salir"
          danger
          onConfirm={() => navigate('/admin/ventas')}
          onCancel={() => setShowCancel(false)}
        />
      )}
    </div>
  )
}

// ── Step Indicator ──────────────────────────────────────

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <>
      {/* Desktop */}
      <div className="hidden md:flex items-center justify-between">
        {STEPS.map((step, i) => {
          const isCompleted = step.num < currentStep
          const isCurrent = step.num === currentStep
          return (
            <div key={step.num} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                  style={{
                    backgroundColor: isCompleted
                      ? 'var(--status-success)'
                      : isCurrent
                      ? 'var(--btn-primary-bg)'
                      : 'transparent',
                    color: isCompleted || isCurrent ? '#fff' : 'var(--text-muted)',
                    border: isCompleted || isCurrent ? 'none' : '2px solid var(--border)',
                  }}
                >
                  {isCompleted ? <Check size={16} /> : step.num}
                </div>
                <span
                  className="text-xs mt-1 whitespace-nowrap"
                  style={{ color: isCurrent ? 'var(--btn-primary-bg)' : 'var(--text-muted)' }}
                >
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className="flex-1 h-0.5 mx-2"
                  style={{
                    backgroundColor: step.num < currentStep ? 'var(--status-success)' : 'var(--border)',
                  }}
                />
              )}
            </div>
          )
        })}
      </div>
      {/* Mobile */}
      <div className="md:hidden text-center">
        <span className="text-sm font-medium" style={{ color: 'var(--btn-primary-bg)' }}>
          Paso {currentStep} de 7
        </span>
        <span className="text-sm ml-2" style={{ color: 'var(--text-muted)' }}>
          — {STEPS[currentStep - 1].label}
        </span>
      </div>
    </>
  )
}

// ── Step 1: Customer ────────────────────────────────────

interface StepProps {
  wizard: SaleWizardState
  updateWizard: (updates: Partial<SaleWizardState>) => void
  onNext: () => void
  onPrev?: () => void
}

function Step1Customer({ wizard, updateWizard, onNext }: StepProps) {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [showNewForm, setShowNewForm] = useState(false)
  const { data: patients } = usePatients(debouncedSearch)
  const createPatient = useCreatePatient()

  const [newPatient, setNewPatient] = useState({ nombre: '', email: '', telefono: '+56 ' })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const handleSelectPatient = (p: { id: string; nombre: string; email: string; telefono: string | null }) => {
    updateWizard({ paciente_id: p.id, paciente: p })
  }

  const handleCreatePatient = async () => {
    setFormErrors({})
    const result = patientFormSchema.safeParse(newPatient)
    if (!result.success) {
      const errors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        errors[issue.path[0] as string] = issue.message
      }
      setFormErrors(errors)
      return
    }

    try {
      const created = await createPatient.mutateAsync(result.data)
      handleSelectPatient({ id: created.id, nombre: created.nombre, email: created.email, telefono: created.telefono })
      setShowNewForm(false)
      toast.success('Paciente creado')
    } catch {
      toast.error('Error al crear paciente')
    }
  }

  if (wizard.paciente) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          Paso 1: Cliente seleccionado
        </h2>
        <div
          className="flex items-center justify-between p-4"
          style={{
            backgroundColor: 'var(--badge-primary-bg)',
            border: '1px solid var(--btn-primary-bg)',
            borderRadius: '8px',
          }}
        >
          <div>
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
              {wizard.paciente.nombre}
            </p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {wizard.paciente.email}
              {wizard.paciente.telefono && ` · ${wizard.paciente.telefono}`}
            </p>
          </div>
          <button
            onClick={() => updateWizard({ paciente_id: null, paciente: null })}
            className="text-sm font-medium px-3 py-1"
            style={{
              color: 'var(--btn-primary-bg)',
              border: '1px solid var(--btn-primary-bg)',
              borderRadius: '6px',
            }}
          >
            Cambiar
          </button>
        </div>
        <div className="flex justify-end">
          <button
            onClick={onNext}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium"
            style={{
              backgroundColor: 'var(--btn-primary-bg)',
              color: 'var(--btn-primary-text)',
              borderRadius: '6px',
            }}
          >
            Siguiente
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
        Paso 1: Seleccionar cliente
      </h2>

      {!showNewForm ? (
        <>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 px-3" style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '6px' }}>
              <Search size={16} style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Buscar por nombre, email o teléfono..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 text-sm py-2 outline-none bg-transparent"
                style={{ color: 'var(--text-primary)' }}
                autoFocus
              />
            </div>
            <button
              onClick={() => setShowNewForm(true)}
              className="flex items-center gap-1 px-3 py-2 text-sm font-medium whitespace-nowrap"
              style={{
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--btn-primary-bg)',
                border: '1px solid var(--btn-primary-bg)',
                borderRadius: '6px',
              }}
            >
              <Plus size={16} />
              Nuevo
            </button>
          </div>

          {search.trim() && patients && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {patients.length > 0 ? (
                patients.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPatient(p)}
                    className="w-full text-left p-3 cursor-pointer"
                    style={{ border: '1px solid var(--border)', borderRadius: '6px' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{p.nombre}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {p.email} {p.telefono && `· ${p.telefono}`}
                    </p>
                  </button>
                ))
              ) : (
                <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>
                  No se encontraron pacientes
                </p>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-3">
          <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Crear paciente rápido</h3>
          {(['nombre', 'email', 'telefono'] as const).map((field) => (
            <div key={field}>
              <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                {field === 'nombre' ? 'Nombre completo *' : field === 'email' ? 'Email *' : 'Teléfono'}
              </label>
              <input
                type={field === 'email' ? 'email' : 'text'}
                value={newPatient[field]}
                onChange={(e) => setNewPatient((prev) => ({ ...prev, [field]: e.target.value }))}
                className="w-full text-sm py-2 px-3 outline-none"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  border: `1px solid ${formErrors[field] ? 'var(--status-danger)' : 'var(--input-border)'}`,
                  borderRadius: '6px',
                  color: 'var(--text-primary)',
                }}
              />
              {formErrors[field] && (
                <p className="text-xs mt-1" style={{ color: 'var(--status-danger)' }}>{formErrors[field]}</p>
              )}
            </div>
          ))}
          <div className="flex gap-2">
            <button
              onClick={() => setShowNewForm(false)}
              className="px-4 py-2 text-sm"
              style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: '6px' }}
            >
              Cancelar
            </button>
            <button
              onClick={handleCreatePatient}
              disabled={createPatient.isPending}
              className="px-4 py-2 text-sm font-medium"
              style={{
                backgroundColor: 'var(--btn-primary-bg)',
                color: 'var(--btn-primary-text)',
                borderRadius: '6px',
                opacity: createPatient.isPending ? 0.6 : 1,
              }}
            >
              {createPatient.isPending ? 'Creando...' : 'Crear y seleccionar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Step 2: Verification ────────────────────────────────

function Step2Verification({ wizard, updateWizard, onNext, onPrev }: StepProps) {
  const createSale = useCreateSale()

  const options: { value: VerificationType; label: string; description: string; detail: string; icon: typeof UserCheck }[] = [
    { value: 'PRESENCIAL', label: 'Presencial', description: 'El paciente se presenta en persona', detail: 'Usa esta opción cuando el paciente está físicamente en la óptica y puedes verificar su identidad directamente.', icon: UserCheck },
    { value: 'FAMILIAR_AUTORIZADO', label: 'Familiar autorizado', description: 'Un familiar retira en nombre del paciente', detail: 'Selecciona cuando un padre, hijo u otro familiar autorizado viene a retirar los productos. El paciente no está presente.', icon: Users },
    { value: 'COMPROBANTE', label: 'Comprobante', description: 'Se presenta un documento de identidad', detail: 'Usa cuando alguien presenta cédula, carnet u otro documento que acredite la identidad del paciente. Ej: envío a domicilio o retiro por terceros.', icon: FileText },
  ]

  const handleNext = async () => {
    if (!wizard.verificacion) {
      toast.error('Selecciona un método de verificación')
      return
    }

    // Create sale in DB if not created yet
    if (!wizard.venta_id) {
      try {
        const sale = await createSale.mutateAsync({
          paciente_id: wizard.paciente_id!,
          verificacion: wizard.verificacion,
        })
        updateWizard({ venta_id: sale.id })
        toast.success('Venta iniciada')
      } catch {
        toast.error('Error al crear la venta')
        return
      }
    }
    onNext()
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
        Paso 2: Verificación de identidad
      </h2>
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        ¿Cómo se verifica la identidad de {wizard.paciente?.nombre}?
      </p>

      <div className="grid gap-3 md:grid-cols-3">
        {options.map(({ value, label, description, detail, icon: Icon }) => {
          const selected = wizard.verificacion === value
          return (
            <button
              key={value}
              onClick={() => updateWizard({ verificacion: value })}
              className="p-4 text-left cursor-pointer"
              style={{
                border: `2px solid ${selected ? 'var(--btn-primary-bg)' : 'var(--border)'}`,
                backgroundColor: selected ? 'var(--badge-primary-bg)' : 'transparent',
                borderRadius: '8px',
              }}
            >
              <Icon size={24} style={{ color: selected ? 'var(--btn-primary-bg)' : 'var(--text-muted)' }} />
              <p className="font-medium mt-2" style={{ color: 'var(--text-primary)' }}>{label}</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{description}</p>
              <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--text-muted)' }}>{detail}</p>
            </button>
          )
        })}
      </div>

      <div className="flex justify-between pt-4">
        <button
          onClick={onPrev}
          className="flex items-center gap-2 px-4 py-2 text-sm"
          style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: '6px' }}
        >
          <ArrowLeft size={16} />
          Anterior
        </button>
        <button
          onClick={handleNext}
          disabled={!wizard.verificacion || createSale.isPending}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium"
          style={{
            backgroundColor: 'var(--btn-primary-bg)',
            color: 'var(--btn-primary-text)',
            borderRadius: '6px',
            opacity: !wizard.verificacion || createSale.isPending ? 0.6 : 1,
          }}
        >
          {createSale.isPending ? 'Creando...' : 'Siguiente'}
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}

// ── Step 3: Products ────────────────────────────────────

function Step3Products({ wizard, updateWizard, onNext, onPrev }: StepProps) {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const { data: products } = useProducts(debouncedSearch)
  const { data: discountRules } = useDiscountRules()
  const addItem = useAddSaleItem()
  const removeItem = useRemoveSaleItem()

  const formatCLP = (n: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(n)

  const handleAddProduct = async (product: Product) => {
    // Check if already in cart
    const existing = wizard.items.find((i) => i.producto.id === product.id)
    if (existing) {
      toast.error('Este producto ya está en el carrito')
      return
    }

    const price = calculateSalePrice(product)
    if (price === null) {
      toast.error('No se puede calcular el precio de este producto')
      return
    }

    if (product.stock_actual <= 0) {
      toast.error('Producto sin stock')
      return
    }

    const discount = discountRules ? findApplicableDiscount(product, discountRules) : null
    const descuentoPorcentaje = discount?.porcentaje ?? 0
    const { descuento_monto, subtotal } = calculateItemTotals(price, 1, descuentoPorcentaje)

    const cartItem: SaleCartItem = {
      producto: product,
      cantidad: 1,
      precio_unitario: price,
      descuento_porcentaje: descuentoPorcentaje,
      descuento_monto,
      regla_descuento_id: discount?.id ?? null,
      regla_descuento_nombre: discount?.nombre ?? null,
      subtotal,
    }

    // Save to DB
    try {
      await addItem.mutateAsync({
        venta_id: wizard.venta_id!,
        producto_id: product.id,
        cantidad: 1,
        precio_unitario: price,
        descuento_porcentaje: descuentoPorcentaje,
        descuento_monto,
        subtotal,
        regla_descuento_id: discount?.id ?? null,
      })

      updateWizard({ items: [...wizard.items, cartItem] })
      toast.success('Producto agregado')
    } catch {
      toast.error('Error al agregar producto')
    }
  }

  const handleRemoveItem = async (index: number) => {
    const item = wizard.items[index]
    try {
      // Get the actual item ID from DB
      const { data: dbItems } = await import('../../lib/supabase').then(({ supabase }) =>
        supabase
          .from('venta_item')
          .select('id')
          .eq('venta_id', wizard.venta_id!)
          .eq('producto_id', item.producto.id)
          .limit(1)
          .single()
          .then((res) => res)
      )

      if (dbItems) {
        await removeItem.mutateAsync({
          item_id: dbItems.id,
          venta_id: wizard.venta_id!,
          producto_id: item.producto.id,
        })
      }

      const newItems = wizard.items.filter((_, i) => i !== index)
      updateWizard({ items: newItems })
      toast.success('Producto eliminado')
    } catch {
      toast.error('Error al eliminar producto')
    }
  }

  const handleQuantityChange = (index: number, delta: number) => {
    const newItems = [...wizard.items]
    const item = newItems[index]
    const newQty = item.cantidad + delta

    if (newQty < 1) return
    if (newQty > item.producto.stock_actual) {
      toast.error('Stock insuficiente')
      return
    }

    const { descuento_monto, subtotal } = calculateItemTotals(item.precio_unitario, newQty, item.descuento_porcentaje)
    newItems[index] = { ...item, cantidad: newQty, descuento_monto, subtotal }
    updateWizard({ items: newItems })
  }

  const totals = calculateCartTotals(wizard.items)

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
        Paso 3: Agregar productos
      </h2>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Product search */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-3" style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '6px' }}>
            <Search size={16} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 text-sm py-2 outline-none bg-transparent"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {products?.filter((p) => p.stock_actual > 0).map((product) => {
              const price = calculateSalePrice(product)
              const inCart = wizard.items.some((i) => i.producto.id === product.id)
              return (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3"
                  style={{
                    border: `1px solid ${inCart ? 'var(--status-success)' : 'var(--border)'}`,
                    borderRadius: '6px',
                    opacity: inCart ? 0.6 : 1,
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {product.nombre}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {product.sku && (
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{product.sku}</span>
                      )}
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Stock: {product.stock_actual}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {price ? formatCLP(price) : 'Sin precio'}
                    </span>
                    <button
                      onClick={() => handleAddProduct(product)}
                      disabled={inCart || !price || addItem.isPending}
                      className="p-1.5 rounded-md"
                      style={{
                        backgroundColor: inCart ? 'var(--status-success)' : 'var(--btn-primary-bg)',
                        color: '#fff',
                        opacity: inCart || !price ? 0.5 : 1,
                      }}
                      aria-label="Agregar"
                    >
                      {inCart ? <Check size={14} /> : <Plus size={14} />}
                    </button>
                  </div>
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
            <ShoppingCart size={16} />
            Carrito ({wizard.items.length})
          </h3>

          {wizard.items.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>
              Agrega productos desde la búsqueda
            </p>
          ) : (
            <>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {wizard.items.map((item, idx) => (
                  <div
                    key={item.producto.id}
                    className="p-3"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-medium flex-1" style={{ color: 'var(--text-primary)' }}>
                        {item.producto.nombre}
                      </p>
                      <button
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1 rounded"
                        style={{ color: 'var(--status-danger)' }}
                        aria-label="Eliminar"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleQuantityChange(idx, -1)}
                          disabled={item.cantidad <= 1}
                          className="w-6 h-6 flex items-center justify-center rounded"
                          style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', opacity: item.cantidad <= 1 ? 0.4 : 1 }}
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-sm font-medium w-6 text-center" style={{ color: 'var(--text-primary)' }}>
                          {item.cantidad}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(idx, 1)}
                          disabled={item.cantidad >= item.producto.stock_actual}
                          className="w-6 h-6 flex items-center justify-center rounded"
                          style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', opacity: item.cantidad >= item.producto.stock_actual ? 0.4 : 1 }}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {formatCLP(item.subtotal)}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {formatCLP(Math.round(item.subtotal / 1.19))} + IVA {formatCLP(item.subtotal - Math.round(item.subtotal / 1.19))}
                        </p>
                        {item.descuento_porcentaje > 0 && (
                          <p className="text-xs" style={{ color: 'var(--status-success)' }}>
                            -{item.descuento_porcentaje}% ({item.regla_descuento_nombre})
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <TotalsBreakdown totals={totals} formatCLP={formatCLP} />
            </>
          )}
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <button
          onClick={onPrev}
          className="flex items-center gap-2 px-4 py-2 text-sm"
          style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: '6px' }}
        >
          <ArrowLeft size={16} />
          Anterior
        </button>
        <button
          onClick={() => {
            if (wizard.items.length === 0) {
              toast.error('Agrega al menos un producto')
              return
            }
            onNext()
          }}
          disabled={wizard.items.length === 0}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium"
          style={{
            backgroundColor: 'var(--btn-primary-bg)',
            color: 'var(--btn-primary-text)',
            borderRadius: '6px',
            opacity: wizard.items.length === 0 ? 0.6 : 1,
          }}
        >
          Siguiente
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}

// ── Step 4: Prescription ────────────────────────────────

function Step4Prescription({ wizard, updateWizard, onNext, onPrev }: StepProps) {
  const { data: prescriptions } = usePatientPrescriptions(wizard.paciente_id)
  const [skipReceta, setSkipReceta] = useState(wizard.motivo_sin_receta !== null)
  const [motivo, setMotivo] = useState(wizard.motivo_sin_receta ?? '')

  const hasLenses = wizard.items.some((item) => {
    const cat = item.producto.categoria?.nombre?.toLowerCase() ?? ''
    return cat.includes('lente')
  })

  const formatPrescDate = (d: string) => new Date(d).toLocaleDateString('es-CL')

  const handleNext = () => {
    if (!skipReceta && !wizard.receta_id) {
      if (hasLenses) {
        toast.error('Selecciona una receta o indica por qué no se asocia')
        return
      }
      // No lenses, can proceed without prescription
      updateWizard({ receta_id: null, motivo_sin_receta: null })
      onNext()
      return
    }

    if (skipReceta) {
      if (motivo.trim().length < 5) {
        toast.error('El motivo debe tener al menos 5 caracteres')
        return
      }
      updateWizard({ receta_id: null, motivo_sin_receta: motivo.trim() })
    }

    onNext()
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
        Paso 4: Receta
      </h2>
      {hasLenses && (
        <div
          className="p-3 text-sm"
          style={{
            backgroundColor: 'var(--badge-warning-bg)',
            color: 'var(--badge-warning-text)',
            borderRadius: '6px',
          }}
        >
          Hay lentes en el carrito — se recomienda asociar una receta.
        </div>
      )}

      {!skipReceta ? (
        <>
          <div className="space-y-2">
            {prescriptions && prescriptions.length > 0 ? (
              prescriptions.map((rx: Prescription) => {
                const selected = wizard.receta_id === rx.id
                return (
                  <button
                    key={rx.id}
                    onClick={() => updateWizard({ receta_id: rx.id, motivo_sin_receta: null })}
                    className="w-full text-left p-3 cursor-pointer"
                    style={{
                      border: `2px solid ${selected ? 'var(--btn-primary-bg)' : 'var(--border)'}`,
                      backgroundColor: selected ? 'var(--badge-primary-bg)' : 'transparent',
                      borderRadius: '6px',
                    }}
                  >
                    <div className="flex justify-between">
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        Receta del {formatPrescDate(rx.created_at)}
                      </span>
                      {selected && <Check size={16} style={{ color: 'var(--btn-primary-bg)' }} />}
                    </div>
                    <div className="flex gap-4 mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      <span>OD: Esf {rx.od_esfera ?? '—'} Cil {rx.od_cilindro ?? '—'}</span>
                      <span>OI: Esf {rx.oi_esfera ?? '—'} Cil {rx.oi_cilindro ?? '—'}</span>
                    </div>
                  </button>
                )
              })
            ) : (
              <p className="text-sm py-4 text-center" style={{ color: 'var(--text-muted)' }}>
                No hay recetas para este paciente
              </p>
            )}
          </div>
          <button
            onClick={() => setSkipReceta(true)}
            className="text-sm font-medium"
            style={{ color: 'var(--text-secondary)' }}
          >
            No asociar receta →
          </button>
        </>
      ) : (
        <div className="space-y-3">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Indica el motivo por el que no se asocia una receta:
          </p>
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Motivo (mínimo 5 caracteres)..."
            rows={3}
            className="w-full text-sm py-2 px-3 outline-none resize-none"
            style={{
              backgroundColor: 'var(--input-bg)',
              border: '1px solid var(--input-border)',
              borderRadius: '6px',
              color: 'var(--text-primary)',
            }}
          />
          <button
            onClick={() => {
              setSkipReceta(false)
              setMotivo('')
              updateWizard({ motivo_sin_receta: null })
            }}
            className="text-sm font-medium"
            style={{ color: 'var(--btn-primary-bg)' }}
          >
            ← Volver a seleccionar receta
          </button>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <button
          onClick={onPrev}
          className="flex items-center gap-2 px-4 py-2 text-sm"
          style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: '6px' }}
        >
          <ArrowLeft size={16} />
          Anterior
        </button>
        <button
          onClick={handleNext}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium"
          style={{
            backgroundColor: 'var(--btn-primary-bg)',
            color: 'var(--btn-primary-text)',
            borderRadius: '6px',
          }}
        >
          Siguiente
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}

// ── Step 5: Discounts ───────────────────────────────────

function Step5Discounts({ wizard, updateWizard, onNext, onPrev }: StepProps) {
  const { data: rules } = useDiscountRules()
  const formatCLP = (n: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(n)

  const handleChangeDiscount = (index: number, ruleId: string | null) => {
    const newItems = [...wizard.items]
    const item = newItems[index]

    if (ruleId === null) {
      const { descuento_monto, subtotal } = calculateItemTotals(item.precio_unitario, item.cantidad, 0)
      newItems[index] = { ...item, descuento_porcentaje: 0, descuento_monto, subtotal, regla_descuento_id: null, regla_descuento_nombre: null }
    } else {
      const rule = rules?.find((r) => r.id === ruleId)
      if (rule) {
        const { descuento_monto, subtotal } = calculateItemTotals(item.precio_unitario, item.cantidad, rule.porcentaje)
        newItems[index] = { ...item, descuento_porcentaje: rule.porcentaje, descuento_monto, subtotal, regla_descuento_id: rule.id, regla_descuento_nombre: rule.nombre }
      }
    }
    updateWizard({ items: newItems })
  }

  const totals = calculateCartTotals(wizard.items)

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
        Paso 5: Descuentos
      </h2>
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        Revisa los descuentos aplicados. Puedes cambiar o quitar descuentos por producto.
      </p>

      <div className="space-y-3">
        {wizard.items.map((item, idx) => (
          <div
            key={item.producto.id}
            className="flex items-center justify-between p-3"
            style={{ border: '1px solid var(--border)', borderRadius: '6px' }}
          >
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {item.producto.nombre} × {item.cantidad}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {formatCLP(item.precio_unitario)} c/u
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={item.regla_descuento_id ?? ''}
                onChange={(e) => handleChangeDiscount(idx, e.target.value || null)}
                className="text-xs py-1 px-2"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  border: '1px solid var(--input-border)',
                  borderRadius: '6px',
                  color: 'var(--text-primary)',
                }}
              >
                <option value="">Sin descuento</option>
                {rules
                  ?.filter((r) => {
                    if (r.nivel === 'GLOBAL') return true
                    if (r.nivel === 'TEMPORAL') return true
                    if (r.nivel === 'PRODUCTO' && r.producto_id === item.producto.id) return true
                    if (r.nivel === 'CATEGORIA' && r.categoria_id === item.producto.categoria_id) return true
                    if (r.nivel === 'PROVEEDOR' && r.proveedor_id === item.producto.proveedor_id) return true
                    return false
                  })
                  .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nombre} ({r.porcentaje}%)
                  </option>
                ))}
              </select>
              <span className="text-sm font-semibold min-w-[80px] text-right" style={{ color: 'var(--text-primary)' }}>
                {formatCLP(item.subtotal)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <TotalsBreakdown totals={totals} formatCLP={formatCLP} />

      <div className="flex justify-between pt-4">
        <button
          onClick={onPrev}
          className="flex items-center gap-2 px-4 py-2 text-sm"
          style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: '6px' }}
        >
          <ArrowLeft size={16} />
          Anterior
        </button>
        <button
          onClick={onNext}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium"
          style={{
            backgroundColor: 'var(--btn-primary-bg)',
            color: 'var(--btn-primary-text)',
            borderRadius: '6px',
          }}
        >
          Siguiente
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}

// ── Step 6: Payment ─────────────────────────────────────

function Step6Payment({ wizard, updateWizard, onNext, onPrev }: StepProps) {
  const [montoRecibido, setMontoRecibido] = useState(wizard.monto_pagado?.toString() ?? '')
  const [notas, setNotas] = useState(wizard.notas ?? '')

  const totals = calculateCartTotals(wizard.items)
  const formatCLP = (n: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(n)

  const paymentOptions: { value: PaymentMethod; label: string; icon: typeof Banknote }[] = [
    { value: 'EFECTIVO', label: 'Efectivo', icon: Banknote },
    { value: 'DEBITO', label: 'Débito', icon: CreditCard },
    { value: 'CREDITO', label: 'Crédito', icon: CreditCard },
    { value: 'TRANSFERENCIA', label: 'Transferencia', icon: ArrowRightLeft },
  ]

  const monto = parseFloat(montoRecibido) || 0
  const vuelto = wizard.metodo_pago === 'EFECTIVO' ? Math.max(0, monto - totals.total) : 0

  const handleNext = () => {
    if (!wizard.metodo_pago) {
      toast.error('Selecciona un método de pago')
      return
    }

    if (wizard.metodo_pago === 'EFECTIVO' && monto < totals.total) {
      toast.error('El monto recibido debe ser mayor o igual al total')
      return
    }

    const finalMonto = wizard.metodo_pago === 'EFECTIVO' ? monto : totals.total
    updateWizard({
      monto_pagado: finalMonto,
      notas: notas.trim() || null,
    })

    // Store vuelto temporarily (will use in step 7)
    updateWizard({
      monto_pagado: finalMonto,
      notas: notas.trim() || null,
    })

    onNext()
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
        Paso 6: Pago
      </h2>

      <div
        className="text-center p-4"
        style={{ backgroundColor: 'var(--bg-muted)', borderRadius: '8px' }}
      >
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total a pagar</p>
        <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {formatCLP(totals.total)}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {paymentOptions.map(({ value, label, icon: Icon }) => {
          const selected = wizard.metodo_pago === value
          return (
            <button
              key={value}
              onClick={() => updateWizard({ metodo_pago: value })}
              className="flex flex-col items-center gap-2 p-4 cursor-pointer"
              style={{
                border: `2px solid ${selected ? 'var(--btn-primary-bg)' : 'var(--border)'}`,
                backgroundColor: selected ? 'var(--badge-primary-bg)' : 'transparent',
                borderRadius: '8px',
              }}
            >
              <Icon size={24} style={{ color: selected ? 'var(--btn-primary-bg)' : 'var(--text-muted)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {label}
              </span>
            </button>
          )
        })}
      </div>

      {wizard.metodo_pago === 'EFECTIVO' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
              Monto recibido
            </label>
            <input
              type="number"
              value={montoRecibido}
              onChange={(e) => setMontoRecibido(e.target.value)}
              className="w-full text-sm py-2 px-3 outline-none"
              style={{
                backgroundColor: 'var(--input-bg)',
                border: `1px solid ${monto < totals.total && montoRecibido ? 'var(--status-danger)' : 'var(--input-border)'}`,
                borderRadius: '6px',
                color: 'var(--text-primary)',
              }}
              placeholder="0"
            />
          </div>
          {monto > 0 && (
            <div
              className="p-3 text-center"
              style={{
                backgroundColor: vuelto > 0 ? 'var(--badge-success-bg)' : 'var(--bg-muted)',
                borderRadius: '6px',
              }}
            >
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Vuelto</p>
              <p className="text-2xl font-bold" style={{ color: vuelto > 0 ? 'var(--status-success)' : 'var(--text-primary)' }}>
                {formatCLP(vuelto)}
              </p>
            </div>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
          Notas (opcional)
        </label>
        <textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          rows={2}
          className="w-full text-sm py-2 px-3 outline-none resize-none"
          style={{
            backgroundColor: 'var(--input-bg)',
            border: '1px solid var(--input-border)',
            borderRadius: '6px',
            color: 'var(--text-primary)',
          }}
          placeholder="Observaciones sobre la venta..."
        />
      </div>

      <div className="flex justify-between pt-4">
        <button
          onClick={onPrev}
          className="flex items-center gap-2 px-4 py-2 text-sm"
          style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: '6px' }}
        >
          <ArrowLeft size={16} />
          Anterior
        </button>
        <button
          onClick={handleNext}
          disabled={!wizard.metodo_pago}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium"
          style={{
            backgroundColor: 'var(--btn-primary-bg)',
            color: 'var(--btn-primary-text)',
            borderRadius: '6px',
            opacity: !wizard.metodo_pago ? 0.6 : 1,
          }}
        >
          Confirmar y completar
          <Check size={16} />
        </button>
      </div>
    </div>
  )
}

// ── Step 7: Receipt ─────────────────────────────────────

function Step7Receipt({ wizard }: { wizard: SaleWizardState }) {
  const navigate = useNavigate()
  const completeSale = useCompleteSale()
  const { data: config } = useConfig()
  const [completed, setCompleted] = useState(false)

  const totals = calculateCartTotals(wizard.items)
  const formatCLP = (n: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(n)
  const vuelto = wizard.metodo_pago === 'EFECTIVO' && wizard.monto_pagado
    ? Math.max(0, wizard.monto_pagado - totals.total)
    : 0

  const handleComplete = async () => {
    try {
      // Sync cart item quantities to DB before completing
      const { supabase } = await import('../../lib/supabase')
      for (const item of wizard.items) {
        const { data: dbItem } = await supabase
          .from('venta_item')
          .select('id')
          .eq('venta_id', wizard.venta_id!)
          .eq('producto_id', item.producto.id)
          .limit(1)
          .single()

        if (dbItem) {
          await supabase
            .from('venta_item')
            .update({
              cantidad: item.cantidad,
              descuento_monto: item.descuento_monto,
              subtotal: item.subtotal,
            })
            .eq('id', dbItem.id)
        }
      }

      // Update reservation quantities
      for (const item of wizard.items) {
        await supabase
          .from('reserva_stock_temporal')
          .update({ cantidad: item.cantidad })
          .eq('venta_id', wizard.venta_id!)
          .eq('producto_id', item.producto.id)
          .eq('liberada', false)
      }

      // Recalculate sale totals in DB
      const { recalculateSaleTotals } = await import('../../hooks/useSales')
      await recalculateSaleTotals(wizard.venta_id!)

      await completeSale.mutateAsync({
        venta_id: wizard.venta_id!,
        metodo_pago: wizard.metodo_pago!,
        monto_pagado: wizard.monto_pagado ?? totals.total,
        vuelto,
        receta_id: wizard.receta_id,
        motivo_sin_receta: wizard.motivo_sin_receta,
        notas: wizard.notas,
      })
      setCompleted(true)
      toast.success('Venta completada')
    } catch {
      toast.error('Error al completar la venta')
    }
  }

  if (!completed) {
    return (
      <div className="space-y-4 text-center">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          Paso 7: Confirmar venta
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Revisa el resumen y confirma para completar la venta.
        </p>

        {/* Quick summary */}
        <div className="space-y-2 text-left">
          <div className="flex justify-between text-sm" style={{ color: 'var(--text-secondary)' }}>
            <span>Cliente</span>
            <span style={{ color: 'var(--text-primary)' }}>{wizard.paciente?.nombre}</span>
          </div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            <span>Productos</span>
            <div className="mt-1 space-y-1">
              {wizard.items.map((item, i) => (
                <div key={i} className="flex justify-between pl-2" style={{ color: 'var(--text-primary)' }}>
                  <span>{item.producto.nombre} <span style={{ color: 'var(--text-muted)' }}>×{item.cantidad}</span></span>
                  <span>{formatCLP(item.subtotal)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-between text-sm" style={{ color: 'var(--text-secondary)' }}>
            <span>Pago</span>
            <span style={{ color: 'var(--text-primary)' }}>{wizard.metodo_pago ? PAYMENT_METHOD_LABELS[wizard.metodo_pago] : ''}</span>
          </div>
          <TotalsBreakdown totals={totals} formatCLP={formatCLP} compact />
        </div>

        <button
          onClick={handleComplete}
          disabled={completeSale.isPending}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium"
          style={{
            backgroundColor: 'var(--status-success)',
            color: '#fff',
            borderRadius: '6px',
            opacity: completeSale.isPending ? 0.6 : 1,
          }}
        >
          {completeSale.isPending ? 'Procesando...' : 'Confirmar venta'}
          <Check size={16} />
        </button>
      </div>
    )
  }

  // Receipt view after completion
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
          style={{ backgroundColor: 'var(--badge-success-bg)' }}
        >
          <Check size={24} style={{ color: 'var(--status-success)' }} />
        </div>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          Venta completada
        </h2>
      </div>

      {/* Receipt */}
      <div
        className="p-6 space-y-4 max-w-md mx-auto"
        style={{ border: '1px solid var(--border)', borderRadius: '8px' }}
        id="receipt"
      >
        <div className="text-center">
          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            {config?.nombre_optica ?? 'Óptica'}
          </h3>
          {config?.direccion && (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{config.direccion}</p>
          )}
          {config?.telefono && (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{config.telefono}</p>
          )}
          <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
            {new Date().toLocaleDateString('es-CL')} {new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        <div style={{ borderTop: '1px dashed var(--border)' }} />

        <div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Cliente: <span style={{ color: 'var(--text-primary)' }}>{wizard.paciente?.nombre}</span>
          </p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Verificación: <span style={{ color: 'var(--text-primary)' }}>{wizard.verificacion ? VERIFICATION_LABELS[wizard.verificacion] : ''}</span>
          </p>
        </div>

        <div style={{ borderTop: '1px dashed var(--border)' }} />

        <table className="w-full text-sm">
          <thead>
            <tr style={{ color: 'var(--text-secondary)' }}>
              <th className="text-left font-medium pb-1">Producto</th>
              <th className="text-center font-medium pb-1">Cant</th>
              <th className="text-right font-medium pb-1">Total</th>
            </tr>
          </thead>
          <tbody>
            {wizard.items.map((item) => (
              <tr key={item.producto.id}>
                <td className="py-1" style={{ color: 'var(--text-primary)' }}>
                  {item.producto.nombre}
                  {item.descuento_porcentaje > 0 && (
                    <span className="text-xs ml-1" style={{ color: 'var(--status-success)' }}>
                      -{item.descuento_porcentaje}%
                    </span>
                  )}
                </td>
                <td className="text-center" style={{ color: 'var(--text-primary)' }}>{item.cantidad}</td>
                <td className="text-right">
                  <span style={{ color: 'var(--text-primary)' }}>{formatCLP(item.subtotal)}</span>
                  <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>
                    neto {formatCLP(Math.round(item.subtotal / 1.19))}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ borderTop: '1px dashed var(--border)' }} />

        <div className="space-y-1">
          <TotalsBreakdown totals={totals} formatCLP={formatCLP} />
          <div className="flex justify-between text-sm" style={{ color: 'var(--text-secondary)' }}>
            <span>Pago ({wizard.metodo_pago ? PAYMENT_METHOD_LABELS[wizard.metodo_pago] : ''})</span>
            <span>{formatCLP(wizard.monto_pagado ?? totals.total)}</span>
          </div>
          {vuelto > 0 && (
            <div className="flex justify-between text-sm" style={{ color: 'var(--status-success)' }}>
              <span>Vuelto</span>
              <span>{formatCLP(vuelto)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap justify-center gap-3">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium"
          style={{
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
          }}
        >
          <Printer size={16} />
          Imprimir
        </button>
        <button
          onClick={() => navigate(`/admin/ventas/${wizard.venta_id}`)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium"
          style={{
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
          }}
        >
          <Eye size={16} />
          Ver detalle
        </button>
        <button
          onClick={() => navigate('/admin/ventas/nueva')}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium"
          style={{
            backgroundColor: 'var(--btn-primary-bg)',
            color: 'var(--btn-primary-text)',
            borderRadius: '6px',
          }}
        >
          <ShoppingCart size={16} />
          Nueva venta
        </button>
      </div>
    </div>
  )
}

// ── Totals Breakdown (shared) ───────────────────────────

function TotalsBreakdown({
  totals,
  formatCLP,
  compact,
}: {
  totals: { subtotal: number; descuento_total: number; total: number; neto: number; iva: number }
  formatCLP: (n: number) => string
  compact?: boolean
}) {
  return (
    <div className={`${compact ? '' : 'pt-3'} space-y-1`} style={compact ? {} : { borderTop: '1px solid var(--border)' }}>
      {!compact && (
        <div className="flex justify-between text-sm" style={{ color: 'var(--text-secondary)' }}>
          <span>Subtotal</span>
          <span>{formatCLP(totals.subtotal)}</span>
        </div>
      )}
      {totals.descuento_total > 0 && (
        <div className="flex justify-between text-sm" style={{ color: 'var(--status-success)' }}>
          <span>Descuento</span>
          <span>-{formatCLP(totals.descuento_total)}</span>
        </div>
      )}
      <div className="flex justify-between text-sm" style={{ color: 'var(--text-secondary)' }}>
        <span>Neto</span>
        <span>{formatCLP(totals.neto)}</span>
      </div>
      <div className="flex justify-between text-sm" style={{ color: 'var(--text-secondary)' }}>
        <span>IVA (19%)</span>
        <span>{formatCLP(totals.iva)}</span>
      </div>
      <div className={`flex justify-between ${compact ? 'text-lg' : 'text-base'} font-semibold pt-1`} style={{ color: 'var(--text-primary)', borderTop: '1px solid var(--border)' }}>
        <span>Total</span>
        <span>{formatCLP(totals.total)}</span>
      </div>
    </div>
  )
}
