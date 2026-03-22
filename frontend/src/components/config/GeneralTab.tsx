import { useState, useEffect, type FormEvent } from 'react'
import { Save } from 'lucide-react'
import { useConfig, useUpdateConfig } from '../../hooks/useConfig'
import { configFormSchema, type ConfigFormData } from '../../types/config'
import toast from 'react-hot-toast'

export function GeneralTab() {
  const { data: config, isLoading } = useConfig()
  const updateMutation = useUpdateConfig()
  const [form, setForm] = useState<ConfigFormData | null>(null)

  useEffect(() => {
    if (config && !form) {
      setForm({
        nombre_optica: config.nombre_optica,
        direccion: config.direccion ?? '',
        telefono: config.telefono ?? '',
        email: config.email ?? '',
        moneda_local: config.moneda_local,
        limite_citas_dia: config.limite_citas_dia,
        descuento_maximo: config.descuento_maximo,
        max_cancelaciones_mes: config.max_cancelaciones_mes,
        duracion_reserva_stock_min: config.duracion_reserva_stock_min,
        preferencia_contacto_default: config.preferencia_contacto_default,
        modo_acumulacion_descuento: config.modo_acumulacion_descuento,
        google_maps_embed: config.google_maps_embed ?? '',
        meta_ventas_diaria: config.meta_ventas_diaria,
      })
    }
  }, [config, form])

  if (isLoading || !form) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--btn-primary-bg)' }} />
      </div>
    )
  }

  function handleChange(field: keyof ConfigFormData, value: string | number) {
    setForm((prev) => prev ? { ...prev, [field]: value } : prev)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form || !config) return

    const result = configFormSchema.safeParse(form)
    if (!result.success) {
      toast.error(result.error.issues[0].message)
      return
    }

    try {
      await updateMutation.mutateAsync({ ...result.data, id: config.id })
      toast.success('Configuración guardada')
    } catch {
      toast.error('Error al guardar')
    }
  }

  function renderInput(field: keyof ConfigFormData, label: string, opts?: { type?: string; placeholder?: string; required?: boolean }) {
    return (
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
          {label}{opts?.required ? ' *' : ''}
        </label>
        <input
          type={opts?.type ?? 'text'}
          value={form![field] as string | number}
          onChange={(e) => handleChange(field, opts?.type === 'number' ? Number(e.target.value) : e.target.value)}
          placeholder={opts?.placeholder}
          className="w-full px-3 py-2 text-sm outline-none"
          style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '6px', color: 'var(--input-text)' }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--border-focus)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--input-border)')}
        />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-5">
      {/* Datos básicos */}
      <div className="p-5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px' }}>
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Datos de la óptica</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">{renderInput('nombre_optica', 'Nombre de la óptica', { required: true })}</div>
          {renderInput('email', 'Email', { type: 'email', placeholder: 'contacto@optica.cl' })}
          {renderInput('telefono', 'Teléfono', { placeholder: '+56 9 1234 5678' })}
          <div className="md:col-span-2">{renderInput('direccion', 'Dirección')}</div>
          <div className="md:col-span-2">{renderInput('google_maps_embed', 'Google Maps (embed URL)', { placeholder: 'https://www.google.com/maps/embed?...' })}</div>
        </div>
      </div>

      {/* Límites */}
      <div className="p-5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px' }}>
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Límites y preferencias</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {renderInput('limite_citas_dia', 'Máx. citas por día', { type: 'number' })}
          {renderInput('max_cancelaciones_mes', 'Máx. cancelaciones/mes', { type: 'number' })}
          {renderInput('duracion_reserva_stock_min', 'Reserva stock (min)', { type: 'number' })}
          {renderInput('descuento_maximo', 'Descuento máximo (%)', { type: 'number' })}
          {renderInput('meta_ventas_diaria', 'Meta ventas diaria ($)', { type: 'number', placeholder: '200000' })}
          {renderInput('moneda_local', 'Moneda', { placeholder: 'CLP' })}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
              Contacto por defecto
            </label>
            <select
              value={form.preferencia_contacto_default}
              onChange={(e) => handleChange('preferencia_contacto_default', e.target.value)}
              className="w-full px-3 py-2 text-sm outline-none"
              style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '6px', color: 'var(--input-text)' }}
            >
              <option value="AMBOS">Email + WhatsApp</option>
              <option value="EMAIL">Solo email</option>
              <option value="WHATSAPP">Solo WhatsApp</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
            Modo acumulación de descuentos
          </label>
          <select
            value={form.modo_acumulacion_descuento}
            onChange={(e) => handleChange('modo_acumulacion_descuento', e.target.value)}
            className="w-full max-w-sm px-3 py-2 text-sm outline-none"
            style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '6px', color: 'var(--input-text)' }}
          >
            <option value="MAS_ESPECIFICO">Solo el más específico</option>
            <option value="ACUMULADO">Acumulados</option>
            <option value="ACUMULADO_CON_TOPE">Acumulados con tope máximo</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={updateMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
          style={{ backgroundColor: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', borderRadius: '6px' }}
          onMouseEnter={(e) => !updateMutation.isPending && (e.currentTarget.style.backgroundColor = 'var(--btn-primary-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--btn-primary-bg)')}
        >
          <Save size={16} />
          {updateMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  )
}
