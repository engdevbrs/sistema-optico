import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Config, ConfigFormData, SupplierFormData, CategoryFormData } from '../types/config'
import type { Supplier, Category } from '../types/product'
import type { WeeklySchedule } from '../types/appointment'

// === CONFIGURACIÓN ===

export function useConfig() {
  return useQuery({
    queryKey: ['config'],
    queryFn: async (): Promise<Config> => {
      const { data, error } = await supabase.from('configuracion').select('*').single()
      if (error) throw error
      return data
    },
    staleTime: 1000 * 60 * 10,
  })
}

export function useUpdateConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...formData }: ConfigFormData & { id: string }) => {
      const { error } = await supabase.from('configuracion').update(formData).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config'] })
    },
  })
}

// === HORARIOS ===

export function useSchedule() {
  return useQuery({
    queryKey: ['schedule'],
    queryFn: async (): Promise<WeeklySchedule[]> => {
      const { data, error } = await supabase.from('horario_semanal').select('*').order('dia_semana')
      if (error) throw error
      return data
    },
  })
}

export function useUpdateSchedule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (schedules: { id: string; activo: boolean; hora_inicio: string; hora_fin: string }[]) => {
      for (const s of schedules) {
        const { error } = await supabase
          .from('horario_semanal')
          .update({ activo: s.activo, hora_inicio: s.hora_inicio, hora_fin: s.hora_fin })
          .eq('id', s.id)
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] })
      queryClient.invalidateQueries({ queryKey: ['weekly-schedule'] })
    },
  })
}

// === PROVEEDORES ===

export function useSuppliersList() {
  return useQuery({
    queryKey: ['suppliers-all'],
    queryFn: async (): Promise<Supplier[]> => {
      const { data, error } = await supabase.from('proveedor').select('*').order('nombre')
      if (error) throw error
      return data
    },
  })
}

export function useCreateSupplier() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (formData: SupplierFormData) => {
      const { data, error } = await supabase
        .from('proveedor')
        .insert({
          nombre: formData.nombre,
          tipo: formData.tipo ?? 'INTERNACIONAL',
          url_alibaba: formData.url_alibaba || null,
          tiempo_entrega_dias: formData.tiempo_entrega_dias ?? null,
          multiplicador: formData.multiplicador ?? null,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers-all'] })
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
    },
  })
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...formData }: SupplierFormData & { id: string }) => {
      const { error } = await supabase
        .from('proveedor')
        .update({
          nombre: formData.nombre,
          tipo: formData.tipo ?? 'INTERNACIONAL',
          url_alibaba: formData.url_alibaba || null,
          tiempo_entrega_dias: formData.tiempo_entrega_dias ?? null,
          multiplicador: formData.multiplicador ?? null,
        })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers-all'] })
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
    },
  })
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('proveedor').update({ activo: false }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers-all'] })
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
    },
  })
}

// === CATEGORÍAS ===

export function useCategoriesList() {
  return useQuery({
    queryKey: ['categories-all'],
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from('categoria')
        .select('*')
        .order('nombre')
      if (error) throw error
      return data
    },
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (formData: CategoryFormData) => {
      const { data, error } = await supabase
        .from('categoria')
        .insert({
          nombre: formData.nombre,
          multiplicador: formData.multiplicador ?? null,
          umbral_stock_medio: formData.umbral_stock_medio ?? null,
          umbral_stock_minimo: formData.umbral_stock_minimo ?? null,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories-all'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...formData }: CategoryFormData & { id: string }) => {
      const { error } = await supabase
        .from('categoria')
        .update({
          nombre: formData.nombre,
          multiplicador: formData.multiplicador ?? null,
          umbral_stock_medio: formData.umbral_stock_medio ?? null,
          umbral_stock_minimo: formData.umbral_stock_minimo ?? null,
        })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories-all'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}
