import { useState, useEffect } from 'react'
import { Save } from 'lucide-react'
import { useSchedule, useUpdateSchedule } from '../../hooks/useConfig'
import toast from 'react-hot-toast'

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

interface ScheduleRow {
  id: string
  dia_semana: number
  activo: boolean
  hora_inicio: string
  hora_fin: string
}

export function ScheduleTab() {
  const { data: schedule, isLoading } = useSchedule()
  const updateMutation = useUpdateSchedule()
  const [rows, setRows] = useState<ScheduleRow[]>([])

  useEffect(() => {
    if (schedule && rows.length === 0) {
      setRows(
        schedule.map((s) => ({
          id: s.id,
          dia_semana: s.dia_semana,
          activo: s.activo,
          hora_inicio: s.hora_inicio.slice(0, 5),
          hora_fin: s.hora_fin.slice(0, 5),
        })),
      )
    }
  }, [schedule, rows.length])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--btn-primary-bg)' }} />
      </div>
    )
  }

  function handleChange(index: number, field: keyof ScheduleRow, value: string | boolean) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)))
  }

  async function handleSave() {
    try {
      await updateMutation.mutateAsync(rows)
      toast.success('Horarios guardados')
    } catch {
      toast.error('Error al guardar horarios')
    }
  }

  return (
    <div className="max-w-2xl">
      <div
        className="p-5"
        style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px' }}
      >
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Horario de atención semanal
        </h3>

        <div className="space-y-3">
          {rows.map((row, index) => (
            <div
              key={row.id}
              className="flex items-center gap-4 py-2 px-3 rounded-md"
              style={{
                backgroundColor: row.activo ? 'transparent' : 'var(--bg-muted)',
                borderRadius: '6px',
              }}
            >
              {/* Toggle */}
              <label className="flex items-center gap-3 w-32 flex-shrink-0">
                <input
                  type="checkbox"
                  checked={row.activo}
                  onChange={(e) => handleChange(index, 'activo', e.target.checked)}
                  className="w-4 h-4"
                  style={{ accentColor: 'var(--btn-primary-bg)' }}
                />
                <span
                  className="text-sm font-medium"
                  style={{ color: row.activo ? 'var(--text-primary)' : 'var(--text-muted)' }}
                >
                  {DAY_NAMES[row.dia_semana]}
                </span>
              </label>

              {/* Horarios */}
              {row.activo ? (
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={row.hora_inicio}
                    onChange={(e) => handleChange(index, 'hora_inicio', e.target.value)}
                    className="px-2 py-1.5 text-sm outline-none"
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      border: '1px solid var(--input-border)',
                      borderRadius: '6px',
                      color: 'var(--input-text)',
                    }}
                  />
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>a</span>
                  <input
                    type="time"
                    value={row.hora_fin}
                    onChange={(e) => handleChange(index, 'hora_fin', e.target.value)}
                    className="px-2 py-1.5 text-sm outline-none"
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      border: '1px solid var(--input-border)',
                      borderRadius: '6px',
                      color: 'var(--input-text)',
                    }}
                  />
                </div>
              ) : (
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Cerrado</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end mt-5">
        <button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
          style={{ backgroundColor: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', borderRadius: '6px' }}
          onMouseEnter={(e) => !updateMutation.isPending && (e.currentTarget.style.backgroundColor = 'var(--btn-primary-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--btn-primary-bg)')}
        >
          <Save size={16} />
          {updateMutation.isPending ? 'Guardando...' : 'Guardar horarios'}
        </button>
      </div>
    </div>
  )
}
