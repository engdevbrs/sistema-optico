import { z } from 'zod'

// ── Interfaces ──────────────────────────────────────────

export interface Order {
  id: string
  proveedor_id: string
  estado: OrderStatus
  total_usd: number
  total_clp: number
  tipo_cambio_usado: number | null
  // Costos de internación (solo pedidos internacionales)
  costo_envio_usd: number | null
  seguro_usd: number | null
  cif_usd: number | null
  arancel_usd: number | null
  iva_importacion_usd: number | null
  total_landed_usd: number | null
  total_landed_clp: number | null
  fecha_envio: string | null
  fecha_recepcion_estimada: string | null
  fecha_recepcion_real: string | null
  notas: string | null
  creado_por: string
  created_at: string
  updated_at: string
  // Joined
  proveedor?: { id: string; nombre: string }
  admin?: { id: string; nombre: string }
  items?: OrderItem[]
}

export interface OrderItem {
  id: string
  pedido_id: string
  producto_id: string
  cantidad_pedida: number
  cantidad_recibida: number
  precio_unitario_usd: number
  created_at: string
  // Joined
  producto?: { id: string; nombre: string; sku: string | null; stock_actual: number }
}

// ── Enums ───────────────────────────────────────────────

export type OrderStatus = 'BORRADOR' | 'ENVIADO' | 'EN_TRANSITO' | 'RECIBIDO_PARCIAL' | 'RECIBIDO' | 'CANCELADO'

export const ORDER_STATUS_CONFIG: Record<OrderStatus, { label: string; bgVar: string; textVar: string }> = {
  BORRADOR: { label: 'Borrador', bgVar: '--badge-primary-bg', textVar: '--badge-primary-text' },
  ENVIADO: { label: 'Enviado', bgVar: '--badge-warning-bg', textVar: '--badge-warning-text' },
  EN_TRANSITO: { label: 'En tránsito', bgVar: '--badge-warning-bg', textVar: '--badge-warning-text' },
  RECIBIDO_PARCIAL: { label: 'Recibido parcial', bgVar: '--badge-warning-bg', textVar: '--badge-warning-text' },
  RECIBIDO: { label: 'Recibido', bgVar: '--badge-success-bg', textVar: '--badge-success-text' },
  CANCELADO: { label: 'Cancelado', bgVar: '--badge-danger-bg', textVar: '--badge-danger-text' },
}

// ── Cart item for new order ─────────────────────────────

export interface OrderCartItem {
  producto_id: string
  nombre: string
  sku: string | null
  stock_actual: number
  cantidad: number
  precio_unitario_usd: number
}

// ── Zod schemas ─────────────────────────────────────────

export const orderFormSchema = z.object({
  proveedor_id: z.string().uuid('Selecciona un proveedor'),
  notas: z.string().max(1000).optional().or(z.literal('')),
  items: z.array(z.object({
    producto_id: z.string().uuid(),
    cantidad: z.number().min(1, 'Mínimo 1'),
    precio_unitario_usd: z.number().min(0, 'Precio inválido'),
  })).min(1, 'Agrega al menos un producto'),
})

export type OrderFormData = z.infer<typeof orderFormSchema>
