import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Calendar, Clock, User, Check, X, Edit3, Loader2, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  useGetAppointment,
  useConfirmAppointment,
  useCancelPublicAppointment,
  useAvailability,
} from '../../hooks/usePublicBooking'

const CANCEL_REASONS = [
  { value: 'CAMBIO_PLANES', label: 'Cambio de planes' },
  { value: 'ME_QUEDA_LEJOS', label: 'Me queda lejos' },
  { value: 'PRECIO', label: 'Precio' },
  { value: 'OTRO', label: 'Otro motivo' },
]

const STATUS_DISPLAY: Record<string, { label: string; bgVar: string; textVar: string }> = {
  PRE_RESERVA: { label: 'Pendiente verificación', bgVar: '--badge-warning-bg', textVar: '--badge-warning-text' },
  PENDIENTE: { label: 'Pendiente', bgVar: '--badge-warning-bg', textVar: '--badge-warning-text' },
  CONFIRMADA: { label: 'Confirmada', bgVar: '--badge-success-bg', textVar: '--badge-success-text' },
  COMPLETADA: { label: 'Completada', bgVar: '--badge-success-bg', textVar: '--badge-success-text' },
  CANCELADA: { label: 'Cancelada', bgVar: '--badge-danger-bg', textVar: '--badge-danger-text' },
  NO_ASISTIO: { label: 'No asistió', bgVar: '--badge-danger-bg', textVar: '--badge-danger-text' },
}

export default function AppointmentPage() {
  const { token } = useParams<{ token: string }>()
  const { data: cita, isLoading, error, refetch } = useGetAppointment(token)
  const confirmMutation = useConfirmAppointment()
  const cancelMutation = useCancelPublicAppointment()

  const [showCancel, setShowCancel] = useState(false)
  const [cancelMotivo, setCancelMotivo] = useState('CAMBIO_PLANES')
  const [cancelTexto, setCancelTexto] = useState('')
  const [showEdit, setShowEdit] = useState(false)
  const [editFecha, setEditFecha] = useState('')
  const [editHora, setEditHora] = useState('')

  const formatDate = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin" size={28} style={{ color: 'var(--text-muted)' }} />
      </div>
    )
  }

  if (error || !cita) {
    return (
      <div className="text-center py-20 px-4">
        <AlertTriangle size={40} className="mx-auto mb-3" style={{ color: 'var(--status-danger)' }} />
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Cita no encontrada</h2>
        <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
          El enlace puede ser incorrecto o haber expirado.
        </p>
        <Link
          to="/reservar"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium mt-4"
          style={{ backgroundColor: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', borderRadius: '6px' }}
        >
          Reservar nueva cita
        </Link>
      </div>
    )
  }

  const statusInfo = STATUS_DISPLAY[cita.estado] ?? STATUS_DISPLAY.PENDIENTE
  const canConfirm = cita.estado === 'PENDIENTE'
  const canEdit = ['PENDIENTE', 'CONFIRMADA'].includes(cita.estado)
  const canCancel = ['PENDIENTE', 'CONFIRMADA'].includes(cita.estado)
  const isCancelled = cita.estado === 'CANCELADA'

  const handleConfirm = async () => {
    try {
      await confirmMutation.mutateAsync(token!)
      toast.success('Cita confirmada')
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al confirmar')
    }
  }

  const handleCancel = async () => {
    try {
      await cancelMutation.mutateAsync({
        token: token!,
        motivo: cancelMotivo,
        motivo_texto: cancelTexto || undefined,
      })
      toast.success('Cita cancelada')
      setShowCancel(false)
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al cancelar')
    }
  }

  return (
    <div className="px-4 sm:px-6 py-8 sm:py-12">
      <div className="max-w-lg mx-auto">
        <div
          className="p-6 space-y-6"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px' }}
        >
          {/* Status */}
          <div className="text-center">
            <span
              className="inline-flex items-center px-3 py-1 text-sm font-medium"
              style={{ backgroundColor: `var(${statusInfo.bgVar})`, color: `var(${statusInfo.textVar})`, borderRadius: '9999px' }}
            >
              {statusInfo.label}
            </span>
          </div>

          {/* Appointment info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Calendar size={18} style={{ color: 'var(--btn-primary-bg)' }} />
              <div>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Fecha</p>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  {formatDate(cita.fecha)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock size={18} style={{ color: 'var(--btn-primary-bg)' }} />
              <div>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Hora</p>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  {cita.hora_inicio.slice(0, 5)} - {cita.hora_fin.slice(0, 5)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User size={18} style={{ color: 'var(--btn-primary-bg)' }} />
              <div>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Tipo de cita</p>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  {(cita.tipo_cita as unknown as { nombre: string })?.nombre ?? 'Consulta'} · {cita.duracion_min} min
                </p>
              </div>
            </div>
          </div>

          {/* Cancelled info */}
          {isCancelled && (
            <div
              className="p-3 text-sm"
              style={{ backgroundColor: 'var(--badge-danger-bg)', color: 'var(--badge-danger-text)', borderRadius: '6px' }}
            >
              Cita cancelada
              {cita.motivo_cancelacion && <span> — {CANCEL_REASONS.find((r) => r.value === cita.motivo_cancelacion)?.label ?? cita.motivo_cancelacion}</span>}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {canConfirm && (
              <button
                onClick={handleConfirm}
                disabled={confirmMutation.isPending}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium"
                style={{ backgroundColor: 'var(--status-success)', color: '#fff', borderRadius: '6px', opacity: confirmMutation.isPending ? 0.6 : 1 }}
              >
                <Check size={16} />
                {confirmMutation.isPending ? 'Confirmando...' : 'Confirmar asistencia'}
              </button>
            )}

            {canEdit && !showEdit && (
              <button
                onClick={() => { setShowEdit(true); setEditFecha(cita.fecha); setEditHora('') }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium"
                style={{ color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: '6px' }}
              >
                <Edit3 size={16} />
                Cambiar fecha/hora
              </button>
            )}

            {canCancel && !showCancel && (
              <button
                onClick={() => setShowCancel(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium"
                style={{ color: 'var(--status-danger)', border: '1px solid var(--status-danger)', borderRadius: '6px' }}
              >
                <X size={16} />
                Cancelar cita
              </button>
            )}

            {isCancelled && (
              <Link
                to="/reservar"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium"
                style={{ backgroundColor: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', borderRadius: '6px' }}
              >
                <Calendar size={16} />
                Reservar nueva cita
              </Link>
            )}
          </div>

          {/* Edit form */}
          {showEdit && (
            <EditDateForm
              token={token!}
              tipoCitaId={(cita.tipo_cita as unknown as { id: string })?.id ?? ''}
              currentFecha={cita.fecha}
              editFecha={editFecha}
              editHora={editHora}
              setEditFecha={setEditFecha}
              setEditHora={setEditHora}
              onClose={() => setShowEdit(false)}
              onSuccess={() => { setShowEdit(false); refetch() }}
            />
          )}

          {/* Cancel form */}
          {showCancel && (
            <div className="space-y-3 p-4" style={{ border: '1px solid var(--status-danger)', borderRadius: '8px' }}>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--status-danger)' }}>Cancelar cita</h3>
              <select
                value={cancelMotivo}
                onChange={(e) => setCancelMotivo(e.target.value)}
                className="w-full text-sm py-2 px-3"
                style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '6px', color: 'var(--text-primary)' }}
              >
                {CANCEL_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              {cancelMotivo === 'OTRO' && (
                <input
                  type="text"
                  value={cancelTexto}
                  onChange={(e) => setCancelTexto(e.target.value)}
                  placeholder="Motivo..."
                  className="w-full text-sm py-2 px-3 outline-none"
                  style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '6px', color: 'var(--text-primary)' }}
                />
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCancel(false)}
                  className="flex-1 py-2 text-sm"
                  style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: '6px' }}
                >
                  Volver
                </button>
                <button
                  onClick={handleCancel}
                  disabled={cancelMutation.isPending}
                  className="flex-1 py-2 text-sm font-medium"
                  style={{ backgroundColor: 'var(--status-danger)', color: '#fff', borderRadius: '6px', opacity: cancelMutation.isPending ? 0.6 : 1 }}
                >
                  {cancelMutation.isPending ? 'Cancelando...' : 'Confirmar cancelación'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Edit Date Form ──────────────────────────────────────

function EditDateForm({
  token, tipoCitaId, currentFecha, editFecha, editHora, setEditFecha, setEditHora, onClose, onSuccess,
}: {
  token: string
  tipoCitaId: string
  currentFecha: string
  editFecha: string
  editHora: string
  setEditFecha: (v: string) => void
  setEditHora: (v: string) => void
  onClose: () => void
  onSuccess: () => void
}) {
  const { data: availability, isLoading } = useAvailability(editFecha, tipoCitaId)
  const today = new Date().toISOString().split('T')[0]

  const handleSave = async () => {
    if (!editHora) { toast.error('Selecciona una hora'); return }
    try {
      const FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1'
      const res = await fetch(`${FUNCTIONS_URL}/manage-appointment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ token, fecha: editFecha, hora_inicio: editHora }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Fecha actualizada')
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al actualizar')
    }
  }

  return (
    <div className="space-y-3 p-4" style={{ border: '1px solid var(--border)', borderRadius: '8px' }}>
      <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Cambiar fecha y hora</h3>
      <input
        type="date"
        min={today}
        value={editFecha}
        onChange={(e) => { setEditFecha(e.target.value); setEditHora('') }}
        className="w-full text-sm py-2 px-3 outline-none"
        style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '6px', color: 'var(--text-primary)' }}
      />
      {editFecha && (
        isLoading ? (
          <div className="flex justify-center py-3">
            <Loader2 className="animate-spin" size={16} style={{ color: 'var(--text-muted)' }} />
          </div>
        ) : availability?.slots && availability.slots.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {availability.slots.map((slot) => (
              <button
                key={slot.hora_inicio}
                onClick={() => setEditHora(slot.hora_inicio)}
                className="py-1.5 text-xs font-medium text-center"
                style={{
                  border: `2px solid ${editHora === slot.hora_inicio ? 'var(--btn-primary-bg)' : 'var(--border)'}`,
                  backgroundColor: editHora === slot.hora_inicio ? 'var(--btn-primary-bg)' : 'transparent',
                  color: editHora === slot.hora_inicio ? 'var(--btn-primary-text)' : 'var(--text-primary)',
                  borderRadius: '6px',
                }}
              >
                {slot.hora_inicio}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-center py-2" style={{ color: 'var(--text-muted)' }}>Sin horarios disponibles</p>
        )
      )}
      <div className="flex gap-2">
        <button onClick={onClose} className="flex-1 py-2 text-sm" style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: '6px' }}>
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={!editHora}
          className="flex-1 py-2 text-sm font-medium"
          style={{ backgroundColor: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', borderRadius: '6px', opacity: editHora ? 1 : 0.5 }}
        >
          Guardar cambio
        </button>
      </div>
    </div>
  )
}
