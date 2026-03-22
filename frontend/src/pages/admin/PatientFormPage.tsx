import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { patientFormSchema, type PatientFormData } from '../../types/patient'
import { usePatient, useCreatePatient, useUpdatePatient } from '../../hooks/usePatients'
import toast from 'react-hot-toast'

export default function PatientFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const { data: patient, isLoading: loadingPatient } = usePatient(id)
  const createMutation = useCreatePatient()
  const updateMutation = useUpdatePatient()

  const [form, setForm] = useState<PatientFormData>({
    nombre: '',
    email: '',
    telefono: '+56 9 ',
    fecha_nacimiento: '',
    preferencia_contacto: 'AMBOS',
    notas: '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof PatientFormData, string>>>({})
  const [initialized, setInitialized] = useState(false)

  // Populate form when editing
  if (isEdit && patient && !initialized) {
    setForm({
      nombre: patient.nombre,
      email: patient.email,
      telefono: patient.telefono ?? '',
      fecha_nacimiento: patient.fecha_nacimiento ?? '',
      preferencia_contacto: patient.preferencia_contacto,
      notas: patient.notas ?? '',
    })
    setInitialized(true)
  }

  function handleChange(field: keyof PatientFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErrors({})

    const result = patientFormSchema.safeParse(form)
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof PatientFormData, string>> = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof PatientFormData
        fieldErrors[field] = issue.message
      }
      setErrors(fieldErrors)
      return
    }

    try {
      if (isEdit && id) {
        await updateMutation.mutateAsync({ ...result.data, id })
        toast.success('Paciente actualizado')
      } else {
        await createMutation.mutateAsync(result.data)
        toast.success('Paciente creado')
      }
      navigate('/admin/pacientes')
    } catch {
      toast.error(isEdit ? 'Error al actualizar' : 'Error al crear paciente')
    }
  }

  const submitting = createMutation.isPending || updateMutation.isPending

  if (isEdit && loadingPatient) {
    return (
      <div className="flex items-center justify-center py-12">
        <div
          className="w-6 h-6 border-2 rounded-full animate-spin"
          style={{ borderColor: 'var(--border)', borderTopColor: 'var(--btn-primary-bg)' }}
        />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/admin/pacientes')}
          className="p-2 rounded-md transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)')
          }
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          aria-label="Volver"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          {isEdit ? 'Editar paciente' : 'Nuevo paciente'}
        </h1>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="max-w-2xl p-6"
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nombre */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
              Nombre completo *
            </label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              placeholder="Juan Pérez"
              className="w-full px-3 py-2 text-sm outline-none transition-colors"
              style={{
                backgroundColor: 'var(--input-bg)',
                border: `1px solid ${errors.nombre ? 'var(--status-danger)' : 'var(--input-border)'}`,
                borderRadius: '6px',
                color: 'var(--input-text)',
              }}
              onFocus={(e) => (e.target.style.borderColor = errors.nombre ? 'var(--status-danger)' : 'var(--border-focus)')}
              onBlur={(e) => (e.target.style.borderColor = errors.nombre ? 'var(--status-danger)' : 'var(--input-border)')}
            />
            {errors.nombre && (
              <p className="text-xs mt-1" style={{ color: 'var(--status-danger)' }}>{errors.nombre}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
              Email *
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="juan@email.com"
              className="w-full px-3 py-2 text-sm outline-none transition-colors"
              style={{
                backgroundColor: 'var(--input-bg)',
                border: `1px solid ${errors.email ? 'var(--status-danger)' : 'var(--input-border)'}`,
                borderRadius: '6px',
                color: 'var(--input-text)',
              }}
              onFocus={(e) => (e.target.style.borderColor = errors.email ? 'var(--status-danger)' : 'var(--border-focus)')}
              onBlur={(e) => (e.target.style.borderColor = errors.email ? 'var(--status-danger)' : 'var(--input-border)')}
            />
            {errors.email && (
              <p className="text-xs mt-1" style={{ color: 'var(--status-danger)' }}>{errors.email}</p>
            )}
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
              Teléfono
            </label>
            <input
              type="tel"
              value={form.telefono}
              onChange={(e) => {
                const val = e.target.value
                if (!val.startsWith('+56 9 ')) return
                handleChange('telefono', val)
              }}
              placeholder="+56 9 1234 5678"
              className="w-full px-3 py-2 text-sm outline-none transition-colors"
              style={{
                backgroundColor: 'var(--input-bg)',
                border: `1px solid ${errors.telefono ? 'var(--status-danger)' : 'var(--input-border)'}`,
                borderRadius: '6px',
                color: 'var(--input-text)',
              }}
              onFocus={(e) => (e.target.style.borderColor = errors.telefono ? 'var(--status-danger)' : 'var(--border-focus)')}
              onBlur={(e) => (e.target.style.borderColor = errors.telefono ? 'var(--status-danger)' : 'var(--input-border)')}
            />
            {errors.telefono && (
              <p className="text-xs mt-1" style={{ color: 'var(--status-danger)' }}>{errors.telefono}</p>
            )}
          </div>

          {/* Fecha de nacimiento */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
              Fecha de nacimiento
            </label>
            <input
              type="date"
              value={form.fecha_nacimiento}
              onChange={(e) => handleChange('fecha_nacimiento', e.target.value)}
              className="w-full px-3 py-2 text-sm outline-none transition-colors"
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

          {/* Preferencia de contacto */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
              Preferencia de contacto
            </label>
            <select
              value={form.preferencia_contacto}
              onChange={(e) => handleChange('preferencia_contacto', e.target.value)}
              className="w-full px-3 py-2 text-sm outline-none transition-colors"
              style={{
                backgroundColor: 'var(--input-bg)',
                border: '1px solid var(--input-border)',
                borderRadius: '6px',
                color: 'var(--input-text)',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--border-focus)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--input-border)')}
            >
              <option value="AMBOS">Email + WhatsApp</option>
              <option value="EMAIL">Solo email</option>
              <option value="WHATSAPP">Solo WhatsApp</option>
            </select>
          </div>

          {/* Notas */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
              Notas
            </label>
            <textarea
              value={form.notas}
              onChange={(e) => handleChange('notas', e.target.value)}
              rows={3}
              placeholder="Notas internas sobre el paciente..."
              className="w-full px-3 py-2 text-sm outline-none transition-colors resize-none"
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
        <div className="flex justify-end gap-3 mt-6 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
          <button
            type="button"
            onClick={() => navigate('/admin/pacientes')}
            className="px-4 py-2 text-sm font-medium transition-colors"
            style={{
              backgroundColor: 'var(--btn-secondary-bg)',
              color: 'var(--btn-secondary-text)',
              border: '1px solid var(--btn-secondary-border)',
              borderRadius: '6px',
            }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
            style={{
              backgroundColor: 'var(--btn-primary-bg)',
              color: 'var(--btn-primary-text)',
              borderRadius: '6px',
            }}
            onMouseEnter={(e) =>
              !submitting && (e.currentTarget.style.backgroundColor = 'var(--btn-primary-hover)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = 'var(--btn-primary-bg)')
            }
          >
            <Save size={16} />
            {submitting ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear paciente'}
          </button>
        </div>
      </form>
    </div>
  )
}
