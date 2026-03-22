import { useState } from 'react'
import { Plus, Edit, Trash2, X, Save } from 'lucide-react'
import { useSuppliersList, useCreateSupplier, useUpdateSupplier, useDeleteSupplier } from '../../hooks/useConfig'
import { supplierFormSchema, type SupplierFormData } from '../../types/config'
import { ConfirmModal } from '../ui/ConfirmModal'
import toast from 'react-hot-toast'
import type { Supplier } from '../../types/product'

function emptyForm(): SupplierFormData {
  return { nombre: '', tipo: 'INTERNACIONAL', url_alibaba: '', tiempo_entrega_dias: null, multiplicador: null }
}

export function SuppliersTab() {
  const { data: suppliers, isLoading } = useSuppliersList()
  const createMutation = useCreateSupplier()
  const updateMutation = useUpdateSupplier()
  const deleteMutation = useDeleteSupplier()

  const [editId, setEditId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<SupplierFormData>(emptyForm())
  const [deleteId, setDeleteId] = useState<string | null>(null)

  function startEdit(supplier: Supplier) {
    setEditId(supplier.id)
    setForm({
      nombre: supplier.nombre,
      tipo: supplier.tipo ?? 'INTERNACIONAL',
      url_alibaba: supplier.url_alibaba ?? '',
      tiempo_entrega_dias: supplier.tiempo_entrega_dias,
      multiplicador: supplier.multiplicador,
    })
    setShowForm(true)
  }

  function startNew() {
    setEditId(null)
    setForm(emptyForm())
    setShowForm(true)
  }

  function cancel() {
    setShowForm(false)
    setEditId(null)
    setForm(emptyForm())
  }

  async function handleSave() {
    const result = supplierFormSchema.safeParse(form)
    if (!result.success) {
      toast.error(result.error.issues[0].message)
      return
    }

    try {
      if (editId) {
        await updateMutation.mutateAsync({ ...result.data, id: editId })
        toast.success('Proveedor actualizado')
      } else {
        await createMutation.mutateAsync(result.data)
        toast.success('Proveedor creado')
      }
      cancel()
    } catch {
      toast.error('Error al guardar proveedor')
    }
  }

  function confirmDelete() {
    if (!deleteId) return
    deleteMutation.mutate(deleteId, {
      onSuccess: () => {
        toast.success('Proveedor desactivado')
        setDeleteId(null)
      },
      onError: () => toast.error('Error al eliminar'),
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--btn-primary-bg)' }} />
      </div>
    )
  }

  const activeSuppliers = suppliers?.filter((s) => s.activo) ?? []

  return (
    <div className="max-w-3xl">
      {/* List */}
      <div
        className="p-5"
        style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Proveedores ({activeSuppliers.length})
          </h3>
          {!showForm && (
            <button
              onClick={startNew}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium transition-colors"
              style={{ backgroundColor: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', borderRadius: '6px' }}
            >
              <Plus size={14} />
              Agregar
            </button>
          )}
        </div>

        {/* Form inline */}
        {showForm && (
          <div
            className="p-4 mb-4"
            style={{ backgroundColor: 'var(--bg-muted)', borderRadius: '8px', border: '1px solid var(--border)' }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Nombre *</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                  placeholder="Nombre del proveedor"
                  className="w-full px-3 py-2 text-sm outline-none"
                  style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '6px', color: 'var(--input-text)' }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Tipo *</label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value as 'LOCAL' | 'INTERNACIONAL' }))}
                  className="w-full px-3 py-2 text-sm outline-none"
                  style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '6px', color: 'var(--input-text)' }}
                >
                  <option value="INTERNACIONAL">Internacional (USD)</option>
                  <option value="LOCAL">Local (CLP)</option>
                </select>
              </div>
              {form.tipo === 'INTERNACIONAL' && (
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>URL Alibaba</label>
                  <input
                    type="text"
                    value={form.url_alibaba ?? ''}
                    onChange={(e) => setForm((p) => ({ ...p, url_alibaba: e.target.value }))}
                    placeholder="https://alibaba.com/..."
                    className="w-full px-3 py-2 text-sm outline-none"
                    style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '6px', color: 'var(--input-text)' }}
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Tiempo entrega (días)</label>
                <input
                  type="number"
                  value={form.tiempo_entrega_dias ?? ''}
                  onChange={(e) => setForm((p) => ({ ...p, tiempo_entrega_dias: e.target.value ? Number(e.target.value) : null }))}
                  placeholder="30"
                  className="w-full px-3 py-2 text-sm outline-none"
                  style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '6px', color: 'var(--input-text)' }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Multiplicador</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.multiplicador ?? ''}
                  onChange={(e) => setForm((p) => ({ ...p, multiplicador: e.target.value ? Number(e.target.value) : null }))}
                  placeholder="2.5"
                  className="w-full px-3 py-2 text-sm outline-none"
                  style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '6px', color: 'var(--input-text)' }}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={cancel} className="flex items-center gap-1 px-3 py-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <X size={14} /> Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium disabled:opacity-50"
                style={{ backgroundColor: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', borderRadius: '6px' }}
              >
                <Save size={14} /> {editId ? 'Guardar' : 'Crear'}
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        {activeSuppliers.length > 0 ? (
          <div className="space-y-2">
            {activeSuppliers.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between py-3 px-3 rounded-md"
                style={{ backgroundColor: 'var(--bg-muted)', borderRadius: '6px' }}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{s.nombre}</p>
                    <span
                      className="text-[10px] font-medium px-1.5 py-0.5"
                      style={{
                        backgroundColor: s.tipo === 'LOCAL' ? 'var(--badge-success-bg)' : 'var(--badge-primary-bg)',
                        color: s.tipo === 'LOCAL' ? 'var(--badge-success-text)' : 'var(--badge-primary-text)',
                        borderRadius: '9999px',
                      }}
                    >
                      {s.tipo === 'LOCAL' ? 'Local' : 'Internacional'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    {s.multiplicador && (
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>×{s.multiplicador}</span>
                    )}
                    {s.tiempo_entrega_dias && (
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.tiempo_entrega_dias} días</span>
                    )}
                    {s.url_alibaba && (
                      <a href={s.url_alibaba} target="_blank" rel="noopener noreferrer" className="text-xs" style={{ color: 'var(--btn-primary-bg)' }}>
                        Alibaba →
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => startEdit(s)}
                    className="p-1.5 rounded-md transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    aria-label="Editar"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteId(s.id)}
                    className="p-1.5 rounded-md transition-colors"
                    style={{ color: 'var(--status-danger)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    aria-label="Eliminar"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>
            No hay proveedores registrados
          </p>
        )}
      </div>

      {deleteId && (
        <ConfirmModal
          title="Desactivar proveedor"
          message="¿Estás seguro? El proveedor quedará inactivo pero no se eliminará."
          confirmLabel="Sí, desactivar"
          cancelLabel="Volver"
          danger
          onConfirm={confirmDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  )
}
