import { z } from 'zod'

export interface Patient {
  id: string
  nombre: string
  email: string
  telefono: string | null
  fecha_nacimiento: string | null
  preferencia_contacto: 'EMAIL' | 'WHATSAPP' | 'AMBOS'
  whatsapp_bloqueado: boolean
  proxima_revision: string | null
  cancelaciones_mes: number
  notas: string | null
  eliminado: boolean
  created_at: string
  updated_at: string
}

export const patientFormSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(200),
  email: z.string().email('Email inválido'),
  telefono: z
    .string()
    .regex(/^\+?[\d\s-]{7,20}$/, 'Teléfono inválido')
    .optional()
    .or(z.literal('')),
  fecha_nacimiento: z.string().optional().or(z.literal('')),
  preferencia_contacto: z.enum(['EMAIL', 'WHATSAPP', 'AMBOS']),
  notas: z.string().max(1000).optional().or(z.literal('')),
})

export type PatientFormData = z.infer<typeof patientFormSchema>
