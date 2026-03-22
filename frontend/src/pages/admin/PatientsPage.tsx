import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Plus, Mail, Phone, Trash2, Edit, Eye } from 'lucide-react'
import { usePatients, useDeletePatient } from '../../hooks/usePatients'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { DropdownMenu, DropdownItem } from '../../components/ui/DropdownMenu'
import toast from 'react-hot-toast'
import type { Patient } from '../../types/patient'

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  // Para fechas tipo "YYYY-MM-DD" (sin hora), parsear como local para evitar desfase por timezone
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-').map(Number)
    return new Date(year, month - 1, day).toLocaleDateString('es-CL')
  }
  return new Date(dateStr).toLocaleDateString('es-CL')
}

interface PatientRowProps {
  patient: Patient
  onDelete: (id: string) => void
}

function PatientRow({ patient, onDelete }: PatientRowProps) {
  const navigate = useNavigate()

  return (
    <tr
      className="transition-colors"
      style={{ borderBottom: '1px solid var(--border)' }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--table-row-hover)')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      <td className="px-4 py-3">
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {patient.nombre}
          </p>
          <div className="flex items-center gap-3 mt-0.5">
            <span
              className="flex items-center gap-1 text-xs"
              style={{ color: 'var(--text-muted)' }}
            >
              <Mail size={12} />
              {patient.email}
            </span>
            {patient.telefono && (
              <span
                className="flex items-center gap-1 text-xs"
                style={{ color: 'var(--text-muted)' }}
              >
                <Phone size={12} />
                {patient.telefono}
              </span>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {formatDate(patient.fecha_nacimiento)}
        </span>
      </td>
      <td className="px-4 py-3">
        <span
          className="inline-flex px-2 py-0.5 text-xs font-medium"
          style={{
            backgroundColor: 'var(--badge-primary-bg)',
            color: 'var(--badge-primary-text)',
            borderRadius: '9999px',
          }}
        >
          {patient.preferencia_contacto === 'AMBOS'
            ? 'Email + WhatsApp'
            : patient.preferencia_contacto === 'EMAIL'
              ? 'Email'
              : 'WhatsApp'}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {formatDate(patient.created_at)}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <DropdownMenu>
          {(close) => (
            <>
              <DropdownItem
                icon={<Eye size={14} />}
                label="Ver ficha"
                onClick={() => { close(); navigate(`/admin/pacientes/${patient.id}`) }}
              />
              <DropdownItem
                icon={<Edit size={14} />}
                label="Editar"
                onClick={() => { close(); navigate(`/admin/pacientes/${patient.id}/editar`) }}
              />
              <DropdownItem
                icon={<Trash2 size={14} />}
                label="Eliminar"
                danger
                onClick={() => { close(); onDelete(patient.id) }}
              />
            </>
          )}
        </DropdownMenu>
      </td>
    </tr>
  )
}

export default function PatientsPage() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const { data: patients, isLoading, error } = usePatients(debouncedSearch)
  const deleteMutation = useDeletePatient()

  function handleDelete(id: string) {
    setDeleteId(id)
  }

  function confirmDelete() {
    if (!deleteId) return
    deleteMutation.mutate(deleteId, {
      onSuccess: () => {
        toast.success('Paciente eliminado')
        setDeleteId(null)
      },
      onError: () => toast.error('Error al eliminar paciente'),
    })
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Pacientes
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {patients?.length ?? 0} pacientes registrados
          </p>
        </div>
        <Link
          to="/admin/pacientes/nuevo"
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors self-start sm:self-auto"
          style={{
            backgroundColor: 'var(--btn-primary-bg)',
            color: 'var(--btn-primary-text)',
            borderRadius: '6px',
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = 'var(--btn-primary-hover)')
          }
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--btn-primary-bg)')}
        >
          <Plus size={16} />
          Nuevo paciente
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
          placeholder="Buscar por nombre, email o teléfono..."
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
              style={{
                borderColor: 'var(--border)',
                borderTopColor: 'var(--btn-primary-bg)',
              }}
            />
          </div>
        ) : error ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm" style={{ color: 'var(--status-danger)' }}>
              Error al cargar pacientes
            </p>
          </div>
        ) : patients && patients.length > 0 ? (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr style={{ backgroundColor: 'var(--table-header-bg)' }}>
                <th
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}
                >
                  Paciente
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}
                >
                  Nacimiento
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}
                >
                  Contacto
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}
                >
                  Registrado
                </th>
                <th
                  className="px-4 py-3 w-12"
                  style={{ borderBottom: '1px solid var(--border)' }}
                />
              </tr>
            </thead>
            <tbody>
              {patients.map((patient) => (
                <PatientRow key={patient.id} patient={patient} onDelete={handleDelete} />
              ))}
            </tbody>
          </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {search ? 'No se encontraron pacientes' : 'No hay pacientes registrados'}
            </p>
            {!search && (
              <Link
                to="/admin/pacientes/nuevo"
                className="inline-flex items-center gap-2 mt-3 text-sm font-medium"
                style={{ color: 'var(--btn-primary-bg)' }}
              >
                <Plus size={14} />
                Registrar primer paciente
              </Link>
            )}
          </div>
        )}
      </div>

      {deleteId && (
        <ConfirmModal
          title="Eliminar paciente"
          message="¿Estás seguro de eliminar este paciente? Esta acción se puede revertir dentro de 30 días."
          confirmLabel="Sí, eliminar"
          loadingLabel="Eliminando..."
          danger
          loading={deleteMutation.isPending}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  )
}
