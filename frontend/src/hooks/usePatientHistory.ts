import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export interface PatientAppointment {
  id: string
  fecha: string
  hora_inicio: string
  hora_fin: string
  estado: string
  tipo_cita?: { nombre: string }
}

export interface PatientSale {
  id: string
  total: number
  estado: string
  metodo_pago: string | null
  created_at: string
  items_count: number
}

export function usePatientAppointments(pacienteId: string | undefined) {
  return useQuery({
    queryKey: ['patient-appointments', pacienteId],
    queryFn: async (): Promise<PatientAppointment[]> => {
      const { data, error } = await supabase
        .from('cita')
        .select('id, fecha, hora_inicio, hora_fin, estado, tipo_cita:tipo_cita_id(nombre)')
        .eq('paciente_id', pacienteId!)
        .order('fecha', { ascending: false })
        .order('hora_inicio', { ascending: false })
        .limit(20)

      if (error) throw error
      return (data ?? []).map((item) => ({
        ...item,
        tipo_cita: Array.isArray(item.tipo_cita) ? item.tipo_cita[0] : item.tipo_cita,
      })) as PatientAppointment[]
    },
    enabled: !!pacienteId,
  })
}

export function usePatientSales(pacienteId: string | undefined) {
  return useQuery({
    queryKey: ['patient-sales', pacienteId],
    queryFn: async (): Promise<PatientSale[]> => {
      const { data: ventas, error } = await supabase
        .from('venta')
        .select('id, total, estado, metodo_pago, created_at')
        .eq('paciente_id', pacienteId!)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error

      // Get item counts
      const ventaIds = ventas.map((v) => v.id)
      if (ventaIds.length === 0) return []

      const { data: items, error: itemsErr } = await supabase
        .from('venta_item')
        .select('venta_id')
        .in('venta_id', ventaIds)

      if (itemsErr) throw itemsErr

      const countMap = new Map<string, number>()
      for (const item of items) {
        countMap.set(item.venta_id, (countMap.get(item.venta_id) ?? 0) + 1)
      }

      return ventas.map((v) => ({
        ...v,
        items_count: countMap.get(v.id) ?? 0,
      })) as PatientSale[]
    },
    enabled: !!pacienteId,
  })
}
