import { useState } from 'react'
import { Plus, Edit, Trash2, X, Save } from 'lucide-react'
import { useCategoriesList, useCreateCategory, useUpdateCategory } from '../../hooks/useConfig'
import { categoryFormSchema, type CategoryFormData } from '../../types/config'
import { ConfirmModal } from '../ui/ConfirmModal'
import toast from 'react-hot-toast'
import type { Category } from '../../types/product'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'

function emptyForm(): CategoryFormData {
  return { nombre: '', multiplicador: null, umbral_stock_medio: null, umbral_stock_minimo: null }
}

function InlineForm({
  form,
  setForm,
  onSave,
  onCancel,
  saving,
  isEdit,
}: {
  form: CategoryFormData
  setForm: (fn: (prev: CategoryFormData) => CategoryFormData) => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
  isEdit: boolean
}) {
  return (
    <div
      className="p-4"
      style={{ backgroundColor: 'var(--bg-muted)', borderRadius: '8px', border: '1px solid var(--border)' }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Nombre *</label>
          <input
            type="text"
            value={form.nombre}
            onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
            placeholder="Ej: Armazones Premium, Lentes de Sol, Accesorios..."
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
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Umbral medio</label>
            <input
              type="number"
              value={form.umbral_stock_medio ?? ''}
              onChange={(e) => setForm((p) => ({ ...p, umbral_stock_medio: e.target.value ? Number(e.target.value) : null }))}
              placeholder="10"
              className="w-full px-3 py-2 text-sm outline-none"
              style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '6px', color: 'var(--input-text)' }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Umbral mínimo</label>
            <input
              type="number"
              value={form.umbral_stock_minimo ?? ''}
              onChange={(e) => setForm((p) => ({ ...p, umbral_stock_minimo: e.target.value ? Number(e.target.value) : null }))}
              placeholder="3"
              className="w-full px-3 py-2 text-sm outline-none"
              style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '6px', color: 'var(--input-text)' }}
            />
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-3">
        <button onClick={onCancel} className="flex items-center gap-1 px-3 py-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <X size={14} /> Cancelar
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium disabled:opacity-50"
          style={{ backgroundColor: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', borderRadius: '6px' }}
        >
          <Save size={14} /> {isEdit ? 'Guardar' : 'Crear'}
        </button>
      </div>
    </div>
  )
}

export function CategoriesTab() {
  const { data: categories, isLoading } = useCategoriesList()
  const createMutation = useCreateCategory()
  const updateMutation = useUpdateCategory()
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('categoria').update({ activo: false }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories-all'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })

  const [editId, setEditId] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState<CategoryFormData>(emptyForm())
  const [deleteId, setDeleteId] = useState<string | null>(null)

  function startEdit(cat: Category) {
    setEditId(cat.id)
    setShowNew(false)
    setForm({
      nombre: cat.nombre,
      multiplicador: cat.multiplicador,
      umbral_stock_medio: cat.umbral_stock_medio,
      umbral_stock_minimo: cat.umbral_stock_minimo,
    })
  }

  function startNew() {
    setEditId(null)
    setForm(emptyForm())
    setShowNew(true)
  }

  function cancel() {
    setShowNew(false)
    setEditId(null)
    setForm(emptyForm())
  }

  async function handleSave() {
    const result = categoryFormSchema.safeParse(form)
    if (!result.success) {
      toast.error(result.error.issues[0].message)
      return
    }

    try {
      if (editId) {
        await updateMutation.mutateAsync({ ...result.data, id: editId })
        toast.success('Categoría actualizada')
      } else {
        await createMutation.mutateAsync(result.data)
        toast.success('Categoría creada')
      }
      cancel()
    } catch {
      toast.error('Error al guardar categoría')
    }
  }

  function confirmDelete() {
    if (!deleteId) return
    deleteMutation.mutate(deleteId, {
      onSuccess: () => {
        toast.success('Categoría desactivada')
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

  const activeCategories = categories?.filter((c) => c.activo) ?? []

  return (
    <div className="max-w-3xl">
      <div
        className="p-5"
        style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Categorías ({activeCategories.length})
          </h3>
          {!showNew && !editId && (
            <button
              onClick={startNew}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium"
              style={{ backgroundColor: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', borderRadius: '6px' }}
            >
              <Plus size={14} />
              Agregar
            </button>
          )}
        </div>

        {/* New form at top */}
        {showNew && (
          <div className="mb-3">
            <InlineForm
              form={form}
              setForm={setForm}
              onSave={handleSave}
              onCancel={cancel}
              saving={createMutation.isPending}
              isEdit={false}
            />
          </div>
        )}

        {/* List */}
        {activeCategories.length > 0 ? (
          <div className="space-y-2">
            {activeCategories.map((cat) =>
              editId === cat.id ? (
                <InlineForm
                  key={cat.id}
                  form={form}
                  setForm={setForm}
                  onSave={handleSave}
                  onCancel={cancel}
                  saving={updateMutation.isPending}
                  isEdit
                />
              ) : (
                <div
                  key={cat.id}
                  className="flex items-center justify-between py-3 px-3 rounded-md"
                  style={{ backgroundColor: 'var(--bg-muted)', borderRadius: '6px' }}
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{cat.nombre}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {cat.multiplicador && (
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>×{cat.multiplicador}</span>
                      )}
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Stock: medio ≤{cat.umbral_stock_medio ?? '—'}, mínimo ≤{cat.umbral_stock_minimo ?? '—'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEdit(cat)}
                      className="p-1.5 rounded-md transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      aria-label="Editar"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteId(cat.id)}
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
              ),
            )}
          </div>
        ) : (
          <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>
            No hay categorías registradas
          </p>
        )}
      </div>

      {deleteId && (
        <ConfirmModal
          title="Desactivar categoría"
          message="¿Estás seguro? La categoría quedará inactiva pero los productos asociados no se afectan."
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
