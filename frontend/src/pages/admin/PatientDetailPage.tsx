import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  Calendar,
  MessageSquare,
  FileText,
  ShoppingCart,
  Clock,
  Eye,
} from 'lucide-react'
import { usePatient } from '../../hooks/usePatients'
import { usePatientPrescriptions } from '../../hooks/usePrescriptions'
import { usePatientAppointments, usePatientSales } from '../../hooks/usePatientHistory'
import { SALE_STATUS_CONFIG, PAYMENT_METHOD_LABELS } from '../../types/sale'
import type { SaleStatus, PaymentMethod } from '../../types/sale'

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  // Para fechas tipo "YYYY-MM-DD" (sin hora), parsear como local para evitar desfase por timezone
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-').map(Number)
    return new Date(year, month - 1, day).toLocaleDateString('es-CL')
  }
  return new Date(dateStr).toLocaleDateString('es-CL')
}

function formatValue(val: number | null) {
  if (val === null || val === undefined) return '—'
  return val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2)
}

interface InfoItemProps {
  icon: React.ReactNode
  label: string
  value: string
}

function InfoItem({ icon, label, value }: InfoItemProps) {
  return (
    <div className="flex items-start gap-3">
      <div style={{ color: 'var(--text-muted)' }}>{icon}</div>
      <div>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {label}
        </p>
        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          {value}
        </p>
      </div>
    </div>
  )
}

interface SectionCardProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}

function SectionCard({ title, icon, children }: SectionCardProps) {
  return (
    <div
      className="p-5"
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <span style={{ color: 'var(--text-secondary)' }}>{icon}</span>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h3>
      </div>
      {children}
    </div>
  )
}

export default function PatientDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: patient, isLoading, error } = usePatient(id)
  const { data: prescriptions } = usePatientPrescriptions(id)
  const { data: appointments } = usePatientAppointments(id)
  const { data: sales } = usePatientSales(id)

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

  if (error || !patient) {
    return (
      <div className="text-center py-12">
        <p className="text-sm" style={{ color: 'var(--status-danger)' }}>
          Paciente no encontrado
        </p>
        <button
          onClick={() => navigate('/admin/pacientes')}
          className="mt-3 text-sm font-medium"
          style={{ color: 'var(--btn-primary-bg)' }}
        >
          Volver a pacientes
        </button>
      </div>
    )
  }

  const contactPref =
    patient.preferencia_contacto === 'AMBOS'
      ? 'Email + WhatsApp'
      : patient.preferencia_contacto === 'EMAIL'
        ? 'Solo email'
        : 'Solo WhatsApp'

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={() => navigate('/admin/pacientes')}
            className="p-2 rounded-md transition-colors shrink-0"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)')
            }
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            aria-label="Volver"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
              {patient.nombre}
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Registrado el {formatDate(patient.created_at)}
            </p>
          </div>
        </div>
        <Link
          to={`/admin/pacientes/${patient.id}/editar`}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors self-start sm:self-auto shrink-0"
          style={{
            backgroundColor: 'var(--btn-secondary-bg)',
            color: 'var(--btn-secondary-text)',
            border: '1px solid var(--btn-secondary-border)',
            borderRadius: '6px',
          }}
        >
          <Edit size={16} />
          Editar
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Datos personales */}
        <div className="lg:col-span-1">
          <SectionCard title="Datos personales" icon={<Calendar size={16} />}>
            <div className="space-y-4">
              <InfoItem icon={<Mail size={14} />} label="Email" value={patient.email} />
              <InfoItem
                icon={<Phone size={14} />}
                label="Teléfono"
                value={patient.telefono ?? '—'}
              />
              <InfoItem
                icon={<Calendar size={14} />}
                label="Fecha de nacimiento"
                value={formatDate(patient.fecha_nacimiento)}
              />
              <InfoItem
                icon={<MessageSquare size={14} />}
                label="Preferencia de contacto"
                value={contactPref}
              />
              {patient.proxima_revision && (
                <InfoItem
                  icon={<Clock size={14} />}
                  label="Próxima revisión"
                  value={formatDate(patient.proxima_revision)}
                />
              )}
              {patient.notas && (
                <div className="pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                  <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                    Notas
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {patient.notas}
                  </p>
                </div>
              )}
            </div>
          </SectionCard>
        </div>

        {/* Historial */}
        <div className="lg:col-span-2 space-y-6">
          {/* Citas */}
          <SectionCard title={`Historial de citas (${appointments?.length ?? 0})`} icon={<Calendar size={16} />}>
            {!appointments || appointments.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Sin citas registradas
              </p>
            ) : (
              <div className="space-y-2">
                {appointments.map((apt) => {
                  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
                    PENDIENTE: { bg: '--badge-warning-bg', text: '--badge-warning-text', label: 'Pendiente' },
                    CONFIRMADA: { bg: '--badge-primary-bg', text: '--badge-primary-text', label: 'Confirmada' },
                    COMPLETADA: { bg: '--badge-success-bg', text: '--badge-success-text', label: 'Completada' },
                    CANCELADA: { bg: '--badge-danger-bg', text: '--badge-danger-text', label: 'Cancelada' },
                    NO_ASISTIO: { bg: '--badge-danger-bg', text: '--badge-danger-text', label: 'No asistió' },
                  }
                  const sc = statusColors[apt.estado] ?? statusColors.PENDIENTE
                  return (
                    <div
                      key={apt.id}
                      className="flex items-center justify-between p-3"
                      style={{ border: '1px solid var(--border)', borderRadius: '6px' }}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {formatDate(apt.fecha)}
                          </span>
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {apt.hora_inicio.slice(0, 5)} - {apt.hora_fin.slice(0, 5)}
                          </span>
                        </div>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {(apt.tipo_cita as unknown as { nombre: string })?.nombre ?? 'Consulta'}
                        </span>
                      </div>
                      <span
                        className="inline-flex items-center px-2 py-0.5 text-xs font-medium"
                        style={{ backgroundColor: `var(${sc.bg})`, color: `var(${sc.text})`, borderRadius: '9999px' }}
                      >
                        {sc.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </SectionCard>

          {/* Recetas */}
          <SectionCard title="Recetas ópticas" icon={<FileText size={16} />}>
            {!prescriptions || prescriptions.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Sin recetas registradas
              </p>
            ) : (
              <div className="space-y-3">
                {prescriptions.map((rx) => (
                  <Link
                    key={rx.id}
                    to={`/admin/recetas/${rx.id}`}
                    className="block p-3 rounded-md transition-colors"
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = 'transparent')
                    }
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className="text-xs font-medium"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {formatDate(rx.created_at)}
                      </span>
                      <Eye size={14} style={{ color: 'var(--text-muted)' }} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>OD: </span>
                        <span style={{ color: 'var(--text-primary)' }}>
                          {formatValue(rx.od_esfera)} / {formatValue(rx.od_cilindro)}
                          {rx.od_eje !== null ? ` × ${rx.od_eje}°` : ''}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>OI: </span>
                        <span style={{ color: 'var(--text-primary)' }}>
                          {formatValue(rx.oi_esfera)} / {formatValue(rx.oi_cilindro)}
                          {rx.oi_eje !== null ? ` × ${rx.oi_eje}°` : ''}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Compras */}
          <SectionCard title={`Historial de compras (${sales?.length ?? 0})`} icon={<ShoppingCart size={16} />}>
            {!sales || sales.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Sin compras registradas
              </p>
            ) : (
              <div className="space-y-2">
                {sales.map((sale) => {
                  const sc = SALE_STATUS_CONFIG[sale.estado as SaleStatus] ?? SALE_STATUS_CONFIG.COMPLETADA
                  const formatCLP = (n: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(n)
                  return (
                    <Link
                      key={sale.id}
                      to={`/admin/ventas/${sale.id}`}
                      className="flex items-center justify-between p-3 cursor-pointer"
                      style={{ border: '1px solid var(--border)', borderRadius: '6px' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {formatCLP(sale.total)}
                          </span>
                          <span
                            className="inline-flex items-center px-2 py-0.5 text-xs font-medium"
                            style={{ backgroundColor: `var(${sc.bgVar})`, color: `var(${sc.textVar})`, borderRadius: '9999px' }}
                          >
                            {sc.label}
                          </span>
                        </div>
                        <div className="flex gap-2 text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          <span>{formatDate(sale.created_at)}</span>
                          <span>{sale.items_count} productos</span>
                          {sale.metodo_pago && <span>{PAYMENT_METHOD_LABELS[sale.metodo_pago as PaymentMethod]}</span>}
                        </div>
                      </div>
                      <Eye size={14} style={{ color: 'var(--text-muted)' }} />
                    </Link>
                  )
                })}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  )
}
