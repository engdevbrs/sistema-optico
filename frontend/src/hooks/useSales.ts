import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Sale, SaleItem, DiscountRule, DiscountRuleFormData, SaleStatus } from '../types/sale'
import type { Prescription } from '../types/prescription'

const SALES_KEY = ['sales']

// ── Queries ─────────────────────────────────────────────

interface SalesFilters {
  search?: string
  status?: SaleStatus | ''
  dateFrom?: string
  dateTo?: string
}

export function useSales(filters?: SalesFilters) {
  return useQuery({
    queryKey: [...SALES_KEY, filters],
    queryFn: async (): Promise<Sale[]> => {
      let query = supabase
        .from('venta')
        .select(`
          *,
          paciente:paciente_id(id, nombre, email, telefono),
          admin:admin_id(id, nombre)
        `)
        .order('created_at', { ascending: false })

      if (filters?.status) {
        query = query.eq('estado', filters.status)
      }
      if (filters?.dateFrom) {
        query = query.gte('created_at', `${filters.dateFrom}T00:00:00`)
      }
      if (filters?.dateTo) {
        query = query.lte('created_at', `${filters.dateTo}T23:59:59`)
      }

      const { data, error } = await query
      if (error) throw error

      let results = data as Sale[]

      if (filters?.search && filters.search.trim()) {
        const term = filters.search.trim().toLowerCase()
        results = results.filter(
          (s) =>
            s.paciente?.nombre.toLowerCase().includes(term) ||
            s.paciente?.email.toLowerCase().includes(term)
        )
      }

      return results
    },
  })
}

export function useSale(id: string | undefined) {
  return useQuery({
    queryKey: [...SALES_KEY, id],
    queryFn: async (): Promise<Sale> => {
      const { data, error } = await supabase
        .from('venta')
        .select(`
          *,
          paciente:paciente_id(id, nombre, email, telefono),
          receta:receta_id(id, created_at),
          admin:admin_id(id, nombre)
        `)
        .eq('id', id!)
        .single()

      if (error) throw error

      // Fetch items separately with joins
      const { data: items, error: itemsError } = await supabase
        .from('venta_item')
        .select(`
          *,
          producto:producto_id(id, nombre, sku, stock_actual),
          regla_descuento:regla_descuento_id(id, nombre, porcentaje)
        `)
        .eq('venta_id', id!)
        .order('created_at')

      if (itemsError) throw itemsError

      return { ...data, items: items as SaleItem[] } as Sale
    },
    enabled: !!id,
  })
}

export function useDiscountRules(onlyActive = true) {
  return useQuery({
    queryKey: ['discount-rules', onlyActive],
    queryFn: async (): Promise<DiscountRule[]> => {
      let query = supabase
        .from('regla_descuento')
        .select(`
          *,
          categoria:categoria_id(id, nombre),
          proveedor:proveedor_id(id, nombre),
          producto:producto_id(id, nombre)
        `)
        .order('nivel')

      if (onlyActive) {
        query = query.eq('activo', true)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
    staleTime: 1000 * 60 * 30,
  })
}

export function usePatientPrescriptions(pacienteId: string | null) {
  return useQuery({
    queryKey: ['prescriptions', 'patient', pacienteId],
    queryFn: async (): Promise<Prescription[]> => {
      const { data, error } = await supabase
        .from('receta')
        .select('*')
        .eq('paciente_id', pacienteId!)
        .is('reemplaza_a', null)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!pacienteId,
  })
}

// ── Discount Rule Mutations ──────────────────────────────

const DISCOUNT_RULES_KEY = ['discount-rules']

export function useCreateDiscountRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (formData: DiscountRuleFormData) => {
      const { data, error } = await supabase
        .from('regla_descuento')
        .insert({
          nombre: formData.nombre,
          nivel: formData.nivel,
          porcentaje: formData.porcentaje,
          categoria_id: formData.categoria_id || null,
          proveedor_id: formData.proveedor_id || null,
          producto_id: formData.producto_id || null,
          fecha_inicio: formData.fecha_inicio || null,
          fecha_fin: formData.fecha_fin || null,
          activo: formData.activo,
        })
        .select()
        .single()

      if (error) throw error
      return data as DiscountRule
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DISCOUNT_RULES_KEY })
    },
  })
}

export function useUpdateDiscountRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...formData }: DiscountRuleFormData & { id: string }) => {
      const { data, error } = await supabase
        .from('regla_descuento')
        .update({
          nombre: formData.nombre,
          nivel: formData.nivel,
          porcentaje: formData.porcentaje,
          categoria_id: formData.categoria_id || null,
          proveedor_id: formData.proveedor_id || null,
          producto_id: formData.producto_id || null,
          fecha_inicio: formData.fecha_inicio || null,
          fecha_fin: formData.fecha_fin || null,
          activo: formData.activo,
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as DiscountRule
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DISCOUNT_RULES_KEY })
    },
  })
}

export function useDeleteDiscountRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('regla_descuento')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DISCOUNT_RULES_KEY })
    },
  })
}

// ── Sale Mutations ──────────────────────────────────────

export function useCreateSale() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      paciente_id,
      verificacion,
    }: {
      paciente_id: string
      verificacion: string
    }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      const { data: admin } = await supabase
        .from('admin')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      if (!admin) throw new Error('Admin no encontrado')

      const { data, error } = await supabase
        .from('venta')
        .insert({
          paciente_id,
          admin_id: admin.id,
          verificacion,
          estado: 'EN_PROGRESO',
          subtotal: 0,
          descuento_total: 0,
          total: 0,
        })
        .select()
        .single()

      if (error) throw error
      return data as Sale
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SALES_KEY })
    },
  })
}

export function useAddSaleItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      venta_id,
      producto_id,
      cantidad,
      precio_unitario,
      descuento_porcentaje,
      descuento_monto,
      subtotal,
      regla_descuento_id,
    }: {
      venta_id: string
      producto_id: string
      cantidad: number
      precio_unitario: number
      descuento_porcentaje: number
      descuento_monto: number
      subtotal: number
      regla_descuento_id: string | null
    }) => {
      // Insert sale item
      const { data: item, error: itemError } = await supabase
        .from('venta_item')
        .insert({
          venta_id,
          producto_id,
          cantidad,
          precio_unitario,
          descuento_porcentaje,
          descuento_monto,
          subtotal,
          regla_descuento_id,
        })
        .select()
        .single()

      if (itemError) throw itemError

      // Create stock reservation (15 min expiry)
      const expiraAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()
      const { error: resError } = await supabase
        .from('reserva_stock_temporal')
        .insert({
          producto_id,
          venta_id,
          cantidad,
          expira_at: expiraAt,
          liberada: false,
        })

      if (resError) throw resError

      // Recalculate sale totals
      await recalculateSaleTotals(venta_id)

      return item
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...SALES_KEY, variables.venta_id] })
    },
  })
}

export function useRemoveSaleItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      item_id,
      venta_id,
      producto_id,
    }: {
      item_id: string
      venta_id: string
      producto_id: string
    }) => {
      // Delete the item
      const { error: delError } = await supabase
        .from('venta_item')
        .delete()
        .eq('id', item_id)

      if (delError) throw delError

      // Release stock reservation
      const { error: resError } = await supabase
        .from('reserva_stock_temporal')
        .update({ liberada: true })
        .eq('venta_id', venta_id)
        .eq('producto_id', producto_id)
        .eq('liberada', false)

      if (resError) throw resError

      // Recalculate totals
      await recalculateSaleTotals(venta_id)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...SALES_KEY, variables.venta_id] })
    },
  })
}

export function useCompleteSale() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      venta_id,
      metodo_pago,
      monto_pagado,
      vuelto,
      receta_id,
      motivo_sin_receta,
      notas,
    }: {
      venta_id: string
      metodo_pago: string
      monto_pagado: number
      vuelto: number
      receta_id: string | null
      motivo_sin_receta: string | null
      notas: string | null
    }) => {
      // Update sale status only if still EN_PROGRESO (prevents double completion)
      const { data: updatedSale, error: saleError } = await supabase
        .from('venta')
        .update({
          estado: 'COMPLETADA',
          metodo_pago,
          monto_pagado,
          vuelto,
          receta_id,
          motivo_sin_receta,
          notas,
        })
        .eq('id', venta_id)
        .eq('estado', 'EN_PROGRESO')
        .select('id')

      if (saleError) throw saleError
      if (!updatedSale || updatedSale.length === 0) {
        throw new Error('Esta venta ya fue completada o anulada')
      }

      // Get admin
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')
      const { data: admin } = await supabase.from('admin').select('id').eq('auth_user_id', user.id).single()

      // Get sale items
      const { data: items, error: itemsError } = await supabase
        .from('venta_item')
        .select('producto_id, cantidad')
        .eq('venta_id', venta_id)

      if (itemsError) throw itemsError

      // Decrement stock and create movements for each item
      for (const item of items) {
        const { data: product, error: pErr } = await supabase
          .from('producto')
          .select('stock_actual')
          .eq('id', item.producto_id)
          .single()

        if (pErr) throw pErr

        const stockNuevo = product.stock_actual - item.cantidad

        const { error: uErr } = await supabase
          .from('producto')
          .update({ stock_actual: Math.max(0, stockNuevo) })
          .eq('id', item.producto_id)

        if (uErr) throw uErr

        const { error: mErr } = await supabase.from('movimiento_stock').insert({
          producto_id: item.producto_id,
          tipo: 'SALIDA',
          cantidad: item.cantidad,
          stock_anterior: product.stock_actual,
          stock_nuevo: Math.max(0, stockNuevo),
          origen: 'VENTA',
          venta_id,
          creado_por: admin?.id,
        })

        if (mErr) throw mErr
      }

      // Release all reservations
      const { error: resError } = await supabase
        .from('reserva_stock_temporal')
        .update({ liberada: true })
        .eq('venta_id', venta_id)

      if (resError) throw resError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SALES_KEY })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] })
    },
  })
}

export function useCancelSale() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (venta_id: string) => {
      // Get current sale status
      const { data: sale, error: fetchError } = await supabase
        .from('venta')
        .select('estado')
        .eq('id', venta_id)
        .single()

      if (fetchError) throw fetchError
      if (sale.estado === 'ANULADA') throw new Error('Esta venta ya fue anulada')

      // Get admin
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')
      const { data: admin } = await supabase.from('admin').select('id').eq('auth_user_id', user.id).single()

      // Only return stock if sale was COMPLETADA (stock was already deducted)
      if (sale.estado === 'COMPLETADA') {
        const { data: items, error: itemsError } = await supabase
          .from('venta_item')
          .select('producto_id, cantidad')
          .eq('venta_id', venta_id)

        if (itemsError) throw itemsError

        for (const item of items) {
          const { data: product, error: pErr } = await supabase
            .from('producto')
            .select('stock_actual')
            .eq('id', item.producto_id)
            .single()

          if (pErr) throw pErr

          const stockNuevo = product.stock_actual + item.cantidad

          const { error: uErr } = await supabase
            .from('producto')
            .update({ stock_actual: stockNuevo })
            .eq('id', item.producto_id)

          if (uErr) throw uErr

          const { error: mErr } = await supabase.from('movimiento_stock').insert({
            producto_id: item.producto_id,
            tipo: 'ENTRADA',
            cantidad: item.cantidad,
            stock_anterior: product.stock_actual,
            stock_nuevo: stockNuevo,
            origen: 'DEVOLUCION',
            venta_id,
            creado_por: admin?.id,
          })

          if (mErr) throw mErr
        }
      }

      // Release any pending reservations
      await supabase
        .from('reserva_stock_temporal')
        .update({ liberada: true })
        .eq('venta_id', venta_id)
        .eq('liberada', false)

      // Update sale status
      const { error: saleError } = await supabase
        .from('venta')
        .update({ estado: 'ANULADA' })
        .eq('id', venta_id)

      if (saleError) throw saleError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SALES_KEY })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] })
    },
  })
}

// ── Helpers ─────────────────────────────────────────────

export async function recalculateSaleTotals(ventaId: string) {
  const { data: items, error } = await supabase
    .from('venta_item')
    .select('precio_unitario, cantidad, descuento_monto, subtotal')
    .eq('venta_id', ventaId)

  if (error) throw error

  const subtotal = items.reduce((acc, i) => acc + i.precio_unitario * i.cantidad, 0)
  const descuento_total = items.reduce((acc, i) => acc + i.descuento_monto, 0)
  const total = items.reduce((acc, i) => acc + i.subtotal, 0)

  const { error: updateError } = await supabase
    .from('venta')
    .update({ subtotal, descuento_total, total })
    .eq('id', ventaId)

  if (updateError) throw updateError
}
