import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const EXCHANGE_API_URL = 'https://open.er-api.com/v6/latest/USD'

interface ExchangeApiResponse {
  result: string
  rates: Record<string, number>
}

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Obtener tipo de cambio desde API pública
    const response = await fetch(EXCHANGE_API_URL)
    if (!response.ok) {
      throw new Error(`API respondió con status ${response.status}`)
    }

    const data: ExchangeApiResponse = await response.json()
    if (data.result !== 'success' || !data.rates.CLP) {
      throw new Error('Respuesta inválida de la API de tipo de cambio')
    }

    const tasaActual = data.rates.CLP
    const hoy = new Date().toISOString().split('T')[0]

    // Obtener tasa anterior para comparar variación
    const { data: anterior } = await supabase
      .from('tipo_cambio')
      .select('tasa')
      .eq('moneda_origen', 'USD')
      .eq('moneda_destino', 'CLP')
      .order('fecha', { ascending: false })
      .limit(1)
      .single()

    // Upsert (insertar o actualizar si ya existe para hoy)
    const { error: upsertError } = await supabase
      .from('tipo_cambio')
      .upsert(
        {
          moneda_origen: 'USD',
          moneda_destino: 'CLP',
          tasa: tasaActual,
          fecha: hoy,
          fuente: 'exchangerate-api',
        },
        { onConflict: 'moneda_origen,moneda_destino,fecha' }
      )

    if (upsertError) throw upsertError

    // Calcular variación porcentual
    let variacion: number | null = null
    let alerta = false
    if (anterior?.tasa) {
      variacion = ((tasaActual - Number(anterior.tasa)) / Number(anterior.tasa)) * 100
      alerta = Math.abs(variacion) > 5
    }

    return new Response(
      JSON.stringify({
        tasa: tasaActual,
        fecha: hoy,
        variacion_porcentual: variacion != null ? Math.round(variacion * 100) / 100 : null,
        alerta_variacion: alerta,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
})
