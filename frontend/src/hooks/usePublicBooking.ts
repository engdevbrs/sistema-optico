import { useQuery, useMutation } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

const FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1'

async function callEdgeFunction(name: string, options: {
  method?: string
  body?: Record<string, unknown>
  params?: Record<string, string>
}) {
  const url = new URL(`${FUNCTIONS_URL}/${name}`)
  if (options.params) {
    Object.entries(options.params).forEach(([k, v]) => url.searchParams.set(k, v))
  }

  const res = await fetch(url.toString(), {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Error en la solicitud')
  return data
}

// ── Availability ────────────────────────────────────────

interface Slot {
  hora_inicio: string
  hora_fin: string
}

interface AvailabilityResponse {
  slots: Slot[]
  fecha: string
  remaining?: number
  mensaje?: string
}

export function useAvailability(fecha: string, tipoCitaId: string) {
  return useQuery({
    queryKey: ['availability', fecha, tipoCitaId],
    queryFn: async (): Promise<AvailabilityResponse> => {
      return callEdgeFunction('get-availability', {
        params: { fecha, tipo_cita_id: tipoCitaId },
      })
    },
    enabled: !!fecha && !!tipoCitaId,
    staleTime: 1000 * 60 * 2,
  })
}

// ── Booking ─────────────────────────────────────────────

interface BookingResult {
  cita_id: string
  mensaje: string
  _debug_codigo?: string
}

export function useBookAppointment() {
  return useMutation({
    mutationFn: async (data: {
      nombre: string
      email: string
      telefono: string
      tipo_cita_id: string
      fecha: string
      hora_inicio: string
    }): Promise<BookingResult> => {
      return callEdgeFunction('book-appointment', {
        method: 'POST',
        body: data as unknown as Record<string, unknown>,
      })
    },
  })
}

// ── Verification ────────────────────────────────────────

interface VerifyResult {
  token: string
  mensaje: string
}

export function useVerifyAppointment() {
  return useMutation({
    mutationFn: async (data: { cita_id: string; codigo: string }): Promise<VerifyResult> => {
      return callEdgeFunction('verify-appointment', {
        method: 'POST',
        body: data as unknown as Record<string, unknown>,
      })
    },
  })
}

// ── Manage appointment ──────────────────────────────────

interface ManagedAppointment {
  id: string
  fecha: string
  hora_inicio: string
  hora_fin: string
  duracion_min: number
  estado: string
  token: string
  motivo_cancelacion: string | null
  motivo_cancelacion_texto: string | null
  cancelado_por: string | null
  created_at: string
  paciente: { id: string; nombre: string; email: string; telefono: string | null }
  tipo_cita: { id: string; nombre: string; duracion_min: number }
}

export function useGetAppointment(token: string | undefined) {
  return useQuery({
    queryKey: ['public-appointment', token],
    queryFn: async (): Promise<ManagedAppointment> => {
      return callEdgeFunction('manage-appointment', {
        params: { token: token! },
      })
    },
    enabled: !!token,
  })
}

export function useConfirmAppointment() {
  return useMutation({
    mutationFn: async (token: string) => {
      return callEdgeFunction('manage-appointment', {
        method: 'PUT',
        body: { token, estado: 'CONFIRMADA' },
      })
    },
  })
}

export function useEditAppointment() {
  return useMutation({
    mutationFn: async (data: { token: string; fecha: string; hora_inicio: string }) => {
      return callEdgeFunction('manage-appointment', {
        method: 'PUT',
        body: data as unknown as Record<string, unknown>,
      })
    },
  })
}

export function useCancelPublicAppointment() {
  return useMutation({
    mutationFn: async (data: { token: string; motivo: string; motivo_texto?: string }) => {
      const params: Record<string, string> = { token: data.token, motivo: data.motivo }
      if (data.motivo_texto) params.motivo_texto = data.motivo_texto
      return callEdgeFunction('manage-appointment', {
        method: 'DELETE',
        params,
      })
    },
  })
}

// ── Survey ──────────────────────────────────────────────

export function useSubmitSurvey() {
  return useMutation({
    mutationFn: async (data: { token: string; calificacion: number; comentario?: string }) => {
      return callEdgeFunction('submit-survey', {
        method: 'POST',
        body: data as unknown as Record<string, unknown>,
      })
    },
  })
}

// ── Public data (direct from Supabase, no auth needed) ──

export function usePublicReviews() {
  return useQuery({
    queryKey: ['public-reviews'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('encuesta')
        .select('calificacion, comentario, respondida_at, paciente:paciente_id(nombre)')
        .eq('respondida', true)
        .eq('aprobada_para_publica', true)
        .order('respondida_at', { ascending: false })
        .limit(6)

      if (error) throw error
      return (data ?? []).map((item) => ({
        ...item,
        paciente: Array.isArray(item.paciente) ? item.paciente[0] : item.paciente,
      })) as { calificacion: number; comentario: string | null; respondida_at: string; paciente: { nombre: string } }[]
    },
    staleTime: 1000 * 60 * 10,
  })
}

export function usePublicAppointmentTypes() {
  return useQuery({
    queryKey: ['public-appointment-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tipo_cita')
        .select('id, nombre, duracion_min')
        .order('duracion_min')

      if (error) throw error
      return data
    },
    staleTime: 1000 * 60 * 30,
  })
}

export function useActivePromotions() {
  return useQuery({
    queryKey: ['public-promotions'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('regla_descuento')
        .select('id, nombre, porcentaje, nivel, fecha_inicio, fecha_fin, categoria:categoria_id(nombre), producto:producto_id(nombre)')
        .eq('activo', true)
        .eq('nivel', 'TEMPORAL')
        .lte('fecha_inicio', today)
        .gte('fecha_fin', today)
        .order('porcentaje', { ascending: false })

      if (error) throw error
      return (data ?? []).map((item) => ({
        ...item,
        categoria: Array.isArray(item.categoria) ? item.categoria[0] : item.categoria,
        producto: Array.isArray(item.producto) ? item.producto[0] : item.producto,
      })) as { id: string; nombre: string; porcentaje: number; nivel: string; fecha_inicio: string; fecha_fin: string; categoria: { nombre: string } | null; producto: { nombre: string } | null }[]
    },
    staleTime: 1000 * 60 * 15,
  })
}
