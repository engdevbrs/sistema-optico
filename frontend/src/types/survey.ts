export interface Survey {
  id: string
  paciente_id: string
  cita_id: string
  token: string
  calificacion: number | null
  comentario: string | null
  respondida: boolean
  respondida_at: string | null
  aprobada_para_publica: boolean
  created_at: string
  // Joined
  paciente?: { id: string; nombre: string; email: string }
  cita?: { id: string; fecha: string; tipo_cita: { nombre: string } | null }
}
