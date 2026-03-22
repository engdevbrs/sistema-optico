import { z } from 'zod'

export interface Prescription {
  id: string
  paciente_id: string
  cita_id: string | null
  creado_por: string

  od_esfera: number | null
  od_cilindro: number | null
  od_eje: number | null
  od_adicion: number | null
  od_agudeza_visual: string | null

  oi_esfera: number | null
  oi_cilindro: number | null
  oi_eje: number | null
  oi_adicion: number | null
  oi_agudeza_visual: string | null

  distancia_pupilar: number | null
  observaciones: string | null
  proxima_revision: string | null
  reemplaza_a: string | null
  created_at: string

  // Joined
  paciente?: {
    id: string
    nombre: string
    email: string
  }
}

const optionalNumber = z
  .union([z.number(), z.string().transform((v) => (v === '' ? null : Number(v)))])
  .nullable()
  .optional()

export const prescriptionFormSchema = z.object({
  paciente_id: z.string().uuid('Selecciona un paciente'),
  cita_id: z.string().uuid().optional().or(z.literal('')),

  od_esfera: optionalNumber,
  od_cilindro: optionalNumber,
  od_eje: optionalNumber.refine((v) => v === null || v === undefined || (v >= 0 && v <= 180), {
    message: 'El eje debe estar entre 0° y 180°',
  }),
  od_adicion: optionalNumber,
  od_agudeza_visual: z.string().max(20).optional().or(z.literal('')),

  oi_esfera: optionalNumber,
  oi_cilindro: optionalNumber,
  oi_eje: optionalNumber.refine((v) => v === null || v === undefined || (v >= 0 && v <= 180), {
    message: 'El eje debe estar entre 0° y 180°',
  }),
  oi_adicion: optionalNumber,
  oi_agudeza_visual: z.string().max(20).optional().or(z.literal('')),

  distancia_pupilar: optionalNumber,
  observaciones: z.string().max(1000).optional().or(z.literal('')),
  proxima_revision: z.string().optional().or(z.literal('')),
  reemplaza_a: z.string().uuid().optional().or(z.literal('')),
})

export type PrescriptionFormData = z.infer<typeof prescriptionFormSchema>
