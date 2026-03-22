import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Plus, Package, Eye, Edit, Trash2, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import { useProducts, useDeleteProduct } from '../../hooks/useProducts'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { getStockLevel, STOCK_LEVEL_CONFIG, type Product } from '../../types/product'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { DropdownMenu, DropdownItem } from '../../components/ui/DropdownMenu'
import toast from 'react-hot-toast'

function formatPrice(val: number | null): string {
  if (val === null || val === undefined) return '—'
  return `$${val.toLocaleString('es-CL')}`
}

function StockBadge({ product }: { product: Product }) {
  const level = getStockLevel(product, product.categoria)
  const config = STOCK_LEVEL_CONFIG[level]
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium"
      style={{
        backgroundColor: `var(${config.bgVar})`,
        color: `var(${config.textVar})`,
        borderRadius: '9999px',
      }}
    >
      {product.stock_actual} · {config.label}
    </span>
  )
}

function ProductRow({
  product,
  onDelete,
}: {
  product: Product
  onDelete: (id: string) => void
}) {
  const navigate = useNavigate()

  // Calcular precio de venta
  let precioVenta: number | null = null
  if (product.precio_venta_fijo) {
    precioVenta = product.precio_venta_fijo
  } else if (product.precio_compra_clp) {
    const mult =
      product.multiplicador ??
      product.categoria?.multiplicador ??
      product.proveedor?.multiplicador ??
      2.5
    precioVenta = Math.round(product.precio_compra_clp * mult)
  }

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
            {product.nombre}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            {product.sku && (
              <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                SKU: {product.sku}
              </span>
            )}
            <span
              className="inline-flex px-1.5 py-0.5 text-xs"
              style={{
                backgroundColor: 'var(--bg-muted)',
                color: 'var(--text-muted)',
                borderRadius: '4px',
              }}
            >
              {product.categoria?.nombre ?? '—'}
            </span>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <StockBadge product={product} />
      </td>
      <td className="px-4 py-3">
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {formatPrice(product.precio_compra_clp)}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          {formatPrice(precioVenta)}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {product.proveedor?.nombre ?? '—'}
        </span>
      </td>
      <td className="px-4 py-3">
        {product.proveedor && (
          <span
            className="text-[10px] font-medium px-1.5 py-0.5"
            style={{
              backgroundColor: product.proveedor.tipo === 'LOCAL' ? 'var(--badge-success-bg)' : 'var(--badge-primary-bg)',
              color: product.proveedor.tipo === 'LOCAL' ? 'var(--badge-success-text)' : 'var(--badge-primary-text)',
              borderRadius: '9999px',
            }}
          >
            {product.proveedor.tipo === 'LOCAL' ? 'Local' : 'Internacional'}
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <DropdownMenu>
          {(close) => (
            <>
              <DropdownItem
                icon={<Eye size={14} />}
                label="Ver detalle"
                onClick={() => { close(); navigate(`/admin/inventario/${product.id}`) }}
              />
              <DropdownItem
                icon={<Edit size={14} />}
                label="Editar"
                onClick={() => { close(); navigate(`/admin/inventario/${product.id}/editar`) }}
              />
              <DropdownItem
                icon={<Trash2 size={14} />}
                label="Eliminar"
                danger
                onClick={() => { close(); onDelete(product.id) }}
              />
            </>
          )}
        </DropdownMenu>
      </td>
    </tr>
  )
}

function MobileProductCard({
  product,
  onDelete,
}: {
  product: Product
  onDelete: (id: string) => void
}) {
  const navigate = useNavigate()

  let precioVenta: number | null = null
  if (product.precio_venta_fijo) {
    precioVenta = product.precio_venta_fijo
  } else if (product.precio_compra_clp) {
    const mult =
      product.multiplicador ??
      product.categoria?.multiplicador ??
      product.proveedor?.multiplicador ??
      2.5
    precioVenta = Math.round(product.precio_compra_clp * mult)
  }

  return (
    <div
      className="px-4 py-3 active:opacity-80"
      onClick={() => navigate(`/admin/inventario/${product.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/admin/inventario/${product.id}`)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
            {product.nombre}
          </p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {product.sku && (
              <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                {product.sku}
              </span>
            )}
            <span
              className="inline-flex px-1.5 py-0.5 text-xs"
              style={{
                backgroundColor: 'var(--bg-muted)',
                color: 'var(--text-muted)',
                borderRadius: '4px',
              }}
            >
              {product.categoria?.nombre ?? '—'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <StockBadge product={product} />
          <DropdownMenu>
            {(close) => (
              <>
                <DropdownItem
                  icon={<Eye size={14} />}
                  label="Ver detalle"
                  onClick={() => { close(); navigate(`/admin/inventario/${product.id}`) }}
                />
                <DropdownItem
                  icon={<Edit size={14} />}
                  label="Editar"
                  onClick={() => { close(); navigate(`/admin/inventario/${product.id}/editar`) }}
                />
                <DropdownItem
                  icon={<Trash2 size={14} />}
                  label="Eliminar"
                  danger
                  onClick={() => { close(); onDelete(product.id) }}
                />
              </>
            )}
          </DropdownMenu>
        </div>
      </div>
      <div className="flex items-center gap-4 mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
        <span>Costo: {formatPrice(product.precio_compra_clp)}</span>
        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
          Venta: {formatPrice(precioVenta)}
        </span>
        {product.proveedor && (
          <span className="truncate">{product.proveedor.nombre}</span>
        )}
      </div>
    </div>
  )
}

type SortKey = 'nombre' | 'stock' | 'costo' | 'precio' | 'proveedor' | 'tipo'
type SortDir = 'asc' | 'desc'

function getSortValue(product: Product, key: SortKey): string | number {
  switch (key) {
    case 'nombre': return product.nombre.toLowerCase()
    case 'stock': return product.stock_actual
    case 'costo': return product.precio_compra_clp ?? 0
    case 'precio': {
      if (product.precio_venta_fijo) return product.precio_venta_fijo
      if (product.precio_compra_clp) {
        const mult = product.multiplicador ?? product.categoria?.multiplicador ?? product.proveedor?.multiplicador ?? 2.5
        return Math.round(product.precio_compra_clp * mult)
      }
      return 0
    }
    case 'proveedor': return product.proveedor?.nombre?.toLowerCase() ?? 'zzz'
    case 'tipo': return product.proveedor?.tipo ?? 'zzz'
  }
}

export default function InventoryPage() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('nombre')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const { data: products, isLoading, error } = useProducts(debouncedSearch)
  const deleteMutation = useDeleteProduct()

  const sortedProducts = useMemo(() => {
    if (!products) return []
    return [...products].sort((a, b) => {
      const va = getSortValue(a, sortKey)
      const vb = getSortValue(b, sortKey)
      const cmp = va < vb ? -1 : va > vb ? 1 : 0
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [products, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  function confirmDelete() {
    if (!deleteId) return
    deleteMutation.mutate(deleteId, {
      onSuccess: () => {
        toast.success('Producto eliminado')
        setDeleteId(null)
      },
      onError: () => toast.error('Error al eliminar producto'),
    })
  }

  // Stats
  const totalProducts = products?.length ?? 0
  const lowStock = products?.filter((p) => {
    const level = getStockLevel(p, p.categoria)
    return level === 'bajo' || level === 'agotado'
  }).length ?? 0

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Inventario
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {totalProducts} productos
            {lowStock > 0 && (
              <span style={{ color: 'var(--status-danger)' }}> · {lowStock} con stock bajo</span>
            )}
          </p>
        </div>
        <Link
          to="/admin/inventario/nuevo"
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
          Nuevo producto
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
          placeholder="Buscar por nombre o SKU..."
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
            <p className="text-sm" style={{ color: 'var(--status-danger)' }}>Error al cargar inventario</p>
          </div>
        ) : products && products.length > 0 ? (
          <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: 'var(--table-header-bg)' }}>
                  {([
                    { label: 'Producto', key: 'nombre' as SortKey },
                    { label: 'Stock', key: 'stock' as SortKey },
                    { label: 'Costo', key: 'costo' as SortKey },
                    { label: 'Precio venta', key: 'precio' as SortKey },
                    { label: 'Proveedor', key: 'proveedor' as SortKey },
                    { label: 'Tipo', key: 'tipo' as SortKey },
                  ]).map((col) => (
                    <th
                      key={col.key}
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer select-none transition-colors"
                      style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}
                      onClick={() => toggleSort(col.key)}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                    >
                      <span className="inline-flex items-center gap-1">
                        {col.label}
                        {sortKey === col.key ? (
                          sortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                        ) : (
                          <ArrowUpDown size={12} className="opacity-30" />
                        )}
                      </span>
                    </th>
                  ))}
                  <th
                    className="px-4 py-3 text-left text-xs font-medium"
                    style={{ borderBottom: '1px solid var(--border)' }}
                  />
                </tr>
              </thead>
              <tbody>
                {sortedProducts.map((product) => (
                  <ProductRow key={product.id} product={product} onDelete={(id) => setDeleteId(id)} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y" style={{ borderColor: 'var(--border)' }}>
            {sortedProducts.map((product) => (
              <MobileProductCard key={product.id} product={product} onDelete={(id) => setDeleteId(id)} />
            ))}
          </div>
          </>
        ) : (
          <div className="px-6 py-12 text-center">
            <Package size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {search ? 'No se encontraron productos' : 'No hay productos registrados'}
            </p>
            {!search && (
              <Link
                to="/admin/inventario/nuevo"
                className="inline-flex items-center gap-2 mt-3 text-sm font-medium"
                style={{ color: 'var(--btn-primary-bg)' }}
              >
                <Plus size={14} />
                Agregar primer producto
              </Link>
            )}
          </div>
        )}
      </div>

      {deleteId && (
        <ConfirmModal
          title="Eliminar producto"
          message="¿Estás seguro de eliminar este producto? Se puede restaurar dentro de 30 días."
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
