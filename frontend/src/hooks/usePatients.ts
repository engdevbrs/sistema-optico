import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Patient, PatientFormData } from '../types/patient'

const PATIENTS_KEY = ['patients']

export function usePatients(search?: string) {
  return useQuery({
    queryKey: [...PATIENTS_KEY, search],
    queryFn: async (): Promise<Patient[]> => {
      let query = supabase
        .from('paciente')
        .select('*')
        .eq('eliminado', false)
        .order('created_at', { ascending: false })

      if (search && search.trim()) {
        query = query.or(
          `nombre.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%,telefono.ilike.%${search.trim()}%`,
        )
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}

export function usePatient(id: string | undefined) {
  return useQuery({
    queryKey: [...PATIENTS_KEY, id],
    queryFn: async (): Promise<Patient> => {
      const { data, error } = await supabase
        .from('paciente')
        .select('*')
        .eq('id', id!)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

export function useCreatePatient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (formData: PatientFormData) => {
      const { data, error } = await supabase
        .from('paciente')
        .insert({
          nombre: formData.nombre,
          email: formData.email,
          telefono: formData.telefono || null,
          fecha_nacimiento: formData.fecha_nacimiento || null,
          preferencia_contacto: formData.preferencia_contacto,
          notas: formData.notas || null,
        })
        .select()
        .single()

      if (error) throw error
      return data as Patient
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PATIENTS_KEY })
    },
  })
}

export function useUpdatePatient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...formData }: PatientFormData & { id: string }) => {
      const { data, error } = await supabase
        .from('paciente')
        .update({
          nombre: formData.nombre,
          email: formData.email,
          telefono: formData.telefono || null,
          fecha_nacimiento: formData.fecha_nacimiento || null,
          preferencia_contacto: formData.preferencia_contacto,
          notas: formData.notas || null,
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Patient
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: PATIENTS_KEY })
      queryClient.setQueryData([...PATIENTS_KEY, data.id], data)
    },
  })
}

export function useDeletePatient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      // Soft delete
      const { error } = await supabase
        .from('paciente')
        .update({ eliminado: true, eliminado_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PATIENTS_KEY })
    },
  })
}
