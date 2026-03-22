import { z } from 'zod'

export type AppointmentStatus =
  | 'PRE_RESERVA'
  | 'PENDIENTE'
  | 'CONFIRMADA'
  | 'COMPLETADA'
  | 'CANCELADA'
  | 'NO_ASISTIO'

export interface Appointment {
  id: string
  paciente_id: string
  tipo_cita_id: string
  fecha: string
  hora_inicio: string
  hora_fin: string
  duracion_min: number
  estado: AppointmentStatus
  token: string
  notas_admin: string | null
  motivo_cancelacion: string | null
  motivo_cancelacion_texto: string | null
  cancelado_por: string | null
  created_at: string
  updated_at: string
  // Joined
  paciente?: {
    id: string
    nombre: string
    email: string
    telefono: string | null
  }
  tipo_cita?: {
    id: string
    nombre: string
    duracion_min: number
  }
}

export interface AppointmentType {
  id: string
  nombre: string
  duracion_min: number
  activo: boolean
}

export interface WeeklySchedule {
  id: string
  dia_semana: number
  activo: boolean
  hora_inicio: string
  hora_fin: string
}

export const appointmentFormSchema = z.object({
  paciente_id: z.string().uuid('Selecciona un paciente'),
  tipo_cita_id: z.string().uuid('Selecciona un tipo de cita'),
  fecha: z.string().min(1, 'Selecciona una fecha'),
  hora_inicio: z.string().min(1, 'Selecciona una hora'),
  notas_admin: z.string().max(500).optional().or(z.literal('')),
})

export type AppointmentFormData = z.infer<typeof appointmentFormSchema>

export const STATUS_CONFIG: Record<
  AppointmentStatus,
  { label: string; bgVar: string; textVar: string }
> = {
  PRE_RESERVA: {
    label: 'Pre-reserva',
    bgVar: '--badge-warning-bg',
    textVar: '--badge-warning-text',
  },
  PENDIENTE: {
    label: 'Pendiente',
    bgVar: '--badge-warning-bg',
    textVar: '--badge-warning-text',
  },
  CONFIRMADA: {
    label: 'Confirmada',
    bgVar: '--badge-primary-bg',
    textVar: '--badge-primary-text',
  },
  COMPLETADA: {
    label: 'Completada',
    bgVar: '--badge-success-bg',
    textVar: '--badge-success-text',
  },
  CANCELADA: {
    label: 'Cancelada',
    bgVar: '--badge-danger-bg',
    textVar: '--badge-danger-text',
  },
  NO_ASISTIO: {
    label: 'No asistió',
    bgVar: '--badge-danger-bg',
    textVar: '--badge-danger-text',
  },
}
