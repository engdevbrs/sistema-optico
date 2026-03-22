import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Product, ProductFormData, Category, Supplier, StockMovement } from '../types/product'

const PRODUCTS_KEY = ['products']

export function useProducts(search?: string) {
  return useQuery({
    queryKey: [...PRODUCTS_KEY, search],
    queryFn: async (): Promise<Product[]> => {
      let query = supabase
        .from('producto')
        .select(`*, categoria:categoria_id(id, nombre, multiplicador, umbral_stock_medio, umbral_stock_minimo), proveedor:proveedor_id(id, nombre, tipo, multiplicador)`)
        .eq('eliminado', false)
        .order('nombre')

      if (search && search.trim()) {
        query = query.or(`nombre.ilike.%${search.trim()}%,sku.ilike.%${search.trim()}%`)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: [...PRODUCTS_KEY, id],
    queryFn: async (): Promise<Product> => {
      const { data, error } = await supabase
        .from('producto')
        .select(`*, categoria:categoria_id(id, nombre, multiplicador, umbral_stock_medio, umbral_stock_minimo), proveedor:proveedor_id(id, nombre, tipo, multiplicador)`)
        .eq('id', id!)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from('categoria')
        .select('*')
        .eq('activo', true)
        .order('nombre')

      if (error) throw error
      return data
    },
    staleTime: 1000 * 60 * 30,
  })
}

export function useSuppliers() {
  return useQuery({
    queryKey: ['suppliers'],
    queryFn: async (): Promise<Supplier[]> => {
      const { data, error } = await supabase
        .from('proveedor')
        .select('*')
        .eq('activo', true)
        .order('nombre')

      if (error) throw error
      return data
    },
    staleTime: 1000 * 60 * 30,
  })
}

export function useStockMovements(productId: string | undefined) {
  return useQuery({
    queryKey: ['stock-movements', productId],
    queryFn: async (): Promise<StockMovement[]> => {
      const { data, error } = await supabase
        .from('movimiento_stock')
        .select('*')
        .eq('producto_id', productId!)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      return data
    },
    enabled: !!productId,
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (formData: ProductFormData & { precio_compra_clp?: number | null }) => {
      const { data, error } = await supabase
        .from('producto')
        .insert({
          nombre: formData.nombre,
          sku: formData.sku || null,
          categoria_id: formData.categoria_id,
          proveedor_id: formData.proveedor_id || null,
          precio_compra_usd: formData.precio_compra_usd ?? null,
          precio_compra_clp: formData.precio_compra_clp ?? null,
          precio_venta_fijo: formData.precio_venta_fijo ?? null,
          multiplicador: formData.multiplicador ?? null,
          stock_actual: formData.stock_actual ?? 0,
          stock_optimo: formData.stock_optimo ?? null,
          umbral_stock_medio: formData.umbral_stock_medio ?? null,
          umbral_stock_minimo: formData.umbral_stock_minimo ?? null,
          alibaba_product_url: formData.alibaba_product_url || null,
          descripcion: formData.descripcion || null,
        })
        .select()
        .single()

      if (error) throw error
      return data as Product
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY })
    },
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...formData }: ProductFormData & { id: string; precio_compra_clp?: number | null }) => {
      const { data, error } = await supabase
        .from('producto')
        .update({
          nombre: formData.nombre,
          sku: formData.sku || null,
          categoria_id: formData.categoria_id,
          proveedor_id: formData.proveedor_id || null,
          precio_compra_usd: formData.precio_compra_usd ?? null,
          precio_compra_clp: formData.precio_compra_clp ?? null,
          precio_venta_fijo: formData.precio_venta_fijo ?? null,
          multiplicador: formData.multiplicador ?? null,
          stock_actual: formData.stock_actual ?? 0,
          stock_optimo: formData.stock_optimo ?? null,
          umbral_stock_medio: formData.umbral_stock_medio ?? null,
          umbral_stock_minimo: formData.umbral_stock_minimo ?? null,
          alibaba_product_url: formData.alibaba_product_url || null,
          descripcion: formData.descripcion || null,
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Product
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY })
      queryClient.setQueryData([...PRODUCTS_KEY, data.id], data)
    },
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('producto')
        .update({ eliminado: true, eliminado_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY })
    },
  })
}

export function useAdjustStock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      productId,
      tipo,
      cantidad,
      nota,
    }: {
      productId: string
      tipo: 'ENTRADA' | 'SALIDA'
      cantidad: number
      nota?: string
    }) => {
      // Obtener stock actual
      const { data: product, error: pErr } = await supabase
        .from('producto')
        .select('stock_actual')
        .eq('id', productId)
        .single()

      if (pErr) throw pErr

      const stockAnterior = product.stock_actual
      const stockNuevo = tipo === 'ENTRADA' ? stockAnterior + cantidad : stockAnterior - cantidad

      if (stockNuevo < 0) throw new Error('Stock insuficiente')

      // Obtener admin
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')
      const { data: admin } = await supabase.from('admin').select('id').eq('auth_user_id', user.id).single()

      // Actualizar stock
      const { error: uErr } = await supabase
        .from('producto')
        .update({ stock_actual: stockNuevo })
        .eq('id', productId)

      if (uErr) throw uErr

      // Registrar movimiento
      const { error: mErr } = await supabase.from('movimiento_stock').insert({
        producto_id: productId,
        tipo,
        cantidad,
        stock_anterior: stockAnterior,
        stock_nuevo: stockNuevo,
        origen: 'MANUAL',
        nota: nota || null,
        creado_por: admin?.id,
      })

      if (mErr) throw mErr
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY })
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] })
    },
  })
}
