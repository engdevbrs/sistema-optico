import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Plus, Eye, User, Calendar } from 'lucide-react'
import { usePrescriptions } from '../../hooks/usePrescriptions'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import type { Prescription } from '../../types/prescription'

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-').map(Number)
    return new Date(year, month - 1, day).toLocaleDateString('es-CL')
  }
  return new Date(dateStr).toLocaleDateString('es-CL')
}

function formatValue(val: number | null, suffix = ''): string {
  if (val === null || val === undefined) return '—'
  const sign = val > 0 ? '+' : ''
  return `${sign}${val}${suffix}`
}

function PrescriptionRow({ prescription }: { prescription: Prescription }) {
  return (
    <tr
      className="transition-colors"
      style={{ borderBottom: '1px solid var(--border)' }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--table-row-hover)')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <User size={14} style={{ color: 'var(--text-muted)' }} />
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {prescription.paciente?.nombre ?? 'Paciente'}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {prescription.paciente?.email}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
          <span>ESF: {formatValue(prescription.od_esfera)}</span>
          <span className="ml-2">CIL: {formatValue(prescription.od_cilindro)}</span>
          <span className="ml-2">EJE: {formatValue(prescription.od_eje, '°')}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
          <span>ESF: {formatValue(prescription.oi_esfera)}</span>
          <span className="ml-2">CIL: {formatValue(prescription.oi_cilindro)}</span>
          <span className="ml-2">EJE: {formatValue(prescription.oi_eje, '°')}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="flex items-center gap-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <Calendar size={12} />
          {formatDate(prescription.created_at)}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <Link
          to={`/admin/recetas/${prescription.id}`}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition-colors"
          style={{
            color: 'var(--btn-primary-bg)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <Eye size={12} />
          Ver
        </Link>
      </td>
    </tr>
  )
}

export default function PrescriptionsPage() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const { data: prescriptions, isLoading, error } = usePrescriptions(debouncedSearch)

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Recetas ópticas
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {prescriptions?.length ?? 0} recetas registradas
          </p>
        </div>
        <Link
          to="/admin/recetas/nueva"
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors self-start sm:self-auto"
          style={{
            backgroundColor: 'var(--btn-primary-bg)',
            color: 'var(--btn-primary-text)',
            borderRadius: '6px',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--btn-primary-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--btn-primary-bg)')}
        >
          <Plus size={16} />
          Nueva receta
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: 'var(--text-muted)' }}
        />
        <input
          type="text"
          placeholder="Buscar por nombre o email del paciente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm outline-none transition-colors"
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

      {/* Table */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div
              className="w-6 h-6 border-2 rounded-full animate-spin"
              style={{ borderColor: 'var(--border)', borderTopColor: 'var(--btn-primary-bg)' }}
            />
          </div>
        ) : error ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm" style={{ color: 'var(--status-danger)' }}>
              Error al cargar recetas
            </p>
          </div>
        ) : prescriptions && prescriptions.length > 0 ? (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr style={{ backgroundColor: 'var(--table-header-bg)' }}>
                {['Paciente', 'Ojo derecho (OD)', 'Ojo izquierdo (OI)', 'Fecha', ''].map(
                  (header) => (
                    <th
                      key={header}
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                      style={{
                        color: 'var(--text-secondary)',
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      {header}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {prescriptions.map((rx) => (
                <PrescriptionRow key={rx.id} prescription={rx} />
              ))}
            </tbody>
          </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {search ? 'No se encontraron recetas' : 'No hay recetas registradas'}
            </p>
            {!search && (
              <Link
                to="/admin/recetas/nueva"
                className="inline-flex items-center gap-2 mt-3 text-sm font-medium"
                style={{ color: 'var(--btn-primary-bg)' }}
              >
                <Plus size={14} />
                Crear primera receta
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
