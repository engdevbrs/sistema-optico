import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export interface DashboardStats {
  appointmentsToday: number
  totalPatients: number
  salesToday: number
  salesCountToday: number
  salesThisMonth: number
  salesCountThisMonth: number
  totalProducts: number
  lowStockCount: number
  recentSales: {
    id: string
    total: number
    created_at: string
    paciente: { nombre: string } | null
  }[]
  topProducts: {
    producto_id: string
    nombre: string
    total_vendido: number
  }[]
  todayAppointments: {
    id: string
    fecha: string
    hora_inicio: string
    hora_fin: string
    estado: string
    paciente: { nombre: string } | null
    tipo_cita: { nombre: string } | null
  }[]
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const today = new Date().toISOString().split('T')[0]
      const monthStart = today.slice(0, 7) + '-01'

      const [
        appointmentsRes,
        patientsRes,
        salesTodayRes,
        salesMonthRes,
        productsRes,
        lowStockRes,
        recentSalesRes,
        topProductsRes,
        todayAppointmentsRes,
      ] = await Promise.all([
        // Citas hoy
        supabase
          .from('cita')
          .select('id', { count: 'exact', head: true })
          .eq('fecha', today)
          .not('estado', 'in', '(CANCELADA,NO_ASISTIO)'),
        // Total pacientes
        supabase
          .from('paciente')
          .select('id', { count: 'exact', head: true })
          .eq('eliminado', false),
        // Ventas hoy
        supabase
          .from('venta')
          .select('total')
          .eq('estado', 'COMPLETADA')
          .gte('created_at', `${today}T00:00:00`)
          .lte('created_at', `${today}T23:59:59.999`),
        // Ventas del mes
        supabase
          .from('venta')
          .select('total')
          .eq('estado', 'COMPLETADA')
          .gte('created_at', `${monthStart}T00:00:00`),
        // Total productos
        supabase
          .from('producto')
          .select('id', { count: 'exact', head: true })
          .eq('eliminado', false),
        // Stock bajo (stock_actual <= umbral_stock_minimo o <= 3 por defecto)
        supabase
          .from('producto')
          .select('id', { count: 'exact', head: true })
          .eq('eliminado', false)
          .lte('stock_actual', 3),
        // Últimas 5 ventas
        supabase
          .from('venta')
          .select('id, total, created_at, paciente:paciente_id(nombre)')
          .eq('estado', 'COMPLETADA')
          .order('created_at', { ascending: false })
          .limit(5),
        // Top 5 productos más vendidos (por cantidad)
        supabase
          .from('venta_item')
          .select('producto_id, cantidad, producto:producto_id(nombre)')
          .limit(500),
        // Citas de hoy con detalle
        supabase
          .from('cita')
          .select('id, fecha, hora_inicio, hora_fin, estado, paciente:paciente_id(nombre), tipo_cita:tipo_cita_id(nombre)')
          .eq('fecha', today)
          .not('estado', 'in', '(CANCELADA,NO_ASISTIO)')
          .order('hora_inicio'),
      ])

      // Aggregate errors
      for (const res of [appointmentsRes, patientsRes, salesTodayRes, salesMonthRes, productsRes, lowStockRes, recentSalesRes, topProductsRes, todayAppointmentsRes]) {
        if (res.error) throw res.error
      }

      const salesToday = (salesTodayRes.data ?? []).reduce((sum, r) => sum + Number(r.total ?? 0), 0)
      const salesThisMonth = (salesMonthRes.data ?? []).reduce((sum, r) => sum + Number(r.total ?? 0), 0)

      // Aggregate top products
      const productMap = new Map<string, { nombre: string; total: number }>()
      for (const item of topProductsRes.data ?? []) {
        const nombre = (item.producto as unknown as { nombre: string })?.nombre ?? '—'
        const existing = productMap.get(item.producto_id)
        if (existing) {
          existing.total += item.cantidad
        } else {
          productMap.set(item.producto_id, { nombre, total: item.cantidad })
        }
      }
      const topProducts = Array.from(productMap.entries())
        .map(([id, { nombre, total }]) => ({ producto_id: id, nombre, total_vendido: total }))
        .sort((a, b) => b.total_vendido - a.total_vendido)
        .slice(0, 5)

      return {
        appointmentsToday: appointmentsRes.count ?? 0,
        totalPatients: patientsRes.count ?? 0,
        salesToday,
        salesCountToday: salesTodayRes.data?.length ?? 0,
        salesThisMonth,
        salesCountThisMonth: salesMonthRes.data?.length ?? 0,
        totalProducts: productsRes.count ?? 0,
        lowStockCount: lowStockRes.count ?? 0,
        recentSales: (recentSalesRes.data ?? []) as DashboardStats['recentSales'],
        topProducts,
        todayAppointments: (todayAppointmentsRes.data ?? []) as DashboardStats['todayAppointments'],
      }
    },
    staleTime: 1000 * 60 * 2,
  })
}
