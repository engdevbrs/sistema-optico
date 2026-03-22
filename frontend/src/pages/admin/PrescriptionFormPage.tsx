import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Search } from 'lucide-react'
import { prescriptionFormSchema, type PrescriptionFormData } from '../../types/prescription'
import { useCreatePrescription } from '../../hooks/usePrescriptions'
import { usePatients } from '../../hooks/usePatients'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import toast from 'react-hot-toast'

interface EyeFieldsProps {
  prefix: 'od' | 'oi'
  label: string
  form: PrescriptionFormData
  errors: Partial<Record<string, string>>
  onChange: (field: string, value: string) => void
}

function EyeFields({ prefix, label, form, errors, onChange }: EyeFieldsProps) {
  const fields = [
    { key: `${prefix}_esfera`, label: 'Esfera (SPH)', placeholder: '-2.50' },
    { key: `${prefix}_cilindro`, label: 'Cilindro (CYL)', placeholder: '-0.75' },
    { key: `${prefix}_eje`, label: 'Eje (AXIS)', placeholder: '180' },
    { key: `${prefix}_adicion`, label: 'Adición (ADD)', placeholder: '+1.50' },
    { key: `${prefix}_agudeza_visual`, label: 'Agudeza Visual', placeholder: '20/20' },
  ]

  return (
    <div
      className="p-4"
      style={{
        border: '1px solid var(--border)',
        borderRadius: '8px',
        backgroundColor: 'var(--bg-muted)',
      }}
    >
      <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
        {label}
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {fields.map(({ key, label: fieldLabel, placeholder }) => (
          <div key={key}>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              {fieldLabel}
            </label>
            <input
              type={key.includes('agudeza') ? 'text' : 'number'}
              step={key.includes('eje') ? '1' : '0.25'}
              value={(form as Record<string, unknown>)[key] as string ?? ''}
              onChange={(e) => {
                if (key.includes('agudeza')) {
                  let val = e.target.value.replace(/[^0-9/]/g, '')
                  // Auto-insertar / después de los primeros dígitos
                  if (val.length === 2 && !val.includes('/')) {
                    val = val + '/'
                  }
                  // No permitir más de un /
                  const parts = val.split('/')
                  if (parts.length > 2) return
                  // Limitar a formato XX/XX
                  if (parts[0] && parts[0].length > 2) return
                  if (parts[1] && parts[1].length > 3) return
                  onChange(key, val)
                } else {
                  onChange(key, e.target.value)
                }
              }}
              placeholder={placeholder}
              className="w-full px-2 py-1.5 text-sm outline-none"
              style={{
                backgroundColor: 'var(--input-bg)',
                border: `1px solid ${errors[key] ? 'var(--status-danger)' : 'var(--input-border)'}`,
                borderRadius: '6px',
                color: 'var(--input-text)',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--border-focus)')}
              onBlur={(e) => (e.target.style.borderColor = errors[key] ? 'var(--status-danger)' : 'var(--input-border)')}
            />
            {errors[key] && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--status-danger)' }}>{errors[key]}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function PrescriptionFormPage() {
  const navigate = useNavigate()
  const createMutation = useCreatePrescription()
  const [patientSearch, setPatientSearch] = useState('')
  const debouncedPatientSearch = useDebouncedValue(patientSearch)
  const { data: patients } = usePatients(debouncedPatientSearch)

  const [form, setForm] = useState<PrescriptionFormData>({
    paciente_id: '',
    cita_id: '',
    od_esfera: null,
    od_cilindro: null,
    od_eje: null,
    od_adicion: null,
    od_agudeza_visual: '',
    oi_esfera: null,
    oi_cilindro: null,
    oi_eje: null,
    oi_adicion: null,
    oi_agudeza_visual: '',
    distancia_pupilar: null,
    observaciones: '',
    proxima_revision: '',
    reemplaza_a: '',
  })
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({})
  const selectedPatient = patients?.find((p) => p.id === form.paciente_id)

  function handleChange(field: string, value: string) {
    setForm((prev) => ({
      ...prev,
      [field]: value === '' ? (field.includes('agudeza') || field === 'observaciones' || field === 'proxima_revision' ? '' : null) : value,
    }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErrors({})

    const result = prescriptionFormSchema.safeParse(form)
    if (!result.success) {
      const fieldErrors: Partial<Record<string, string>> = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string
        fieldErrors[field] = issue.message
      }
      setErrors(fieldErrors)
      return
    }

    try {
      await createMutation.mutateAsync(result.data)
      toast.success('Receta creada')
      navigate('/admin/recetas')
    } catch {
      toast.error('Error al crear la receta')
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/admin/recetas')}
          className="p-2 rounded-md transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          aria-label="Volver"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          Nueva receta óptica
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-5">
        {/* Paciente */}
        <div
          className="p-5"
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
          }}
        >
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
            Paciente *
          </label>
          {selectedPatient ? (
            <div
              className="flex items-center justify-between px-3 py-2"
              style={{
                backgroundColor: 'var(--badge-primary-bg)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
              }}
            >
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {selectedPatient.nombre}
              </span>
              <button
                type="button"
                onClick={() => handleChange('paciente_id', '')}
                className="text-xs"
                style={{ color: 'var(--text-muted)' }}
              >
                Cambiar
              </button>
            </div>
          ) : (
            <div>
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)' }}
                />
                <input
                  type="text"
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  placeholder="Buscar paciente..."
                  className="w-full pl-9 pr-3 py-2 text-sm outline-none"
                  style={{
                    backgroundColor: 'var(--input-bg)',
                    border: `1px solid ${errors.paciente_id ? 'var(--status-danger)' : 'var(--input-border)'}`,
                    borderRadius: '6px',
                    color: 'var(--input-text)',
                  }}
                />
              </div>
              {patientSearch && patients && patients.length > 0 && (
                <div
                  className="mt-1 max-h-32 overflow-y-auto"
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    backgroundColor: 'var(--bg-surface)',
                  }}
                >
                  {patients.slice(0, 5).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        handleChange('paciente_id', p.id)
                        setPatientSearch('')
                      }}
                      className="w-full text-left px-3 py-2 text-sm transition-colors"
                      style={{ color: 'var(--text-primary)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {p.nombre}
                      <span className="ml-2 text-xs" style={{ color: 'var(--text-muted)' }}>{p.email}</span>
                    </button>
                  ))}
                </div>
              )}
              {errors.paciente_id && (
                <p className="text-xs mt-1" style={{ color: 'var(--status-danger)' }}>{errors.paciente_id}</p>
              )}
            </div>
          )}
        </div>

        {/* Ojos */}
        <EyeFields prefix="od" label="Ojo Derecho (OD)" form={form} errors={errors} onChange={handleChange} />
        <EyeFields prefix="oi" label="Ojo Izquierdo (OI)" form={form} errors={errors} onChange={handleChange} />

        {/* Extras */}
        <div
          className="p-5 space-y-4"
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                Distancia pupilar (mm)
              </label>
              <input
                type="number"
                step="0.5"
                value={form.distancia_pupilar ?? ''}
                onChange={(e) => handleChange('distancia_pupilar', e.target.value)}
                placeholder="63.0"
                className="w-full px-3 py-2 text-sm outline-none"
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
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                Próxima revisión
              </label>
              <input
                type="date"
                value={form.proxima_revision ?? ''}
                onChange={(e) => handleChange('proxima_revision', e.target.value)}
                className="w-full px-3 py-2 text-sm outline-none"
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

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
              Observaciones
            </label>
            <textarea
              value={form.observaciones ?? ''}
              onChange={(e) => handleChange('observaciones', e.target.value)}
              rows={3}
              placeholder="Observaciones clínicas..."
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

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/recetas')}
            className="px-4 py-2 text-sm font-medium"
            style={{
              color: 'var(--btn-secondary-text)',
              border: '1px solid var(--btn-secondary-border)',
              borderRadius: '6px',
            }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
            style={{
              backgroundColor: 'var(--btn-primary-bg)',
              color: 'var(--btn-primary-text)',
              borderRadius: '6px',
            }}
            onMouseEnter={(e) =>
              !createMutation.isPending && (e.currentTarget.style.backgroundColor = 'var(--btn-primary-hover)')
            }
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--btn-primary-bg)')}
          >
            <Save size={16} />
            {createMutation.isPending ? 'Guardando...' : 'Crear receta'}
          </button>
        </div>
      </form>
    </div>
  )
}
