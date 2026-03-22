import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Ban, Printer } from 'lucide-react'
import toast from 'react-hot-toast'
import { useSale, useCancelSale } from '../../hooks/useSales'
import { useConfig } from '../../hooks/useConfig'
import { calculateIVA } from '../../hooks/usePricingEngine'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { SALE_STATUS_CONFIG, PAYMENT_METHOD_LABELS, VERIFICATION_LABELS } from '../../types/sale'

export default function SaleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: sale, isLoading, error } = useSale(id)
  const { data: config } = useConfig()
  const cancelSale = useCancelSale()
  const [showCancel, setShowCancel] = useState(false)

  const formatCLP = (n: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(n)
  const formatDate = (d: string) => new Date(d).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  const handleCancel = async () => {
    try {
      await cancelSale.mutateAsync(id!)
      toast.success('Venta anulada. El stock fue devuelto.')
      setShowCancel(false)
    } catch {
      toast.error('Error al anular la venta')
    }
  }

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

  if (error || !sale) {
    return (
      <div className="text-center py-12">
        <p className="text-sm" style={{ color: 'var(--status-danger)' }}>Error al cargar la venta</p>
      </div>
    )
  }

  const statusConfig = SALE_STATUS_CONFIG[sale.estado]
  const { neto, iva } = calculateIVA(sale.total)

  return (
    <div className="space-y-6">
      {/* Print-only sale receipt */}
      <div className="print-only print-area" style={{ display: 'none' }}>
        <PrintableSaleReceipt sale={sale} config={config} neto={neto} iva={iva} />
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/ventas')}
            className="p-2 rounded-md shrink-0"
            style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
            aria-label="Volver"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                Venta
              </h1>
              <span
                className="inline-flex items-center px-2 py-0.5 text-xs font-medium"
                style={{
                  backgroundColor: `var(${statusConfig.bgVar})`,
                  color: `var(${statusConfig.textVar})`,
                  borderRadius: '9999px',
                }}
              >
                {statusConfig.label}
              </span>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {formatDate(sale.created_at)}
            </p>
          </div>
        </div>

        <div className="flex gap-2 self-start sm:self-auto">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-3 py-2 text-sm"
            style={{
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
            }}
          >
            <Printer size={16} />
            Imprimir
          </button>
          {(sale.estado === 'COMPLETADA' || sale.estado === 'EN_PROGRESO') && (
            <button
              onClick={() => setShowCancel(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium"
              style={{
                backgroundColor: 'var(--btn-danger-bg)',
                color: 'var(--btn-danger-text)',
                borderRadius: '6px',
              }}
            >
              <Ban size={16} />
              {sale.estado === 'EN_PROGRESO' ? 'Cancelar venta' : 'Anular venta'}
            </button>
          )}
        </div>
      </div>

      <div className="screen-only space-y-6">
      {/* Anulada banner */}
      {sale.estado === 'ANULADA' && (
        <div
          className="p-3 text-sm font-medium"
          style={{
            backgroundColor: 'var(--badge-danger-bg)',
            color: 'var(--badge-danger-text)',
            borderRadius: '6px',
          }}
        >
          Esta venta fue anulada. El stock de los productos fue devuelto al inventario.
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        {/* Info cards */}
        <div className="space-y-4">
          {/* Patient */}
          <div
            className="p-4 space-y-2"
            style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px' }}
          >
            <h3 className="text-xs font-medium tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              CLIENTE
            </h3>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {sale.paciente?.nombre ?? '—'}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {sale.paciente?.email}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Verificación: {VERIFICATION_LABELS[sale.verificacion]}
            </p>
          </div>

          {/* Payment */}
          <div
            className="p-4 space-y-2"
            style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px' }}
          >
            <h3 className="text-xs font-medium tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              PAGO
            </h3>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {sale.metodo_pago ? PAYMENT_METHOD_LABELS[sale.metodo_pago] : '—'}
            </p>
            {sale.monto_pagado != null && (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Recibido: {formatCLP(sale.monto_pagado)}
              </p>
            )}
            {sale.vuelto != null && sale.vuelto > 0 && (
              <p className="text-xs" style={{ color: 'var(--status-success)' }}>
                Vuelto: {formatCLP(sale.vuelto)}
              </p>
            )}
          </div>

          {/* Prescription */}
          {(sale.receta_id || sale.motivo_sin_receta) && (
            <div
              className="p-4 space-y-2"
              style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px' }}
            >
              <h3 className="text-xs font-medium tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                RECETA
              </h3>
              {sale.receta_id ? (
                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                  Receta del {sale.receta ? formatDate(sale.receta.created_at).split(',')[0] : '—'}
                </p>
              ) : (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Sin receta: {sale.motivo_sin_receta}
                </p>
              )}
            </div>
          )}

          {/* Notes */}
          {sale.notas && (
            <div
              className="p-4 space-y-2"
              style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px' }}
            >
              <h3 className="text-xs font-medium tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                NOTAS
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{sale.notas}</p>
            </div>
          )}

          {/* Admin */}
          <div
            className="p-4 space-y-2"
            style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px' }}
          >
            <h3 className="text-xs font-medium tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              VENDEDOR
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
              {sale.admin?.nombre ?? '—'}
            </p>
          </div>
        </div>

        {/* Items table */}
        <div
          className="md:col-span-2 p-4"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px' }}
        >
          <h3 className="text-xs font-medium tracking-wider mb-4" style={{ color: 'var(--text-secondary)' }}>
            PRODUCTOS
          </h3>

          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Producto', 'P. Unit.', 'Cant.', 'Desc.', 'Subtotal'].map((h) => (
                  <th
                    key={h}
                    className="text-left text-xs font-medium tracking-wider pb-2"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sale.items?.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="py-3">
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {item.producto?.nombre ?? '—'}
                    </p>
                    {item.producto?.sku && (
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.producto.sku}</p>
                    )}
                  </td>
                  <td className="py-3" style={{ color: 'var(--text-primary)' }}>
                    {formatCLP(item.precio_unitario)}
                  </td>
                  <td className="py-3" style={{ color: 'var(--text-primary)' }}>
                    {item.cantidad}
                  </td>
                  <td className="py-3">
                    {item.descuento_porcentaje > 0 ? (
                      <span style={{ color: 'var(--status-success)' }}>
                        -{item.descuento_porcentaje}%
                        {item.regla_descuento && (
                          <span className="text-xs block" style={{ color: 'var(--text-muted)' }}>
                            {item.regla_descuento.nombre}
                          </span>
                        )}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                  <td className="py-3 font-medium">
                    <span style={{ color: 'var(--text-primary)' }}>{formatCLP(item.subtotal)}</span>
                    <span className="block text-xs font-normal" style={{ color: 'var(--text-muted)' }}>
                      neto {formatCLP(Math.round(item.subtotal / 1.19))} + IVA {formatCLP(item.subtotal - Math.round(item.subtotal / 1.19))}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>

          {/* Totals */}
          <div className="pt-4 space-y-2">
            <div className="flex justify-between text-sm" style={{ color: 'var(--text-secondary)' }}>
              <span>Subtotal</span>
              <span>{formatCLP(sale.subtotal)}</span>
            </div>
            {sale.descuento_total > 0 && (
              <div className="flex justify-between text-sm" style={{ color: 'var(--status-success)' }}>
                <span>Descuento</span>
                <span>-{formatCLP(sale.descuento_total)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm" style={{ color: 'var(--text-secondary)' }}>
              <span>Neto</span>
              <span>{formatCLP(neto)}</span>
            </div>
            <div className="flex justify-between text-sm" style={{ color: 'var(--text-secondary)' }}>
              <span>IVA (19%)</span>
              <span>{formatCLP(iva)}</span>
            </div>
            <div
              className="flex justify-between text-lg font-bold pt-2"
              style={{ color: 'var(--text-primary)', borderTop: '1px solid var(--border)' }}
            >
              <span>Total</span>
              <span>{formatCLP(sale.total)}</span>
            </div>
          </div>
        </div>
      </div>

      </div>{/* end screen-only */}

      {showCancel && (
        <ConfirmModal
          title={sale.estado === 'EN_PROGRESO' ? 'Cancelar venta' : 'Anular venta'}
          message={
            sale.estado === 'EN_PROGRESO'
              ? 'Esta venta no fue completada. Los productos reservados se liberarán del inventario.'
              : `¿Estás seguro de anular esta venta de ${formatCLP(sale.total)}? El stock de los productos será devuelto al inventario.`
          }
          confirmLabel={sale.estado === 'EN_PROGRESO' ? 'Sí, cancelar' : 'Sí, anular'}
          loadingLabel={sale.estado === 'EN_PROGRESO' ? 'Cancelando venta...' : 'Anulando venta...'}
          danger
          loading={cancelSale.isPending}
          onConfirm={handleCancel}
          onCancel={() => setShowCancel(false)}
        />
      )}
    </div>
  )
}

// ── Printable Sale Receipt ──────────────────────────────

import type { Sale } from '../../types/sale'
import type { Configuracion } from '../../types/index'

interface PrintableSaleReceiptProps {
  sale: Sale
  config?: Configuracion | null
  neto: number
  iva: number
}

function PrintableSaleReceipt({ sale, config, neto, iva }: PrintableSaleReceiptProps) {
  const fmtCLP = (n: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(n)
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('es-CL')
  const fmtTime = (d: string) => new Date(d).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })

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
        Comprobante de Venta
      </h2>

      {/* Sale info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '12px' }}>
        <div>
          <strong>Cliente:</strong> {sale.paciente?.nombre ?? '—'}
        </div>
        <div>
          <strong>Fecha:</strong> {fmtDate(sale.created_at)} {fmtTime(sale.created_at)}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '12px' }}>
        <div>
          <strong>Verificación:</strong> {VERIFICATION_LABELS[sale.verificacion]}
        </div>
        <div>
          <strong>Método de pago:</strong> {sale.metodo_pago ? PAYMENT_METHOD_LABELS[sale.metodo_pago] : '—'}
        </div>
      </div>

      {/* Items table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '12px' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ccc', padding: '8px', background: '#f5f5f5', textAlign: 'left' }}>Producto</th>
            <th style={{ border: '1px solid #ccc', padding: '8px', background: '#f5f5f5', textAlign: 'center' }}>Cant.</th>
            <th style={{ border: '1px solid #ccc', padding: '8px', background: '#f5f5f5', textAlign: 'right' }}>P. Unit.</th>
            <th style={{ border: '1px solid #ccc', padding: '8px', background: '#f5f5f5', textAlign: 'center' }}>Desc.</th>
            <th style={{ border: '1px solid #ccc', padding: '8px', background: '#f5f5f5', textAlign: 'right' }}>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {sale.items?.map((item) => (
            <tr key={item.id}>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                {item.producto?.nombre ?? '—'}
                {item.producto?.sku && <span style={{ fontSize: '10px', color: '#888', display: 'block' }}>{item.producto.sku}</span>}
              </td>
              <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>{item.cantidad}</td>
              <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>{fmtCLP(item.precio_unitario)}</td>
              <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>
                {item.descuento_porcentaje > 0 ? `-${item.descuento_porcentaje}%` : '—'}
              </td>
              <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right', fontWeight: '500' }}>{fmtCLP(item.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ width: '280px', marginLeft: 'auto', fontSize: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
          <span>Subtotal:</span>
          <span>{fmtCLP(sale.subtotal)}</span>
        </div>
        {sale.descuento_total > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
            <span>Descuento:</span>
            <span>-{fmtCLP(sale.descuento_total)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
          <span>Neto:</span>
          <span>{fmtCLP(neto)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
          <span>IVA (19%):</span>
          <span>{fmtCLP(iva)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 4px', borderTop: '2px solid #000', fontWeight: '700', fontSize: '14px' }}>
          <span>TOTAL:</span>
          <span>{fmtCLP(sale.total)}</span>
        </div>
        {sale.metodo_pago === 'EFECTIVO' && sale.monto_pagado != null && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span>Recibido:</span>
              <span>{fmtCLP(sale.monto_pagado)}</span>
            </div>
            {sale.vuelto != null && sale.vuelto > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span>Vuelto:</span>
                <span>{fmtCLP(sale.vuelto)}</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Notes */}
      {sale.notas && (
        <div style={{ marginTop: '20px', fontSize: '11px' }}>
          <strong>Notas:</strong> {sale.notas}
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: '40px', textAlign: 'center', fontSize: '10px', color: '#999', borderTop: '1px solid #eee', paddingTop: '12px' }}>
        Documento generado el {new Date().toLocaleDateString('es-CL')} · {config?.nombre_optica ?? 'Óptica'}
      </div>
    </div>
  )
}
