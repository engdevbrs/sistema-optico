import { useState, useEffect, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { X, Search, Clock } from 'lucide-react'
import { appointmentFormSchema, type AppointmentFormData } from '../../types/appointment'
import { useCreateAppointment, useAppointmentTypes, useWeeklySchedule, useAppointments } from '../../hooks/useAppointments'
import { usePatients } from '../../hooks/usePatients'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import toast from 'react-hot-toast'

interface NewAppointmentModalProps {
  defaultDate: string
  onClose: () => void
}

function generateTimeSlots(start: string, end: string, intervalMin: number): string[] {
  const slots: string[] = []
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  let current = sh * 60 + sm
  const endMin = eh * 60 + em

  while (current + intervalMin <= endMin) {
    const h = Math.floor(current / 60)
    const m = current % 60
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    current += intervalMin
  }
  return slots
}

export function NewAppointmentModal({ defaultDate, onClose }: NewAppointmentModalProps) {
  const [form, setForm] = useState<AppointmentFormData>({
    paciente_id: '',
    tipo_cita_id: '',
    fecha: defaultDate,
    hora_inicio: '',
    notas_admin: '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof AppointmentFormData, string>>>({})
  const [patientSearch, setPatientSearch] = useState('')
  const debouncedPatientSearch = useDebouncedValue(patientSearch)

  const { data: patients } = usePatients(debouncedPatientSearch)
  const { data: appointmentTypes } = useAppointmentTypes()
  const { data: schedule } = useWeeklySchedule()
  const { data: existingAppointments } = useAppointments(form.fecha)
  const createMutation = useCreateAppointment()

  const selectedType = appointmentTypes?.find((t) => t.id === form.tipo_cita_id)
  const selectedPatient = patients?.find((p) => p.id === form.paciente_id)

  // Generate available time slots
  const [availableSlots, setAvailableSlots] = useState<string[]>([])

  useEffect(() => {
    if (!form.fecha || !schedule || !selectedType) {
      setAvailableSlots([])
      return
    }

    const date = new Date(form.fecha + 'T12:00:00')
    const daySchedule = schedule.find((s) => s.dia_semana === date.getDay())

    if (!daySchedule?.activo) {
      setAvailableSlots([])
      return
    }

    const allSlots = generateTimeSlots(daySchedule.hora_inicio, daySchedule.hora_fin, 15)

    // Filter out occupied slots
    const freeSlots = allSlots.filter((slot) => {
      const [sh, sm] = slot.split(':').map(Number)
      const slotStart = sh * 60 + sm
      const slotEnd = slotStart + selectedType.duracion_min

      // Check if this slot overlaps with any existing appointment
      const overlaps = existingAppointments?.some((apt) => {
        if (apt.estado === 'CANCELADA' || apt.estado === 'NO_ASISTIO') return false
        const [ah, am] = apt.hora_inicio.split(':').map(Number)
        const [aeh, aem] = apt.hora_fin.split(':').map(Number)
        const aptStart = ah * 60 + am
        const aptEnd = aeh * 60 + aem
        return slotStart < aptEnd && slotEnd > aptStart
      })

      // Check slot doesn't exceed schedule end
      const [endH, endM] = daySchedule.hora_fin.split(':').map(Number)
      const scheduleEnd = endH * 60 + endM

      return !overlaps && slotEnd <= scheduleEnd
    })

    setAvailableSlots(freeSlots)
  }, [form.fecha, form.tipo_cita_id, schedule, selectedType, existingAppointments])

  function handleChange(field: keyof AppointmentFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErrors({})

    const result = appointmentFormSchema.safeParse(form)
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof AppointmentFormData, string>> = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof AppointmentFormData
        fieldErrors[field] = issue.message
      }
      setErrors(fieldErrors)
      return
    }

    try {
      await createMutation.mutateAsync(result.data)
      toast.success('Cita agendada')
      onClose()
    } catch (err: unknown) {
      const pgError = err as { code?: string }
      if (pgError.code === '23505') {
        toast.error(
          'Este paciente ya tiene una cita activa. Debe cancelar o completar la cita existente antes de agendar una nueva.',
        )
      } else {
        toast.error('Error al crear la cita')
      }
    }
  }

  return createPortal(
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="w-full max-w-lg max-h-[90vh] overflow-y-auto pointer-events-auto"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: '8px',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Nueva cita
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-md transition-colors"
              style={{ color: 'var(--text-muted)' }}
              aria-label="Cerrar"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
            {/* Paciente */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                Paciente *
              </label>
              {selectedPatient ? (
                <div
                  className="flex items-center justify-between px-3 py-2 rounded-md"
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
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)')
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor = 'transparent')
                          }
                        >
                          {p.nombre}
                          <span className="ml-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                            {p.email}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  {errors.paciente_id && (
                    <p className="text-xs mt-1" style={{ color: 'var(--status-danger)' }}>
                      {errors.paciente_id}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Tipo de cita */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                Tipo de cita *
              </label>
              <select
                value={form.tipo_cita_id}
                onChange={(e) => {
                  handleChange('tipo_cita_id', e.target.value)
                  handleChange('hora_inicio', '') // Reset hora al cambiar tipo
                }}
                className="w-full px-3 py-2 text-sm outline-none"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  border: `1px solid ${errors.tipo_cita_id ? 'var(--status-danger)' : 'var(--input-border)'}`,
                  borderRadius: '6px',
                  color: 'var(--input-text)',
                }}
              >
                <option value="">Seleccionar...</option>
                {appointmentTypes?.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.nombre} ({type.duracion_min} min)
                  </option>
                ))}
              </select>
              {errors.tipo_cita_id && (
                <p className="text-xs mt-1" style={{ color: 'var(--status-danger)' }}>
                  {errors.tipo_cita_id}
                </p>
              )}
            </div>

            {/* Fecha */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                Fecha *
              </label>
              <input
                type="date"
                value={form.fecha}
                onChange={(e) => {
                  handleChange('fecha', e.target.value)
                  handleChange('hora_inicio', '')
                }}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 text-sm outline-none"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  border: `1px solid ${errors.fecha ? 'var(--status-danger)' : 'var(--input-border)'}`,
                  borderRadius: '6px',
                  color: 'var(--input-text)',
                }}
              />
              {errors.fecha && (
                <p className="text-xs mt-1" style={{ color: 'var(--status-danger)' }}>
                  {errors.fecha}
                </p>
              )}
            </div>

            {/* Hora */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                Hora *
              </label>
              {!form.tipo_cita_id || !form.fecha ? (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Selecciona tipo de cita y fecha primero
                </p>
              ) : availableSlots.length === 0 ? (
                <p className="text-xs" style={{ color: 'var(--status-warning)' }}>
                  No hay horarios disponibles para esta fecha
                </p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => handleChange('hora_inicio', slot)}
                      className="flex items-center justify-center gap-1 px-2 py-2 text-sm font-medium rounded-md transition-colors"
                      style={{
                        backgroundColor:
                          form.hora_inicio === slot
                            ? 'var(--btn-primary-bg)'
                            : 'transparent',
                        color:
                          form.hora_inicio === slot
                            ? 'var(--btn-primary-text)'
                            : 'var(--text-primary)',
                        border: `1px solid ${form.hora_inicio === slot ? 'var(--btn-primary-bg)' : 'var(--border)'}`,
                        borderRadius: '6px',
                      }}
                    >
                      <Clock size={12} />
                      {slot}
                    </button>
                  ))}
                </div>
              )}
              {errors.hora_inicio && (
                <p className="text-xs mt-1" style={{ color: 'var(--status-danger)' }}>
                  {errors.hora_inicio}
                </p>
              )}
            </div>

            {/* Notas */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                Notas (opcional)
              </label>
              <textarea
                value={form.notas_admin}
                onChange={(e) => handleChange('notas_admin', e.target.value)}
                rows={2}
                placeholder="Notas sobre la cita..."
                className="w-full px-3 py-2 text-sm outline-none resize-none"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  border: '1px solid var(--input-border)',
                  borderRadius: '6px',
                  color: 'var(--input-text)',
                }}
              />
            </div>
          </form>

          {/* Footer */}
          <div
            className="flex justify-end gap-3 px-6 py-4"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            <button
              type="button"
              onClick={onClose}
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
              onClick={handleSubmit}
              disabled={createMutation.isPending}
              className="px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
              style={{
                backgroundColor: 'var(--btn-primary-bg)',
                color: 'var(--btn-primary-text)',
                borderRadius: '6px',
              }}
              onMouseEnter={(e) =>
                !createMutation.isPending &&
                (e.currentTarget.style.backgroundColor = 'var(--btn-primary-hover)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = 'var(--btn-primary-bg)')
              }
            >
              {createMutation.isPending ? 'Agendando...' : 'Agendar cita'}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  )
}
