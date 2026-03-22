import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

interface SalesReport {
  totalVentas: number
  cantidadVentas: number
  ticketPromedio: number
  descuentoTotal: number
  ventasPorDia: { fecha: string; total: number; cantidad: number }[]
  ventasPorMetodoPago: { metodo: string; total: number; cantidad: number }[]
}

interface ProductsReport {
  topProductos: { id: string; nombre: string; cantidad: number; ingresos: number }[]
  topCategorias: { nombre: string; cantidad: number; ingresos: number }[]
}

interface PatientsReport {
  totalPacientes: number
  nuevosEsteMes: number
  conReceta: number
  conCompra: number
}

export function useSalesReport(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: ['reports', 'sales', dateFrom, dateTo],
    queryFn: async (): Promise<SalesReport> => {
      const { data: ventas, error } = await supabase
        .from('venta')
        .select('total, descuento_total, metodo_pago, created_at')
        .eq('estado', 'COMPLETADA')
        .gte('created_at', `${dateFrom}T00:00:00`)
        .lte('created_at', `${dateTo}T23:59:59.999`)

      if (error) throw error

      const totalVentas = ventas.reduce((s, v) => s + Number(v.total), 0)
      const cantidadVentas = ventas.length
      const ticketPromedio = cantidadVentas > 0 ? Math.round(totalVentas / cantidadVentas) : 0
      const descuentoTotal = ventas.reduce((s, v) => s + Number(v.descuento_total), 0)

      // Group by day
      const byDay = new Map<string, { total: number; cantidad: number }>()
      for (const v of ventas) {
        const fecha = v.created_at.split('T')[0]
        const existing = byDay.get(fecha) ?? { total: 0, cantidad: 0 }
        existing.total += Number(v.total)
        existing.cantidad += 1
        byDay.set(fecha, existing)
      }
      const ventasPorDia = Array.from(byDay.entries())
        .map(([fecha, data]) => ({ fecha, ...data }))
        .sort((a, b) => a.fecha.localeCompare(b.fecha))

      // Group by payment method
      const byMethod = new Map<string, { total: number; cantidad: number }>()
      for (const v of ventas) {
        const metodo = v.metodo_pago ?? 'SIN DEFINIR'
        const existing = byMethod.get(metodo) ?? { total: 0, cantidad: 0 }
        existing.total += Number(v.total)
        existing.cantidad += 1
        byMethod.set(metodo, existing)
      }
      const ventasPorMetodoPago = Array.from(byMethod.entries())
        .map(([metodo, data]) => ({ metodo, ...data }))
        .sort((a, b) => b.total - a.total)

      return { totalVentas, cantidadVentas, ticketPromedio, descuentoTotal, ventasPorDia, ventasPorMetodoPago }
    },
    enabled: !!dateFrom && !!dateTo,
  })
}

export function useProductsReport(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: ['reports', 'products', dateFrom, dateTo],
    queryFn: async (): Promise<ProductsReport> => {
      // Get all sale items in the period
      const { data: ventas, error: vErr } = await supabase
        .from('venta')
        .select('id')
        .eq('estado', 'COMPLETADA')
        .gte('created_at', `${dateFrom}T00:00:00`)
        .lte('created_at', `${dateTo}T23:59:59.999`)

      if (vErr) throw vErr

      const ventaIds = ventas.map((v) => v.id)
      if (ventaIds.length === 0) return { topProductos: [], topCategorias: [] }

      const { data: items, error: iErr } = await supabase
        .from('venta_item')
        .select('producto_id, cantidad, subtotal, producto:producto_id(id, nombre, categoria_id)')
        .in('venta_id', ventaIds)

      if (iErr) throw iErr

      // Top products
      const productMap = new Map<string, { nombre: string; cantidad: number; ingresos: number; categoria_id: string }>()
      for (const item of items) {
        const prod = item.producto as unknown as { id: string; nombre: string; categoria_id: string }
        const existing = productMap.get(item.producto_id) ?? { nombre: prod?.nombre ?? '—', cantidad: 0, ingresos: 0, categoria_id: prod?.categoria_id ?? '' }
        existing.cantidad += item.cantidad
        existing.ingresos += Number(item.subtotal)
        productMap.set(item.producto_id, existing)
      }
      const topProductos = Array.from(productMap.entries())
        .map(([id, data]) => ({ id, nombre: data.nombre, cantidad: data.cantidad, ingresos: data.ingresos }))
        .sort((a, b) => b.ingresos - a.ingresos)
        .slice(0, 10)

      // Fetch category names
      const categoryIds = [...new Set(Array.from(productMap.values()).map((p) => p.categoria_id).filter(Boolean))]
      const { data: categories } = await supabase
        .from('categoria')
        .select('id, nombre')
        .in('id', categoryIds)

      const catNameMap = new Map<string, string>()
      for (const c of categories ?? []) catNameMap.set(c.id, c.nombre)

      // Top categories
      const catMap = new Map<string, { nombre: string; cantidad: number; ingresos: number }>()
      for (const [, data] of productMap) {
        const catName = catNameMap.get(data.categoria_id) ?? 'Sin categoría'
        const existing = catMap.get(catName) ?? { nombre: catName, cantidad: 0, ingresos: 0 }
        existing.cantidad += data.cantidad
        existing.ingresos += data.ingresos
        catMap.set(catName, existing)
      }
      const topCategorias = Array.from(catMap.values()).sort((a, b) => b.ingresos - a.ingresos)

      return { topProductos, topCategorias }
    },
    enabled: !!dateFrom && !!dateTo,
  })
}

export function usePatientsReport() {
  return useQuery({
    queryKey: ['reports', 'patients'],
    queryFn: async (): Promise<PatientsReport> => {
      const monthStart = new Date().toISOString().slice(0, 7) + '-01'

      const [totalRes, newRes, recetaRes, compraRes] = await Promise.all([
        supabase.from('paciente').select('id', { count: 'exact', head: true }).eq('eliminado', false),
        supabase.from('paciente').select('id', { count: 'exact', head: true }).eq('eliminado', false).gte('created_at', `${monthStart}T00:00:00`),
        supabase.from('receta').select('paciente_id').is('reemplaza_a', null),
        supabase.from('venta').select('paciente_id').eq('estado', 'COMPLETADA'),
      ])

      const uniqueReceta = new Set((recetaRes.data ?? []).map((r) => r.paciente_id))
      const uniqueCompra = new Set((compraRes.data ?? []).map((v) => v.paciente_id))

      return {
        totalPacientes: totalRes.count ?? 0,
        nuevosEsteMes: newRes.count ?? 0,
        conReceta: uniqueReceta.size,
        conCompra: uniqueCompra.size,
      }
    },
  })
}
