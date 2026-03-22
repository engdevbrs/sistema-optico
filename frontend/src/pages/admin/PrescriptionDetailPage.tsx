import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Printer, User, Calendar, Eye } from 'lucide-react'
import { usePrescription, usePatientPrescriptions } from '../../hooks/usePrescriptions'
import { useConfig } from '../../hooks/useConfig'
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

interface EyeTableProps {
  label: string
  current: Prescription
  previous?: Prescription
  prefix: 'od' | 'oi'
}

function EyeTable({ label, current, previous, prefix }: EyeTableProps) {
  const fields = [
    { key: 'esfera', label: 'Esfera (SPH)' },
    { key: 'cilindro', label: 'Cilindro (CYL)' },
    { key: 'eje', label: 'Eje (AXIS)', suffix: '°' },
    { key: 'adicion', label: 'Adición (ADD)' },
    { key: 'agudeza_visual', label: 'Agudeza Visual', isText: true },
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
      <div className="flex items-center gap-2 mb-3">
        <Eye size={16} style={{ color: 'var(--text-secondary)' }} />
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {label}
        </h3>
      </div>
      <table className="w-full">
        <thead>
          <tr>
            <th className="text-left text-xs font-medium py-1.5 pr-4" style={{ color: 'var(--text-muted)' }}>
              Parámetro
            </th>
            <th className="text-right text-xs font-medium py-1.5 px-4" style={{ color: 'var(--text-muted)' }}>
              Actual
            </th>
            {previous && (
              <th className="text-right text-xs font-medium py-1.5 pl-4" style={{ color: 'var(--text-muted)' }}>
                Anterior
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {fields.map(({ key, label: fieldLabel, suffix, isText }) => {
            const currentKey = `${prefix}_${key}` as keyof Prescription
            const currentVal = current[currentKey]
            const previousVal = previous?.[currentKey]

            const changed = previous && currentVal !== previousVal

            return (
              <tr key={key} style={{ borderTop: '1px solid var(--border)' }}>
                <td className="text-sm py-2 pr-4" style={{ color: 'var(--text-secondary)' }}>
                  {fieldLabel}
                </td>
                <td
                  className="text-sm font-mono font-medium text-right py-2 px-4"
                  style={{ color: changed ? 'var(--status-info)' : 'var(--text-primary)' }}
                >
                  {isText
                    ? (currentVal as string) || '—'
                    : formatValue(currentVal as number | null, suffix)}
                </td>
                {previous && (
                  <td className="text-sm font-mono text-right py-2 pl-4" style={{ color: 'var(--text-muted)' }}>
                    {isText
                      ? (previousVal as string) || '—'
                      : formatValue(previousVal as number | null, suffix)}
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function PrescriptionDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: prescription, isLoading, error } = usePrescription(id)
  const { data: patientPrescriptions } = usePatientPrescriptions(prescription?.paciente_id)
  const { data: config } = useConfig()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div
          className="w-6 h-6 border-2 rounded-full animate-spin"
          style={{ borderColor: 'var(--border)', borderTopColor: 'var(--btn-primary-bg)' }}
        />
      </div>
    )
  }

  if (error || !prescription) {
    return (
      <div className="text-center py-12">
        <p className="text-sm" style={{ color: 'var(--status-danger)' }}>Receta no encontrada</p>
        <button
          onClick={() => navigate('/admin/recetas')}
          className="mt-3 text-sm font-medium"
          style={{ color: 'var(--btn-primary-bg)' }}
        >
          Volver a recetas
        </button>
      </div>
    )
  }

  // Encontrar receta anterior para comparativa
  const previousPrescription = patientPrescriptions?.find(
    (rx) => rx.id !== prescription.id && new Date(rx.created_at) < new Date(prescription.created_at),
  )

  function handlePrint() {
    window.print()
  }

  return (
    <div>
      {/* Print-only prescription layout */}
      <div className="print-only print-area" style={{ display: 'none' }}>
        <PrintablePrescription prescription={prescription} config={config} />
      </div>

      {/* Screen layout */}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 no-print">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/recetas')}
            className="p-2 rounded-md transition-colors shrink-0"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            aria-label="Volver"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              Receta óptica
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {formatDate(prescription.created_at)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <Link
            to={`/admin/recetas/nueva?reemplaza=${prescription.id}&paciente=${prescription.paciente_id}`}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium"
            style={{
              color: 'var(--btn-secondary-text)',
              border: '1px solid var(--btn-secondary-border)',
              borderRadius: '6px',
            }}
          >
            Crear receta de reemplazo
          </Link>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors"
            style={{
              backgroundColor: 'var(--btn-primary-bg)',
              color: 'var(--btn-primary-text)',
              borderRadius: '6px',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--btn-primary-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--btn-primary-bg)')}
          >
            <Printer size={16} />
            Imprimir
          </button>
        </div>
      </div>

      <div className="max-w-3xl space-y-5 screen-only">
        {/* Paciente */}
        <div
          className="flex items-center gap-3 p-4"
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
          }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: 'var(--badge-primary-bg)',
              color: 'var(--badge-primary-text)',
            }}
          >
            <User size={18} />
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {prescription.paciente?.nombre ?? 'Paciente'}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {prescription.paciente?.email}
            </p>
          </div>
          {previousPrescription && (
            <span
              className="ml-auto inline-flex px-2 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: 'var(--badge-primary-bg)',
                color: 'var(--badge-primary-text)',
                borderRadius: '9999px',
              }}
            >
              Comparando con receta del {formatDate(previousPrescription.created_at)}
            </span>
          )}
        </div>

        {/* Ojos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <EyeTable
            label="Ojo Derecho (OD)"
            current={prescription}
            previous={previousPrescription}
            prefix="od"
          />
          <EyeTable
            label="Ojo Izquierdo (OI)"
            current={prescription}
            previous={previousPrescription}
            prefix="oi"
          />
        </div>

        {/* Extras */}
        <div
          className="p-5"
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
          }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Distancia pupilar</p>
              <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--text-primary)' }}>
                {prescription.distancia_pupilar ? `${prescription.distancia_pupilar} mm` : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Próxima revisión</p>
              <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--text-primary)' }}>
                {formatDate(prescription.proxima_revision)}
              </p>
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Fecha de creación</p>
              <p className="flex items-center gap-1 text-sm font-medium mt-0.5" style={{ color: 'var(--text-primary)' }}>
                <Calendar size={12} />
                {formatDate(prescription.created_at)}
              </p>
            </div>
          </div>

          {prescription.observaciones && (
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
              <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Observaciones</p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {prescription.observaciones}
              </p>
            </div>
          )}

          {prescription.reemplaza_a && (
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
              <p className="text-xs" style={{ color: 'var(--status-warning)' }}>
                Esta receta reemplaza a una receta anterior
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Printable Prescription ──────────────────────────────

interface PrintableProps {
  prescription: Prescription
  config?: { nombre_optica: string; direccion: string | null; telefono: string | null; email: string | null } | null
}

function PrintablePrescription({ prescription, config }: PrintableProps) {
  const fv = (val: number | null, suffix = '') => {
    if (val === null || val === undefined) return '—'
    const sign = val > 0 ? '+' : ''
    return `${sign}${val}${suffix}`
  }

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', maxWidth: '700px', margin: '0 auto', padding: '20px 0' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px', borderBottom: '2px solid #000', paddingBottom: '16px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', margin: '0 0 4px 0' }}>
          {config?.nombre_optica ?? 'Óptica'}
        </h1>
        {config?.direccion && (
          <p style={{ fontSize: '11px', margin: '2px 0', color: '#555' }}>{config.direccion}</p>
        )}
        <div style={{ fontSize: '11px', color: '#555' }}>
          {config?.telefono && <span>{config.telefono}</span>}
          {config?.telefono && config?.email && <span> · </span>}
          {config?.email && <span>{config.email}</span>}
        </div>
      </div>

      {/* Title */}
      <h2 style={{ fontSize: '16px', fontWeight: '600', textAlign: 'center', margin: '0 0 20px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>
        Receta Óptica
      </h2>

      {/* Patient info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '12px' }}>
        <div>
          <strong>Paciente:</strong> {prescription.paciente?.nombre ?? '—'}
        </div>
        <div>
          <strong>Fecha:</strong> {formatDate(prescription.created_at)}
        </div>
      </div>

      {/* Prescription table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '12px' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ccc', padding: '8px', background: '#f5f5f5', textAlign: 'left' }}>Ojo</th>
            <th style={{ border: '1px solid #ccc', padding: '8px', background: '#f5f5f5', textAlign: 'center' }}>Esfera (SPH)</th>
            <th style={{ border: '1px solid #ccc', padding: '8px', background: '#f5f5f5', textAlign: 'center' }}>Cilindro (CYL)</th>
            <th style={{ border: '1px solid #ccc', padding: '8px', background: '#f5f5f5', textAlign: 'center' }}>Eje (AXIS)</th>
            <th style={{ border: '1px solid #ccc', padding: '8px', background: '#f5f5f5', textAlign: 'center' }}>Adición (ADD)</th>
            <th style={{ border: '1px solid #ccc', padding: '8px', background: '#f5f5f5', textAlign: 'center' }}>AV</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #ccc', padding: '8px', fontWeight: '600' }}>OD (Derecho)</td>
            <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center', fontFamily: 'monospace' }}>{fv(prescription.od_esfera)}</td>
            <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center', fontFamily: 'monospace' }}>{fv(prescription.od_cilindro)}</td>
            <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center', fontFamily: 'monospace' }}>{fv(prescription.od_eje, '°')}</td>
            <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center', fontFamily: 'monospace' }}>{fv(prescription.od_adicion)}</td>
            <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>{prescription.od_agudeza_visual ?? '—'}</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #ccc', padding: '8px', fontWeight: '600' }}>OI (Izquierdo)</td>
            <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center', fontFamily: 'monospace' }}>{fv(prescription.oi_esfera)}</td>
            <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center', fontFamily: 'monospace' }}>{fv(prescription.oi_cilindro)}</td>
            <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center', fontFamily: 'monospace' }}>{fv(prescription.oi_eje, '°')}</td>
            <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center', fontFamily: 'monospace' }}>{fv(prescription.oi_adicion)}</td>
            <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>{prescription.oi_agudeza_visual ?? '—'}</td>
          </tr>
        </tbody>
      </table>

      {/* Additional info */}
      <div style={{ display: 'flex', gap: '40px', marginBottom: '20px', fontSize: '12px' }}>
        <div>
          <strong>Distancia pupilar:</strong> {prescription.distancia_pupilar ? `${prescription.distancia_pupilar} mm` : '—'}
        </div>
        {prescription.proxima_revision && (
          <div>
            <strong>Próxima revisión:</strong> {formatDate(prescription.proxima_revision)}
          </div>
        )}
      </div>

      {/* Observations */}
      {prescription.observaciones && (
        <div style={{ marginBottom: '20px', fontSize: '12px' }}>
          <strong>Observaciones:</strong>
          <p style={{ margin: '4px 0 0 0', padding: '8px', border: '1px solid #eee', borderRadius: '4px' }}>
            {prescription.observaciones}
          </p>
        </div>
      )}

      {/* Signature line */}
      <div style={{ marginTop: '60px', display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: '1px solid #000', width: '200px', paddingTop: '8px' }}>
            Firma del profesional
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: '1px solid #000', width: '200px', paddingTop: '8px' }}>
            Timbre
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: '40px', textAlign: 'center', fontSize: '10px', color: '#999', borderTop: '1px solid #eee', paddingTop: '12px' }}>
        Documento generado el {new Date().toLocaleDateString('es-CL')} · {config?.nombre_optica ?? 'Óptica'}
      </div>
    </div>
  )
}
