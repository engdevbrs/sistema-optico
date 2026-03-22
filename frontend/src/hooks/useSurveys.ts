import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Survey } from '../types/survey'

const SURVEYS_KEY = ['surveys']

export function useSurveys(filter?: 'all' | 'answered' | 'pending' | 'approved') {
  return useQuery({
    queryKey: [...SURVEYS_KEY, filter],
    queryFn: async (): Promise<Survey[]> => {
      let query = supabase
        .from('encuesta')
        .select(`
          *,
          paciente:paciente_id(id, nombre, email),
          cita:cita_id(id, fecha, tipo_cita:tipo_cita_id(nombre))
        `)
        .order('created_at', { ascending: false })

      if (filter === 'answered') {
        query = query.eq('respondida', true)
      } else if (filter === 'pending') {
        query = query.eq('respondida', false)
      } else if (filter === 'approved') {
        query = query.eq('aprobada_para_publica', true)
      }

      const { data, error } = await query
      if (error) throw error
      return data as Survey[]
    },
  })
}

export function useToggleApproval() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, approved }: { id: string; approved: boolean }) => {
      const { error } = await supabase
        .from('encuesta')
        .update({ aprobada_para_publica: approved })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SURVEYS_KEY })
    },
  })
}

export function useDeleteSurvey() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('encuesta')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SURVEYS_KEY })
    },
  })
}

export function useSurveyStats() {
  return useQuery({
    queryKey: [...SURVEYS_KEY, 'stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('encuesta')
        .select('calificacion, respondida, aprobada_para_publica')

      if (error) throw error

      const total = data.length
      const respondidas = data.filter((s) => s.respondida).length
      const aprobadas = data.filter((s) => s.aprobada_para_publica).length
      const conCalificacion = data.filter((s) => s.calificacion != null)
      const promedioCalificacion = conCalificacion.length > 0
        ? conCalificacion.reduce((sum, s) => sum + (s.calificacion ?? 0), 0) / conCalificacion.length
        : 0

      // Distribution
      const distribucion: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      for (const s of conCalificacion) {
        const cal = s.calificacion ?? 0
        if (cal >= 1 && cal <= 5) distribucion[cal]++
      }

      return { total, respondidas, aprobadas, promedioCalificacion, distribucion, tasaRespuesta: total > 0 ? Math.round((respondidas / total) * 100) : 0 }
    },
  })
}
