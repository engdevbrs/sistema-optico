import { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Clock, User } from 'lucide-react'
import {
  useAppointments,
  useAppointmentsByRange,
  useWeeklySchedule,
  useUpdateAppointmentStatus,
} from '../../hooks/useAppointments'
import { STATUS_CONFIG, type Appointment, type AppointmentStatus } from '../../types/appointment'
import { NewAppointmentModal } from '../../components/ui/NewAppointmentModal'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { DropdownMenu, DropdownItem } from '../../components/ui/DropdownMenu'
import toast from 'react-hot-toast'

type ViewMode = 'dia' | 'semana'

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatDateDisplay(date: Date): string {
  return date.toLocaleDateString('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function getWeekDates(date: Date): Date[] {
  const day = date.getDay()
  const monday = new Date(date)
  monday.setDate(date.getDate() - (day === 0 ? 6 : day - 1))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function StatusBadge({ status }: { status: AppointmentStatus }) {
  const config = STATUS_CONFIG[status]
  return (
    <span
      className="inline-flex px-2 py-0.5 text-xs font-medium"
      style={{
        backgroundColor: `var(${config.bgVar})`,
        color: `var(${config.textVar})`,
        borderRadius: '9999px',
      }}
    >
      {config.label}
    </span>
  )
}

interface AppointmentCardProps {
  appointment: Appointment
  onStatusChange: (id: string, status: AppointmentStatus) => void
}

function AppointmentCard({ appointment, onStatusChange }: AppointmentCardProps) {
  const [confirmAction, setConfirmAction] = useState<{ label: string; status: AppointmentStatus } | null>(null)
  const paciente = appointment.paciente
  const tipoCita = appointment.tipo_cita

  const statusActions: { label: string; status: AppointmentStatus; danger?: boolean }[] = []
  if (appointment.estado === 'PRE_RESERVA') {
    statusActions.push({ label: 'Confirmar', status: 'CONFIRMADA' })
    statusActions.push({ label: 'Cancelar', status: 'CANCELADA', danger: true })
  }
  if (appointment.estado === 'PENDIENTE') {
    statusActions.push({ label: 'Confirmar', status: 'CONFIRMADA' })
    statusActions.push({ label: 'Cancelar', status: 'CANCELADA', danger: true })
  }
  if (appointment.estado === 'CONFIRMADA') {
    statusActions.push({ label: 'Completar', status: 'COMPLETADA' })
    statusActions.push({ label: 'No asistió', status: 'NO_ASISTIO' })
    statusActions.push({ label: 'Cancelar', status: 'CANCELADA', danger: true })
  }
  if (appointment.estado === 'COMPLETADA') {
    statusActions.push({ label: 'Cancelar', status: 'CANCELADA', danger: true })
  }
  if (appointment.estado === 'NO_ASISTIO') {
    statusActions.push({ label: 'Cancelar', status: 'CANCELADA', danger: true })
  }

  return (
    <div
      className="p-3 rounded-md relative"
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        borderLeft: `3px solid var(${STATUS_CONFIG[appointment.estado].textVar})`,
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              <Clock size={12} />
              {appointment.hora_inicio.slice(0, 5)} - {appointment.hora_fin.slice(0, 5)}
            </span>
            <StatusBadge status={appointment.estado} />
          </div>
          <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
            <User size={12} className="inline mr-1" />
            {paciente?.nombre ?? 'Paciente'}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {tipoCita?.nombre ?? 'Cita'} · {appointment.duracion_min} min
          </p>
          {appointment.notas_admin && (
            <p className="text-xs mt-1 italic" style={{ color: 'var(--text-muted)' }}>
              {appointment.notas_admin}
            </p>
          )}
        </div>

        {statusActions.length > 0 && (
          <DropdownMenu>
            {(close) =>
              statusActions.map((action) => (
                <DropdownItem
                  key={action.status}
                  icon={<span />}
                  label={action.label}
                  danger={action.danger}
                  onClick={() => {
                    close()
                    if (action.danger) {
                      setConfirmAction({ label: action.label, status: action.status })
                    } else {
                      onStatusChange(appointment.id, action.status)
                    }
                  }}
                />
              ))
            }
          </DropdownMenu>
        )}
      </div>

      {confirmAction && (
        <ConfirmModal
          title={`${confirmAction.label} cita`}
          message={`¿Estás seguro de ${confirmAction.label.toLowerCase()} la cita de ${paciente?.nombre ?? 'este paciente'}?`}
          confirmLabel={`Sí, ${confirmAction.label.toLowerCase()}`}
          cancelLabel="Volver"
          danger
          onConfirm={() => {
            onStatusChange(appointment.id, confirmAction.status)
            setConfirmAction(null)
          }}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  )
}

export default function AgendaPage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [view, setView] = useState<ViewMode>('dia')
  const [showNewModal, setShowNewModal] = useState(false)

  const weekDates = getWeekDates(selectedDate)
  const dateStr = formatDate(selectedDate)
  const weekStart = formatDate(weekDates[0])
  const weekEnd = formatDate(weekDates[6])

  const dayQuery = useAppointments(dateStr)
  const weekQuery = useAppointmentsByRange(weekStart, weekEnd)
  const { data: schedule } = useWeeklySchedule()
  const statusMutation = useUpdateAppointmentStatus()

  const appointments = view === 'dia' ? dayQuery.data : weekQuery.data
  const isLoading = view === 'dia' ? dayQuery.isLoading : weekQuery.isLoading

  function navigate(direction: number) {
    const newDate = new Date(selectedDate)
    if (view === 'dia') {
      newDate.setDate(newDate.getDate() + direction)
    } else {
      newDate.setDate(newDate.getDate() + direction * 7)
    }
    setSelectedDate(newDate)
  }

  function goToToday() {
    setSelectedDate(new Date())
  }

  function handleStatusChange(id: string, status: AppointmentStatus) {
    statusMutation.mutate(
      { id, estado: status },
      {
        onSuccess: () => toast.success(`Cita marcada como ${STATUS_CONFIG[status].label.toLowerCase()}`),
        onError: () => toast.error('Error al actualizar cita'),
      },
    )
  }

  function isDayActive(date: Date): boolean {
    if (!schedule) return true
    const daySchedule = schedule.find((s) => s.dia_semana === date.getDay())
    return daySchedule?.activo ?? false
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Agenda
          </h1>
          <p className="text-sm mt-1 capitalize" style={{ color: 'var(--text-secondary)' }}>
            {view === 'dia'
              ? formatDateDisplay(selectedDate)
              : `Semana del ${weekDates[0].toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })} al ${weekDates[6].toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })}`}
          </p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors"
          style={{
            backgroundColor: 'var(--btn-primary-bg)',
            color: 'var(--btn-primary-text)',
            borderRadius: '6px',
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = 'var(--btn-primary-hover)')
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = 'var(--btn-primary-bg)')
          }
        >
          <Plus size={16} />
          Nueva cita
        </button>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-md transition-colors"
            style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: '6px' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            aria-label="Anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-2 text-sm font-medium transition-colors"
            style={{
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            Hoy
          </button>
          <button
            onClick={() => navigate(1)}
            className="p-2 rounded-md transition-colors"
            style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: '6px' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            aria-label="Siguiente"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div
          className="hidden sm:flex rounded-md overflow-hidden"
          style={{ border: '1px solid var(--border)' }}
        >
          <button
            onClick={() => setView('dia')}
            className="px-4 py-2 text-sm font-medium transition-colors"
            style={{
              backgroundColor: view === 'dia' ? 'var(--btn-primary-bg)' : 'transparent',
              color: view === 'dia' ? 'var(--btn-primary-text)' : 'var(--text-secondary)',
            }}
          >
            Día
          </button>
          <button
            onClick={() => setView('semana')}
            className="px-4 py-2 text-sm font-medium transition-colors"
            style={{
              backgroundColor: view === 'semana' ? 'var(--btn-primary-bg)' : 'transparent',
              color: view === 'semana' ? 'var(--btn-primary-text)' : 'var(--text-secondary)',
              borderLeft: '1px solid var(--border)',
            }}
          >
            Semana
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div
            className="w-6 h-6 border-2 rounded-full animate-spin"
            style={{ borderColor: 'var(--border)', borderTopColor: 'var(--btn-primary-bg)' }}
          />
        </div>
      ) : view === 'dia' ? (
        /* Day View */
        <div
          className="p-5"
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
          }}
        >
          {!isDayActive(selectedDate) ? (
            <div className="text-center py-8">
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Día no hábil
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                La óptica no atiende este día
              </p>
            </div>
          ) : appointments && appointments.length > 0 ? (
            <div className="space-y-3">
              {appointments.map((apt) => (
                <AppointmentCard
                  key={apt.id}
                  appointment={apt}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Sin citas para este día
              </p>
              <button
                onClick={() => setShowNewModal(true)}
                className="inline-flex items-center gap-2 mt-3 text-sm font-medium"
                style={{ color: 'var(--btn-primary-bg)' }}
              >
                <Plus size={14} />
                Agendar cita
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Week View */
        <div className="overflow-x-auto">
        <div
          className="grid grid-cols-7 gap-px min-w-[700px]"
          style={{
            backgroundColor: 'var(--border)',
            borderRadius: '8px',
            overflow: 'hidden',
            border: '1px solid var(--border)',
          }}
        >
          {weekDates.map((date, i) => {
            const dateKey = formatDate(date)
            const dayAppointments = appointments?.filter((a) => a.fecha === dateKey) ?? []
            const isToday = formatDate(new Date()) === dateKey
            const isSelected = dateStr === dateKey
            const active = isDayActive(date)

            return (
              <div
                key={dateKey}
                className="min-h-[180px] flex flex-col"
                style={{
                  backgroundColor: active ? 'var(--bg-surface)' : 'var(--bg-muted)',
                }}
              >
                {/* Day header */}
                <div
                  className="px-3 py-2 text-center"
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {DAY_NAMES[i]}
                  </p>
                  <button
                    onClick={() => {
                      setSelectedDate(date)
                      setView('dia')
                    }}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium mx-auto mt-0.5 transition-colors"
                    style={{
                      backgroundColor: isToday
                        ? 'var(--btn-primary-bg)'
                        : isSelected
                          ? 'var(--badge-primary-bg)'
                          : 'transparent',
                      color: isToday
                        ? 'var(--btn-primary-text)'
                        : isSelected
                          ? 'var(--badge-primary-text)'
                          : 'var(--text-primary)',
                    }}
                  >
                    {date.getDate()}
                  </button>
                </div>

                {/* Appointments */}
                <div className="flex-1 p-1.5 space-y-1">
                  {dayAppointments.map((apt) => (
                    <button
                      key={apt.id}
                      onClick={() => {
                        setSelectedDate(date)
                        setView('dia')
                      }}
                      className="w-full text-left p-1.5 rounded text-xs transition-colors"
                      style={{
                        backgroundColor: `var(${STATUS_CONFIG[apt.estado].bgVar})`,
                        color: `var(${STATUS_CONFIG[apt.estado].textVar})`,
                        borderRadius: '4px',
                      }}
                    >
                      <span className="font-medium">{apt.hora_inicio.slice(0, 5)}</span>{' '}
                      {apt.paciente?.nombre?.split(' ')[0] ?? 'Paciente'}
                    </button>
                  ))}
                  {!active && (
                    <p className="text-center text-xs py-2" style={{ color: 'var(--text-muted)' }}>
                      Cerrado
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        </div>
      )}

      {/* New Appointment Modal */}
      {showNewModal && (
        <NewAppointmentModal
          defaultDate={dateStr}
          onClose={() => setShowNewModal(false)}
        />
      )}
    </div>
  )
}
