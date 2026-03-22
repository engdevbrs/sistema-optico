import { z } from 'zod'

export interface Config {
  id: string
  nombre_optica: string
  logo_url: string | null
  direccion: string | null
  telefono: string | null
  email: string | null
  moneda_local: string
  tipo_cambio_modo: 'AUTO' | 'MANUAL'
  limite_citas_dia: number
  descuento_maximo: number
  modo_acumulacion_descuento: 'MAS_ESPECIFICO' | 'ACUMULADO' | 'ACUMULADO_CON_TOPE'
  max_cancelaciones_mes: number
  duracion_reserva_stock_min: number
  preferencia_contacto_default: 'EMAIL' | 'WHATSAPP' | 'AMBOS'
  google_maps_embed: string | null
  meta_ventas_diaria: number
}

export const configFormSchema = z.object({
  nombre_optica: z.string().min(1, 'El nombre es obligatorio').max(200),
  direccion: z.string().max(500).optional().or(z.literal('')),
  telefono: z.string().max(20).optional().or(z.literal('')),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  moneda_local: z.string().length(3),
  limite_citas_dia: z.number().min(1).max(50),
  descuento_maximo: z.number().min(0).max(100),
  max_cancelaciones_mes: z.number().min(1).max(10),
  duracion_reserva_stock_min: z.number().min(5).max(60),
  preferencia_contacto_default: z.enum(['EMAIL', 'WHATSAPP', 'AMBOS']),
  modo_acumulacion_descuento: z.enum(['MAS_ESPECIFICO', 'ACUMULADO', 'ACUMULADO_CON_TOPE']),
  google_maps_embed: z.string().optional().or(z.literal('')),
  meta_ventas_diaria: z.number().min(0).max(99999999),
})

export type ConfigFormData = z.infer<typeof configFormSchema>

export const supplierFormSchema = z.object({
  nombre: z.string().min(2, 'Nombre obligatorio').max(200),
  tipo: z.enum(['LOCAL', 'INTERNACIONAL']).default('INTERNACIONAL'),
  url_alibaba: z.string().url('URL inválida').optional().or(z.literal('')),
  tiempo_entrega_dias: z.union([z.number(), z.string().transform((v) => (v === '' ? null : Number(v)))]).nullable().optional(),
  multiplicador: z.union([z.number(), z.string().transform((v) => (v === '' ? null : Number(v)))]).nullable().optional(),
})

export type SupplierFormData = z.infer<typeof supplierFormSchema>

export const categoryFormSchema = z.object({
  nombre: z.string().min(2, 'Nombre obligatorio').max(100),
  multiplicador: z.union([z.number(), z.string().transform((v) => (v === '' ? null : Number(v)))]).nullable().optional(),
  umbral_stock_medio: z.union([z.number(), z.string().transform((v) => (v === '' ? null : Number(v)))]).nullable().optional(),
  umbral_stock_minimo: z.union([z.number(), z.string().transform((v) => (v === '' ? null : Number(v)))]).nullable().optional(),
})

export type CategoryFormData = z.infer<typeof categoryFormSchema>
