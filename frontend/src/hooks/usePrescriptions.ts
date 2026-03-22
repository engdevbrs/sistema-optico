import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Prescription, PrescriptionFormData } from '../types/prescription'

const PRESCRIPTIONS_KEY = ['prescriptions']

export function usePrescriptions(search?: string) {
  return useQuery({
    queryKey: [...PRESCRIPTIONS_KEY, search],
    queryFn: async (): Promise<Prescription[]> => {
      let query = supabase
        .from('receta')
        .select(`*, paciente:paciente_id(id, nombre, email)`)
        .order('created_at', { ascending: false })

      if (search && search.trim()) {
        // Buscar por nombre del paciente requiere filtrar post-query
        // ya que Supabase no soporta filtros en relaciones con .or()
      }

      const { data, error } = await query
      if (error) throw error

      if (search && search.trim()) {
        const term = search.trim().toLowerCase()
        return data.filter(
          (r) =>
            r.paciente?.nombre?.toLowerCase().includes(term) ||
            r.paciente?.email?.toLowerCase().includes(term),
        )
      }

      return data
    },
  })
}

export function usePrescription(id: string | undefined) {
  return useQuery({
    queryKey: [...PRESCRIPTIONS_KEY, id],
    queryFn: async (): Promise<Prescription> => {
      const { data, error } = await supabase
        .from('receta')
        .select(`*, paciente:paciente_id(id, nombre, email)`)
        .eq('id', id!)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

export function usePatientPrescriptions(pacienteId: string | undefined) {
  return useQuery({
    queryKey: [...PRESCRIPTIONS_KEY, 'patient', pacienteId],
    queryFn: async (): Promise<Prescription[]> => {
      const { data, error } = await supabase
        .from('receta')
        .select('*')
        .eq('paciente_id', pacienteId!)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!pacienteId,
  })
}

export function useCreatePrescription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (formData: PrescriptionFormData) => {
      // Obtener admin actual
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      const { data: admin } = await supabase
        .from('admin')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      if (!admin) throw new Error('Admin no encontrado')

      const insertData: Record<string, unknown> = {
        paciente_id: formData.paciente_id,
        creado_por: admin.id,
      }

      if (formData.cita_id) insertData.cita_id = formData.cita_id
      if (formData.od_esfera != null) insertData.od_esfera = formData.od_esfera
      if (formData.od_cilindro != null) insertData.od_cilindro = formData.od_cilindro
      if (formData.od_eje != null) insertData.od_eje = formData.od_eje
      if (formData.od_adicion != null) insertData.od_adicion = formData.od_adicion
      if (formData.od_agudeza_visual) insertData.od_agudeza_visual = formData.od_agudeza_visual
      if (formData.oi_esfera != null) insertData.oi_esfera = formData.oi_esfera
      if (formData.oi_cilindro != null) insertData.oi_cilindro = formData.oi_cilindro
      if (formData.oi_eje != null) insertData.oi_eje = formData.oi_eje
      if (formData.oi_adicion != null) insertData.oi_adicion = formData.oi_adicion
      if (formData.oi_agudeza_visual) insertData.oi_agudeza_visual = formData.oi_agudeza_visual
      if (formData.distancia_pupilar != null) insertData.distancia_pupilar = formData.distancia_pupilar
      if (formData.observaciones) insertData.observaciones = formData.observaciones
      if (formData.proxima_revision) insertData.proxima_revision = formData.proxima_revision
      if (formData.reemplaza_a) insertData.reemplaza_a = formData.reemplaza_a

      const { data, error } = await supabase.from('receta').insert(insertData).select().single()

      if (error) throw error

      // Actualizar próxima revisión del paciente
      if (formData.proxima_revision) {
        await supabase
          .from('paciente')
          .update({ proxima_revision: formData.proxima_revision })
          .eq('id', formData.paciente_id)
      }

      return data as Prescription
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRESCRIPTIONS_KEY })
    },
  })
}
