import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { ClipboardList, Plus, Bell, Check, X, Search, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'
import { useWaitlist, useAddToWaitlist, useUpdateWaitlistStatus, useDeleteWaitlistEntry } from '../../hooks/useWaitlist'
import { usePatients } from '../../hooks/usePatients'
import { useAppointmentTypes } from '../../hooks/useAppointments'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { WAITLIST_STATUS_CONFIG } from '../../types/waitlist'
import type { WaitlistStatus } from '../../types/waitlist'

export default function WaitlistPage() {
  const [statusFilter, setStatusFilter] = useState<WaitlistStatus | ''>('ESPERANDO')
  const { data: entries, isLoading, error } = useWaitlist(statusFilter || undefined)
  const updateStatus = useUpdateWaitlistStatus()
  const deleteEntry = useDeleteWaitlistEntry()
  const [showAddForm, setShowAddForm] = useState(false)
  const [removeId, setRemoveId] = useState<string | null>(null)

  const formatDate = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('es-CL')
  const formatDateTime = (d: string) => new Date(d).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  const timeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days === 0) return 'Hoy'
    if (days === 1) return 'Ayer'
    return `Hace ${days} días`
  }

  const handleNotify = async (id: string) => {
    try {
      await updateStatus.mutateAsync({ id, estado: 'NOTIFICADO' })
      toast.success('Paciente marcado como notificado')
    } catch {
      toast.error('Error al actualizar')
    }
  }

  const handleConfirm = async (id: string) => {
    try {
      await updateStatus.mutateAsync({ id, estado: 'CONFIRMADO' })
      toast.success('Paciente confirmado')
    } catch {
      toast.error('Error al confirmar')
    }
  }

  const handleRemove = async () => {
    if (!removeId) return
    try {
      await deleteEntry.mutateAsync(removeId)
      toast.success('Paciente removido de la lista')
      setRemoveId(null)
    } catch {
      toast.error('Error al remover')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>Lista de espera</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {entries?.length ?? 0} pacientes en lista
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium self-start sm:self-auto"
          style={{ backgroundColor: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', borderRadius: '6px' }}
        >
          <Plus size={18} />
          Agregar a lista
        </button>
      </div>

      {/* Filter */}
      <div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as WaitlistStatus | '')}
          className="text-sm py-2.5 px-3"
          style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '6px', color: 'var(--text-primary)' }}
        >
          <option value="">Todos los estados</option>
          {(Object.keys(WAITLIST_STATUS_CONFIG) as WaitlistStatus[]).map((s) => (
            <option key={s} value={s}>{WAITLIST_STATUS_CONFIG[s].label}</option>
          ))}
        </select>
      </div>

      {/* List */}
      <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--btn-primary-bg)' }} />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-sm" style={{ color: 'var(--status-danger)' }}>Error al cargar la lista</div>
        ) : entries && entries.length > 0 ? (
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {entries.map((entry) => {
              const sc = WAITLIST_STATUS_CONFIG[entry.estado]
              const isActive = entry.estado === 'ESPERANDO' || entry.estado === 'NOTIFICADO'
              return (
                <div
                  key={entry.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3"
                  style={{ borderBottom: '1px solid var(--border)', opacity: isActive ? 1 : 0.6 }}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {entry.paciente?.nombre ?? '—'}
                      </p>
                      <span
                        className="inline-flex items-center px-2 py-0.5 text-xs font-medium"
                        style={{ backgroundColor: `var(${sc.bgVar})`, color: `var(${sc.textVar})`, borderRadius: '9999px' }}
                      >
                        {sc.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <span>{entry.paciente?.email}</span>
                      {entry.paciente?.telefono && <span>{entry.paciente.telefono}</span>}
                      <span>Tipo: {entry.tipo_cita?.nombre ?? '—'}</span>
                      {entry.fecha_preferida && <span>Prefiere: {formatDate(entry.fecha_preferida)}</span>}
                      <span>En lista: {timeAgo(entry.created_at)}</span>
                      {entry.notificado_at && <span>Notificado: {formatDateTime(entry.notificado_at)}</span>}
                    </div>
                  </div>

                  {isActive && (
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      {entry.estado === 'ESPERANDO' && (
                        <button
                          onClick={() => handleNotify(entry.id)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium"
                          style={{ backgroundColor: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', borderRadius: '6px' }}
                          title="Marcar como notificado"
                        >
                          <Bell size={12} />
                          Notificar
                        </button>
                      )}
                      {entry.estado === 'NOTIFICADO' && (
                        <button
                          onClick={() => handleConfirm(entry.id)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium"
                          style={{ backgroundColor: 'var(--status-success)', color: '#fff', borderRadius: '6px' }}
                          title="Confirmar asistencia"
                        >
                          <Check size={12} />
                          Confirmar
                        </button>
                      )}
                      <button
                        onClick={() => setRemoveId(entry.id)}
                        className="p-1.5 rounded-md"
                        style={{ color: 'var(--status-danger)', border: '1px solid var(--status-danger)', borderRadius: '6px' }}
                        title="Remover de lista"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <ClipboardList size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              No hay pacientes en lista de espera
            </p>
          </div>
        )}
      </div>

      {/* Add form modal */}
      {showAddForm && (
        <AddToWaitlistModal onClose={() => setShowAddForm(false)} />
      )}

      {removeId && (
        <ConfirmModal
          title="Remover de lista de espera"
          message="¿Estás seguro de remover a este paciente de la lista de espera?"
          confirmLabel="Sí, remover"
          danger
          onConfirm={handleRemove}
          onCancel={() => setRemoveId(null)}
        />
      )}
    </div>
  )
}

// ── Add to Waitlist Modal ───────────────────────────────

function AddToWaitlistModal({ onClose }: { onClose: () => void }) {
  const [search, setSearch] = useState('')
  const [pacienteId, setPacienteId] = useState('')
  const [pacienteNombre, setPacienteNombre] = useState('')
  const [tipoCitaId, setTipoCitaId] = useState('')
  const [fechaPreferida, setFechaPreferida] = useState('')

  const { data: patients } = usePatients(search)
  const { data: appointmentTypes } = useAppointmentTypes()
  const addToWaitlist = useAddToWaitlist()

  const handleSelectPatient = (p: { id: string; nombre: string }) => {
    setPacienteId(p.id)
    setPacienteNombre(p.nombre)
    setSearch('')
  }

  const handleSubmit = async () => {
    if (!pacienteId) { toast.error('Selecciona un paciente'); return }
    if (!tipoCitaId) { toast.error('Selecciona un tipo de cita'); return }

    try {
      await addToWaitlist.mutateAsync({
        paciente_id: pacienteId,
        tipo_cita_id: tipoCitaId,
        fecha_preferida: fechaPreferida || null,
      })
      toast.success('Paciente agregado a la lista de espera')
      onClose()
    } catch {
      toast.error('Error al agregar')
    }
  }

  const inputStyle = {
    backgroundColor: 'var(--input-bg)',
    border: '1px solid var(--input-border)',
    borderRadius: '6px',
    color: 'var(--text-primary)',
  }

  return createPortal(
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="w-full max-w-md max-h-[90vh] overflow-y-auto pointer-events-auto"
          style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '8px', boxShadow: 'var(--shadow-lg)' }}
        >
          <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <UserPlus size={18} />
              Agregar a lista de espera
            </h2>
            <button onClick={onClose} style={{ color: 'var(--text-secondary)' }} aria-label="Cerrar">
              <X size={20} />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Patient search */}
            <div>
              <label className="block text-sm mb-1 font-medium" style={{ color: 'var(--text-secondary)' }}>Paciente *</label>
              {pacienteId ? (
                <div className="flex items-center justify-between p-2.5" style={{ ...inputStyle, backgroundColor: 'var(--badge-primary-bg)' }}>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{pacienteNombre}</span>
                  <button onClick={() => { setPacienteId(''); setPacienteNombre('') }} style={{ color: 'var(--text-secondary)' }}>
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-3" style={inputStyle}>
                    <Search size={14} style={{ color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      placeholder="Buscar paciente..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="flex-1 text-sm py-2 outline-none bg-transparent"
                      style={{ color: 'var(--text-primary)' }}
                      autoFocus
                    />
                  </div>
                  {search.trim() && patients && (
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {patients.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => handleSelectPatient(p)}
                          className="w-full text-left p-2 text-sm cursor-pointer"
                          style={{ borderRadius: '4px' }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <span style={{ color: 'var(--text-primary)' }}>{p.nombre}</span>
                          <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>{p.email}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Appointment type */}
            <div>
              <label className="block text-sm mb-1 font-medium" style={{ color: 'var(--text-secondary)' }}>Tipo de cita *</label>
              <select
                value={tipoCitaId}
                onChange={(e) => setTipoCitaId(e.target.value)}
                className="w-full text-sm py-2.5 px-3"
                style={inputStyle}
              >
                <option value="">Seleccionar...</option>
                {appointmentTypes?.map((t) => (
                  <option key={t.id} value={t.id}>{t.nombre}</option>
                ))}
              </select>
            </div>

            {/* Preferred date */}
            <div>
              <label className="block text-sm mb-1 font-medium" style={{ color: 'var(--text-secondary)' }}>Fecha preferida (opcional)</label>
              <input
                type="date"
                value={fechaPreferida}
                onChange={(e) => setFechaPreferida(e.target.value)}
                className="w-full text-sm py-2.5 px-3 outline-none"
                style={inputStyle}
              />
            </div>
          </div>

          <div className="p-4 flex justify-end gap-3" style={{ borderTop: '1px solid var(--border)' }}>
            <button onClick={onClose} className="px-4 py-2 text-sm" style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: '6px' }}>
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={addToWaitlist.isPending || !pacienteId || !tipoCitaId}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium"
              style={{
                backgroundColor: 'var(--btn-primary-bg)',
                color: 'var(--btn-primary-text)',
                borderRadius: '6px',
                opacity: addToWaitlist.isPending || !pacienteId || !tipoCitaId ? 0.6 : 1,
              }}
            >
              {addToWaitlist.isPending ? 'Agregando...' : 'Agregar'}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  )
}
