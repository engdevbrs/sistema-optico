import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Order, OrderItem, OrderStatus } from '../types/order'

const ORDERS_KEY = ['orders']

// ── Queries ─────────────────────────────────────────────

export function useOrders(status?: OrderStatus | '') {
  return useQuery({
    queryKey: [...ORDERS_KEY, status],
    queryFn: async (): Promise<Order[]> => {
      let query = supabase
        .from('pedido')
        .select(`
          *,
          proveedor:proveedor_id(id, nombre),
          admin:creado_por(id, nombre)
        `)
        .order('created_at', { ascending: false })

      if (status) {
        query = query.eq('estado', status)
      }

      const { data, error } = await query
      if (error) throw error
      return data as Order[]
    },
  })
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: [...ORDERS_KEY, id],
    queryFn: async (): Promise<Order> => {
      const { data, error } = await supabase
        .from('pedido')
        .select(`
          *,
          proveedor:proveedor_id(id, nombre),
          admin:creado_por(id, nombre)
        `)
        .eq('id', id!)
        .single()

      if (error) throw error

      const { data: items, error: itemsError } = await supabase
        .from('pedido_item')
        .select(`
          *,
          producto:producto_id(id, nombre, sku, stock_actual)
        `)
        .eq('pedido_id', id!)
        .order('created_at')

      if (itemsError) throw itemsError

      return { ...data, items: items as OrderItem[] } as Order
    },
    enabled: !!id,
  })
}

// ── Mutations ───────────────────────────────────────────

export function useCreateOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      proveedor_id,
      notas,
      items,
      tipo_cambio,
      costos_internacion,
    }: {
      proveedor_id: string
      notas: string | null
      items: { producto_id: string; cantidad: number; precio_unitario_usd: number }[]
      tipo_cambio: number
      costos_internacion?: {
        costo_envio_usd: number
        seguro_usd: number
        cif_usd: number
        arancel_usd: number
        iva_importacion_usd: number
        total_landed_usd: number
        total_landed_clp: number
      }
    }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')
      const { data: admin } = await supabase.from('admin').select('id').eq('auth_user_id', user.id).single()
      if (!admin) throw new Error('Admin no encontrado')

      const total_usd = items.reduce((sum, i) => sum + i.precio_unitario_usd * i.cantidad, 0)
      const total_clp = Math.round(total_usd * tipo_cambio)

      const { data: order, error } = await supabase
        .from('pedido')
        .insert({
          proveedor_id,
          estado: 'BORRADOR',
          total_usd,
          total_clp,
          tipo_cambio_usado: tipo_cambio,
          notas: notas || null,
          creado_por: admin.id,
          ...(costos_internacion ?? {}),
        })
        .select()
        .single()

      if (error) throw error

      // Insert items
      const orderItems = items.map((i) => ({
        pedido_id: order.id,
        producto_id: i.producto_id,
        cantidad_pedida: i.cantidad,
        cantidad_recibida: 0,
        precio_unitario_usd: i.precio_unitario_usd,
      }))

      const { error: itemsError } = await supabase.from('pedido_item').insert(orderItems)
      if (itemsError) throw itemsError

      return order as Order
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDERS_KEY })
    },
  })
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      estado,
      fecha_envio,
      fecha_recepcion_estimada,
    }: {
      id: string
      estado: OrderStatus
      fecha_envio?: string | null
      fecha_recepcion_estimada?: string | null
    }) => {
      const updates: Record<string, unknown> = { estado }
      if (fecha_envio !== undefined) updates.fecha_envio = fecha_envio
      if (fecha_recepcion_estimada !== undefined) updates.fecha_recepcion_estimada = fecha_recepcion_estimada

      const { error } = await supabase.from('pedido').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDERS_KEY })
    },
  })
}

export function useReceiveOrderItems() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      pedido_id,
      items,
    }: {
      pedido_id: string
      items: { item_id: string; producto_id: string; cantidad_recibida: number }[]
    }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')
      const { data: admin } = await supabase.from('admin').select('id').eq('auth_user_id', user.id).single()

      for (const item of items) {
        if (item.cantidad_recibida <= 0) continue

        // Update pedido_item
        const { data: currentItem, error: fetchErr } = await supabase
          .from('pedido_item')
          .select('cantidad_recibida')
          .eq('id', item.item_id)
          .single()

        if (fetchErr) throw fetchErr

        const newRecibida = (currentItem.cantidad_recibida ?? 0) + item.cantidad_recibida

        const { error: updateErr } = await supabase
          .from('pedido_item')
          .update({ cantidad_recibida: newRecibida })
          .eq('id', item.item_id)

        if (updateErr) throw updateErr

        // Update product stock
        const { data: product, error: pErr } = await supabase
          .from('producto')
          .select('stock_actual')
          .eq('id', item.producto_id)
          .single()

        if (pErr) throw pErr

        const stockNuevo = product.stock_actual + item.cantidad_recibida

        const { error: uErr } = await supabase
          .from('producto')
          .update({ stock_actual: stockNuevo })
          .eq('id', item.producto_id)

        if (uErr) throw uErr

        // Create stock movement
        const { error: mErr } = await supabase.from('movimiento_stock').insert({
          producto_id: item.producto_id,
          tipo: 'ENTRADA',
          cantidad: item.cantidad_recibida,
          stock_anterior: product.stock_actual,
          stock_nuevo: stockNuevo,
          origen: 'PEDIDO',
          creado_por: admin?.id,
        })

        if (mErr) throw mErr
      }

      // Check if all items fully received
      const { data: allItems, error: checkErr } = await supabase
        .from('pedido_item')
        .select('cantidad_pedida, cantidad_recibida')
        .eq('pedido_id', pedido_id)

      if (checkErr) throw checkErr

      const allReceived = allItems.every((i) => i.cantidad_recibida >= i.cantidad_pedida)
      const someReceived = allItems.some((i) => i.cantidad_recibida > 0)

      const newEstado = allReceived ? 'RECIBIDO' : someReceived ? 'RECIBIDO_PARCIAL' : undefined

      if (newEstado) {
        const updates: Record<string, unknown> = { estado: newEstado }
        if (newEstado === 'RECIBIDO') updates.fecha_recepcion_real = new Date().toISOString().split('T')[0]

        await supabase.from('pedido').update(updates).eq('id', pedido_id)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDERS_KEY })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] })
    },
  })
}

