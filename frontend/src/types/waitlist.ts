export interface WaitlistEntry {
  id: string
  paciente_id: string
  tipo_cita_id: string
  fecha_preferida: string | null
  estado: WaitlistStatus
  notificado_at: string | null
  expira_at: string | null
  created_at: string
  updated_at: string
  // Joined
  paciente?: { id: string; nombre: string; email: string; telefono: string | null }
  tipo_cita?: { id: string; nombre: string }
}

export type WaitlistStatus = 'ESPERANDO' | 'NOTIFICADO' | 'CONFIRMADO' | 'EXPIRADO' | 'REMOVIDO'

export const WAITLIST_STATUS_CONFIG: Record<WaitlistStatus, { label: string; bgVar: string; textVar: string }> = {
  ESPERANDO: { label: 'Esperando', bgVar: '--badge-warning-bg', textVar: '--badge-warning-text' },
  NOTIFICADO: { label: 'Notificado', bgVar: '--badge-primary-bg', textVar: '--badge-primary-text' },
  CONFIRMADO: { label: 'Confirmado', bgVar: '--badge-success-bg', textVar: '--badge-success-text' },
  EXPIRADO: { label: 'Expirado', bgVar: '--badge-danger-bg', textVar: '--badge-danger-text' },
  REMOVIDO: { label: 'Removido', bgVar: '--badge-danger-bg', textVar: '--badge-danger-text' },
}
