import { useState } from 'react'
import { MessageSquare, Star, ThumbsUp, Trash2, Eye, EyeOff, BarChart3 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useSurveys, useToggleApproval, useDeleteSurvey, useSurveyStats } from '../../hooks/useSurveys'
import { ConfirmModal } from '../../components/ui/ConfirmModal'

type Filter = 'all' | 'answered' | 'pending' | 'approved'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'answered', label: 'Respondidas' },
  { id: 'pending', label: 'Pendientes' },
  { id: 'approved', label: 'Aprobadas' },
]

export default function SurveysPage() {
  const [filter, setFilter] = useState<Filter>('all')
  const { data: surveys, isLoading } = useSurveys(filter)
  const { data: stats } = useSurveyStats()
  const toggleApproval = useToggleApproval()
  const deleteSurvey = useDeleteSurvey()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleToggleApproval = async (id: string, current: boolean) => {
    try {
      await toggleApproval.mutateAsync({ id, approved: !current })
      toast.success(!current ? 'Aprobada para página pública' : 'Removida de página pública')
    } catch {
      toast.error('Error al actualizar')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteSurvey.mutateAsync(deleteId)
      toast.success('Encuesta eliminada')
      setDeleteId(null)
    } catch {
      toast.error('Error al eliminar')
    }
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('es-CL')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>Encuestas</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Respuestas de pacientes post-cita
        </p>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            label="Calificación promedio"
            value={stats.promedioCalificacion > 0 ? stats.promedioCalificacion.toFixed(1) : '—'}
            icon={<Star size={18} />}
            accent={stats.promedioCalificacion >= 4 ? 'var(--status-success)' : stats.promedioCalificacion >= 3 ? 'var(--badge-warning-text)' : 'var(--status-danger)'}
          />
          <StatCard label="Enviadas" value={String(stats.total)} icon={<MessageSquare size={18} />} />
          <StatCard label="Respondidas" value={String(stats.respondidas)} icon={<BarChart3 size={18} />} />
          <StatCard label="Tasa respuesta" value={`${stats.tasaRespuesta}%`} icon={<BarChart3 size={18} />} />
          <StatCard label="Aprobadas" value={String(stats.aprobadas)} icon={<ThumbsUp size={18} />} accent="var(--status-success)" />
        </div>
      )}

      {/* Rating distribution */}
      {stats && stats.respondidas > 0 && (
        <div
          className="p-4"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px' }}
        >
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Distribución de calificaciones</h3>
          <div className="flex items-end gap-2 justify-center">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = stats.distribucion[rating] ?? 0
              const maxCount = Math.max(...Object.values(stats.distribucion), 1)
              const height = Math.max(4, (count / maxCount) * 80)
              return (
                <div key={rating} className="flex flex-col items-center gap-1">
                  <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{count}</span>
                  <div
                    className="w-10 rounded-t"
                    style={{
                      height: `${height}px`,
                      backgroundColor: rating >= 4 ? 'var(--status-success)' : rating === 3 ? 'var(--badge-warning-text)' : 'var(--status-danger)',
                      opacity: count === 0 ? 0.2 : 1,
                    }}
                  />
                  <div className="flex items-center gap-0.5">
                    <Star size={12} style={{ color: 'var(--badge-warning-text)', fill: 'var(--badge-warning-text)' }} />
                    <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{rating}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-1">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className="px-3 py-1.5 text-sm font-medium"
            style={{
              backgroundColor: filter === f.id ? 'var(--btn-primary-bg)' : 'var(--bg-surface)',
              color: filter === f.id ? 'var(--btn-primary-text)' : 'var(--text-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Surveys list */}
      <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--btn-primary-bg)' }} />
          </div>
        ) : surveys && surveys.length > 0 ? (
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {surveys.map((survey) => (
              <div
                key={survey.id}
                className="p-4"
                style={{ borderBottom: '1px solid var(--border)', opacity: survey.respondida ? 1 : 0.5 }}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {survey.paciente?.nombre ?? '—'}
                      </p>
                      {survey.respondida && survey.calificacion != null && (
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={14}
                              style={{
                                color: star <= survey.calificacion! ? 'var(--badge-warning-text)' : 'var(--border)',
                                fill: star <= survey.calificacion! ? 'var(--badge-warning-text)' : 'transparent',
                              }}
                            />
                          ))}
                        </div>
                      )}
                      {survey.aprobada_para_publica && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium"
                          style={{ backgroundColor: 'var(--badge-success-bg)', color: 'var(--badge-success-text)', borderRadius: '9999px' }}
                        >
                          <Eye size={10} />
                          Pública
                        </span>
                      )}
                      {!survey.respondida && (
                        <span
                          className="inline-flex items-center px-2 py-0.5 text-xs font-medium"
                          style={{ backgroundColor: 'var(--badge-warning-bg)', color: 'var(--badge-warning-text)', borderRadius: '9999px' }}
                        >
                          Pendiente
                        </span>
                      )}
                    </div>

                    {/* Meta */}
                    <div className="flex gap-3 mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <span>{survey.paciente?.email}</span>
                      <span>Cita: {survey.cita ? formatDate(survey.cita.fecha) : '—'}</span>
                      {survey.cita?.tipo_cita && <span>{(survey.cita.tipo_cita as unknown as { nombre: string }).nombre}</span>}
                      <span>Enviada: {formatDate(survey.created_at)}</span>
                      {survey.respondida_at && <span>Respondida: {formatDate(survey.respondida_at)}</span>}
                    </div>

                    {/* Comment */}
                    {survey.comentario && (
                      <div
                        className="mt-2 p-3 text-sm italic"
                        style={{ backgroundColor: 'var(--bg-muted)', borderRadius: '6px', color: 'var(--text-primary)' }}
                      >
                        "{survey.comentario}"
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {survey.respondida && (
                    <div className="flex items-center gap-1 self-start sm:self-auto">
                      <button
                        onClick={() => handleToggleApproval(survey.id, survey.aprobada_para_publica)}
                        className="p-2 rounded-md"
                        style={{ color: survey.aprobada_para_publica ? 'var(--status-success)' : 'var(--text-secondary)' }}
                        title={survey.aprobada_para_publica ? 'Quitar de página pública' : 'Aprobar para página pública'}
                      >
                        {survey.aprobada_para_publica ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button
                        onClick={() => setDeleteId(survey.id)}
                        className="p-2 rounded-md"
                        style={{ color: 'var(--status-danger)' }}
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <MessageSquare size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No hay encuestas</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Las encuestas se envían automáticamente después de cada cita completada
            </p>
          </div>
        )}
      </div>

      {deleteId && (
        <ConfirmModal
          title="Eliminar encuesta"
          message="¿Estás seguro de eliminar esta encuesta? Esta acción no se puede deshacer."
          confirmLabel="Sí, eliminar"
          danger
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  )
}

// ── StatCard ────────────────────────────────────────────

function StatCard({ label, value, icon, accent }: { label: string; value: string; icon: React.ReactNode; accent?: string }) {
  return (
    <div
      className="p-4"
      style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px' }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</p>
          <p className="text-xl font-bold mt-1" style={{ color: accent ?? 'var(--text-primary)' }}>{value}</p>
        </div>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: 'var(--badge-primary-bg)', color: 'var(--badge-primary-text)' }}
        >
          {icon}
        </div>
      </div>
    </div>
  )
}
