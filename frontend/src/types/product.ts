import { z } from 'zod'

export interface Product {
  id: string
  nombre: string
  sku: string | null
  categoria_id: string
  proveedor_id: string | null
  precio_compra_usd: number | null
  precio_compra_clp: number | null
  precio_venta_fijo: number | null
  multiplicador: number | null
  stock_actual: number
  stock_optimo: number | null
  umbral_stock_medio: number | null
  umbral_stock_minimo: number | null
  alibaba_product_url: string | null
  descripcion: string | null
  activo: boolean
  eliminado: boolean
  created_at: string
  updated_at: string
  // Joined
  categoria?: {
    id: string
    nombre: string
    tipo: string
    multiplicador: number | null
  }
  proveedor?: {
    id: string
    nombre: string
    tipo: 'LOCAL' | 'INTERNACIONAL'
    multiplicador: number | null
  }
}

export interface Category {
  id: string
  nombre: string
  multiplicador: number | null
  umbral_stock_medio: number | null
  umbral_stock_minimo: number | null
  activo: boolean
}

export interface Supplier {
  id: string
  nombre: string
  tipo: 'LOCAL' | 'INTERNACIONAL'
  url_alibaba: string | null
  tiempo_entrega_dias: number | null
  multiplicador: number | null
  activo: boolean
}

export interface StockMovement {
  id: string
  producto_id: string
  tipo: 'ENTRADA' | 'SALIDA'
  cantidad: number
  stock_anterior: number
  stock_nuevo: number
  origen: string
  nota: string | null
  created_at: string
}

export type StockLevel = 'ok' | 'medio' | 'bajo' | 'agotado'

export function getStockLevel(product: Product, category?: Product['categoria']): StockLevel {
  if (product.stock_actual === 0) return 'agotado'
  const umbralMin = product.umbral_stock_minimo ?? category?.umbral_stock_minimo ?? 3
  const umbralMedio = product.umbral_stock_medio ?? category?.umbral_stock_medio ?? 10
  if (product.stock_actual <= umbralMin) return 'bajo'
  if (product.stock_actual <= umbralMedio) return 'medio'
  return 'ok'
}

export const STOCK_LEVEL_CONFIG: Record<StockLevel, { label: string; bgVar: string; textVar: string }> = {
  ok: { label: 'OK', bgVar: '--badge-success-bg', textVar: '--badge-success-text' },
  medio: { label: 'Medio', bgVar: '--badge-warning-bg', textVar: '--badge-warning-text' },
  bajo: { label: 'Bajo', bgVar: '--badge-danger-bg', textVar: '--badge-danger-text' },
  agotado: { label: 'Agotado', bgVar: '--badge-danger-bg', textVar: '--badge-danger-text' },
}

export const productFormSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(300),
  sku: z.string().max(50).optional().or(z.literal('')),
  categoria_id: z.string().uuid('Selecciona una categoría'),
  proveedor_id: z.string().uuid().optional().or(z.literal('')),
  precio_compra_usd: z.union([z.number(), z.string().transform((v) => (v === '' ? null : Number(v)))]).nullable().optional(),
  precio_venta_fijo: z.union([z.number(), z.string().transform((v) => (v === '' ? null : Number(v)))]).nullable().optional(),
  multiplicador: z.union([z.number(), z.string().transform((v) => (v === '' ? null : Number(v)))]).nullable().optional(),
  stock_actual: z.union([z.number(), z.string().transform((v) => Number(v))]).refine((v) => v >= 0, 'El stock no puede ser negativo'),
  stock_optimo: z.union([z.number(), z.string().transform((v) => (v === '' ? null : Number(v)))]).nullable().optional(),
  umbral_stock_medio: z.union([z.number(), z.string().transform((v) => (v === '' ? null : Number(v)))]).nullable().optional(),
  umbral_stock_minimo: z.union([z.number(), z.string().transform((v) => (v === '' ? null : Number(v)))]).nullable().optional(),
  alibaba_product_url: z.string().url('URL inválida').optional().or(z.literal('')),
  descripcion: z.string().max(1000).optional().or(z.literal('')),
})

export type ProductFormData = z.infer<typeof productFormSchema>
