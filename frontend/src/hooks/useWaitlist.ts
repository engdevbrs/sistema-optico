import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { WaitlistEntry, WaitlistStatus } from '../types/waitlist'

const WAITLIST_KEY = ['waitlist']

export function useWaitlist(status?: WaitlistStatus | '') {
  return useQuery({
    queryKey: [...WAITLIST_KEY, status],
    queryFn: async (): Promise<WaitlistEntry[]> => {
      let query = supabase
        .from('lista_espera')
        .select(`
          *,
          paciente:paciente_id(id, nombre, email, telefono),
          tipo_cita:tipo_cita_id(id, nombre)
        `)
        .order('created_at', { ascending: true })

      if (status) {
        query = query.eq('estado', status)
      }

      const { data, error } = await query
      if (error) throw error
      return data as WaitlistEntry[]
    },
  })
}

export function useAddToWaitlist() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      paciente_id,
      tipo_cita_id,
      fecha_preferida,
    }: {
      paciente_id: string
      tipo_cita_id: string
      fecha_preferida: string | null
    }) => {
      const { data, error } = await supabase
        .from('lista_espera')
        .insert({
          paciente_id,
          tipo_cita_id,
          fecha_preferida: fecha_preferida || null,
          estado: 'ESPERANDO',
        })
        .select()
        .single()

      if (error) throw error
      return data as WaitlistEntry
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WAITLIST_KEY })
    },
  })
}

export function useUpdateWaitlistStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      estado,
    }: {
      id: string
      estado: WaitlistStatus
    }) => {
      const updates: Record<string, unknown> = { estado }
      if (estado === 'NOTIFICADO') {
        updates.notificado_at = new Date().toISOString()
        // Expires in 24 hours
        updates.expira_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }

      const { error } = await supabase
        .from('lista_espera')
        .update(updates)
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WAITLIST_KEY })
    },
  })
}

export function useDeleteWaitlistEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('lista_espera')
        .update({ estado: 'REMOVIDO' })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WAITLIST_KEY })
    },
  })
}
