import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type {
  Appointment,
  AppointmentFormData,
  AppointmentStatus,
  AppointmentType,
  WeeklySchedule,
} from '../types/appointment'

const APPOINTMENTS_KEY = ['appointments']

export function useAppointments(fecha: string) {
  return useQuery({
    queryKey: [...APPOINTMENTS_KEY, fecha],
    queryFn: async (): Promise<Appointment[]> => {
      const { data, error } = await supabase
        .from('cita')
        .select(
          `
          *,
          paciente:paciente_id(id, nombre, email, telefono),
          tipo_cita:tipo_cita_id(id, nombre, duracion_min)
        `,
        )
        .eq('fecha', fecha)
        .order('hora_inicio', { ascending: true })

      if (error) throw error
      return data
    },
  })
}

export function useAppointmentsByRange(fechaInicio: string, fechaFin: string) {
  return useQuery({
    queryKey: [...APPOINTMENTS_KEY, 'range', fechaInicio, fechaFin],
    queryFn: async (): Promise<Appointment[]> => {
      const { data, error } = await supabase
        .from('cita')
        .select(
          `
          *,
          paciente:paciente_id(id, nombre, email, telefono),
          tipo_cita:tipo_cita_id(id, nombre, duracion_min)
        `,
        )
        .gte('fecha', fechaInicio)
        .lte('fecha', fechaFin)
        .order('fecha', { ascending: true })
        .order('hora_inicio', { ascending: true })

      if (error) throw error
      return data
    },
  })
}

export function useAppointmentTypes() {
  return useQuery({
    queryKey: ['appointment-types'],
    queryFn: async (): Promise<AppointmentType[]> => {
      const { data, error } = await supabase
        .from('tipo_cita')
        .select('*')
        .eq('activo', true)
        .order('nombre')

      if (error) throw error
      return data
    },
    staleTime: 1000 * 60 * 30, // 30 min — raramente cambian
  })
}

export function useWeeklySchedule() {
  return useQuery({
    queryKey: ['weekly-schedule'],
    queryFn: async (): Promise<WeeklySchedule[]> => {
      const { data, error } = await supabase
        .from('horario_semanal')
        .select('*')
        .order('dia_semana')

      if (error) throw error
      return data
    },
    staleTime: 1000 * 60 * 30,
  })
}

export function useCreateAppointment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (formData: AppointmentFormData) => {
      // Obtener tipo de cita para calcular hora_fin
      const { data: tipoCita, error: tipoError } = await supabase
        .from('tipo_cita')
        .select('duracion_min')
        .eq('id', formData.tipo_cita_id)
        .single()

      if (tipoError) throw tipoError

      const [hours, minutes] = formData.hora_inicio.split(':').map(Number)
      const startMinutes = hours * 60 + minutes
      const endMinutes = startMinutes + tipoCita.duracion_min
      const endHours = Math.floor(endMinutes / 60)
      const endMins = endMinutes % 60
      const horaFin = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`

      const { data, error } = await supabase
        .from('cita')
        .insert({
          paciente_id: formData.paciente_id,
          tipo_cita_id: formData.tipo_cita_id,
          fecha: formData.fecha,
          hora_inicio: formData.hora_inicio,
          hora_fin: horaFin,
          duracion_min: tipoCita.duracion_min,
          estado: 'CONFIRMADA' as AppointmentStatus, // Admin crea directamente como confirmada
          notas_admin: formData.notas_admin || null,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPOINTMENTS_KEY })
    },
  })
}

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      estado,
      motivo_cancelacion,
      motivo_cancelacion_texto,
    }: {
      id: string
      estado: AppointmentStatus
      motivo_cancelacion?: string
      motivo_cancelacion_texto?: string
    }) => {
      const updateData: Record<string, unknown> = { estado }
      if (motivo_cancelacion) updateData.motivo_cancelacion = motivo_cancelacion
      if (motivo_cancelacion_texto) updateData.motivo_cancelacion_texto = motivo_cancelacion_texto
      if (estado === 'CANCELADA') updateData.cancelado_por = 'ADMIN'

      const { error } = await supabase.from('cita').update(updateData).eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPOINTMENTS_KEY })
    },
  })
}
