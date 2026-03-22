import { z } from 'zod'
import type { Product } from './product'

// ── Interfaces ──────────────────────────────────────────

export interface Sale {
  id: string
  paciente_id: string
  receta_id: string | null
  admin_id: string
  verificacion: VerificationType
  estado: SaleStatus
  metodo_pago: PaymentMethod | null
  subtotal: number
  descuento_total: number
  total: number
  monto_pagado: number | null
  vuelto: number | null
  motivo_sin_receta: string | null
  notas: string | null
  created_at: string
  updated_at: string
  // Joined
  paciente?: { id: string; nombre: string; email: string; telefono: string | null }
  receta?: { id: string; created_at: string }
  admin?: { id: string; nombre: string }
  items?: SaleItem[]
}

export interface SaleItem {
  id: string
  venta_id: string
  producto_id: string
  cantidad: number
  precio_unitario: number
  descuento_porcentaje: number
  descuento_monto: number
  subtotal: number
  regla_descuento_id: string | null
  created_at: string
  // Joined
  producto?: { id: string; nombre: string; sku: string | null; stock_actual: number }
  regla_descuento?: { id: string; nombre: string; porcentaje: number }
}

export interface DiscountRule {
  id: string
  nombre: string
  nivel: DiscountLevel
  porcentaje: number
  categoria_id: string | null
  proveedor_id: string | null
  producto_id: string | null
  fecha_inicio: string | null
  fecha_fin: string | null
  activo: boolean
  created_at: string
  updated_at: string
  // Joined
  categoria?: { id: string; nombre: string }
  proveedor?: { id: string; nombre: string }
  producto?: { id: string; nombre: string }
}

export const DISCOUNT_LEVEL_LABELS: Record<DiscountLevel, string> = {
  GLOBAL: 'Global',
  CATEGORIA: 'Por categoría',
  PROVEEDOR: 'Por proveedor',
  PRODUCTO: 'Por producto',
  TEMPORAL: 'Temporal',
}

export const discountRuleFormSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  nivel: z.enum(['GLOBAL', 'CATEGORIA', 'PROVEEDOR', 'PRODUCTO', 'TEMPORAL'], {
    errorMap: () => ({ message: 'Selecciona un nivel' }),
  }),
  porcentaje: z.union([z.number(), z.string().transform((v) => Number(v))])
    .refine((v) => v >= 1 && v <= 100, 'El porcentaje debe estar entre 1 y 100'),
  categoria_id: z.string().uuid().optional().or(z.literal('')),
  proveedor_id: z.string().uuid().optional().or(z.literal('')),
  producto_id: z.string().uuid().optional().or(z.literal('')),
  fecha_inicio: z.string().optional().or(z.literal('')),
  fecha_fin: z.string().optional().or(z.literal('')),
  activo: z.boolean(),
})

export type DiscountRuleFormData = z.infer<typeof discountRuleFormSchema>

export interface StockReservation {
  id: string
  producto_id: string
  venta_id: string
  cantidad: number
  expira_at: string
  liberada: boolean
}

// ── Enums ───────────────────────────────────────────────

export type SaleStatus = 'EN_PROGRESO' | 'COMPLETADA' | 'ANULADA'
export type VerificationType = 'PRESENCIAL' | 'FAMILIAR_AUTORIZADO' | 'COMPROBANTE'
export type PaymentMethod = 'EFECTIVO' | 'DEBITO' | 'CREDITO' | 'TRANSFERENCIA'
export type DiscountLevel = 'GLOBAL' | 'CATEGORIA' | 'PROVEEDOR' | 'PRODUCTO' | 'TEMPORAL'

// ── Cart item (wizard state) ────────────────────────────

export interface SaleCartItem {
  producto: Product
  cantidad: number
  precio_unitario: number
  descuento_porcentaje: number
  descuento_monto: number
  regla_descuento_id: string | null
  regla_descuento_nombre: string | null
  subtotal: number
}

// ── Wizard state ────────────────────────────────────────

export interface SaleWizardState {
  currentStep: number
  // Step 1
  paciente_id: string | null
  paciente: { id: string; nombre: string; email: string; telefono: string | null } | null
  // Step 2
  verificacion: VerificationType | null
  // Step 3
  items: SaleCartItem[]
  // Step 4
  receta_id: string | null
  motivo_sin_receta: string | null
  // Step 6
  metodo_pago: PaymentMethod | null
  monto_pagado: number | null
  // Misc
  notas: string | null
  // DB reference
  venta_id: string | null
}

// ── Status config ───────────────────────────────────────

export const SALE_STATUS_CONFIG: Record<SaleStatus, { label: string; bgVar: string; textVar: string }> = {
  EN_PROGRESO: { label: 'En progreso', bgVar: '--badge-warning-bg', textVar: '--badge-warning-text' },
  COMPLETADA: { label: 'Completada', bgVar: '--badge-success-bg', textVar: '--badge-success-text' },
  ANULADA: { label: 'Anulada', bgVar: '--badge-danger-bg', textVar: '--badge-danger-text' },
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  EFECTIVO: 'Efectivo',
  DEBITO: 'Débito',
  CREDITO: 'Crédito',
  TRANSFERENCIA: 'Transferencia',
}

export const VERIFICATION_LABELS: Record<VerificationType, string> = {
  PRESENCIAL: 'Presencial',
  FAMILIAR_AUTORIZADO: 'Familiar autorizado',
  COMPROBANTE: 'Comprobante',
}

// ── Zod schemas (per step) ──────────────────────────────

export const saleStep1Schema = z.object({
  paciente_id: z.string().uuid('Selecciona un paciente'),
})

export const saleStep2Schema = z.object({
  verificacion: z.enum(['PRESENCIAL', 'FAMILIAR_AUTORIZADO', 'COMPROBANTE'], {
    errorMap: () => ({ message: 'Selecciona un método de verificación' }),
  }),
})

export const saleStep3Schema = z.object({
  items: z.array(z.object({
    producto_id: z.string().uuid(),
    cantidad: z.number().min(1, 'Cantidad mínima es 1'),
  })).min(1, 'Agrega al menos un producto'),
})

export const saleStep4Schema = z.object({
  receta_id: z.string().uuid().nullable(),
  motivo_sin_receta: z.string().nullable(),
}).refine(
  (data) => data.receta_id !== null || (data.motivo_sin_receta !== null && data.motivo_sin_receta.length >= 5),
  { message: 'Selecciona una receta o indica el motivo (mínimo 5 caracteres)', path: ['motivo_sin_receta'] }
)

export const saleStep6Schema = z.object({
  metodo_pago: z.enum(['EFECTIVO', 'DEBITO', 'CREDITO', 'TRANSFERENCIA'], {
    errorMap: () => ({ message: 'Selecciona un método de pago' }),
  }),
  monto_pagado: z.number().nullable(),
  total: z.number(),
}).refine(
  (data) => {
    if (data.metodo_pago === 'EFECTIVO') {
      return data.monto_pagado !== null && data.monto_pagado >= data.total
    }
    return true
  },
  { message: 'El monto recibido debe ser mayor o igual al total', path: ['monto_pagado'] }
)

// ── Initial state ───────────────────────────────────────

export const INITIAL_WIZARD_STATE: SaleWizardState = {
  currentStep: 1,
  paciente_id: null,
  paciente: null,
  verificacion: null,
  items: [],
  receta_id: null,
  motivo_sin_receta: null,
  metodo_pago: null,
  monto_pagado: null,
  notas: null,
  venta_id: null,
}
