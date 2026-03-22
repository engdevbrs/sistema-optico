import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

const FALLBACK_API_URL = 'https://open.er-api.com/v6/latest/USD'

interface ExchangeRateData {
  tasa: number
  fuente: 'supabase' | 'api-fallback'
}

async function fetchFromSupabase(): Promise<ExchangeRateData> {
  const { data, error } = await supabase
    .from('tipo_cambio')
    .select('tasa')
    .eq('moneda_origen', 'USD')
    .eq('moneda_destino', 'CLP')
    .order('fecha', { ascending: false })
    .limit(1)
    .single()

  if (error) throw error
  return { tasa: Number(data.tasa), fuente: 'supabase' }
}

async function fetchFromApi(): Promise<ExchangeRateData> {
  const response = await fetch(FALLBACK_API_URL)
  if (!response.ok) throw new Error('Error al consultar API de tipo de cambio')

  const data = await response.json()
  if (data.result !== 'success' || !data.rates?.CLP) {
    throw new Error('Respuesta inválida de API')
  }

  return { tasa: Number(data.rates.CLP), fuente: 'api-fallback' }
}

export function useExchangeRate() {
  return useQuery({
    queryKey: ['exchange-rate'],
    queryFn: async (): Promise<ExchangeRateData> => {
      try {
        return await fetchFromApi()
      } catch {
        // Fallback: si la API falla, usar último valor de BD
        return await fetchFromSupabase()
      }
    },
    staleTime: 1000 * 60 * 30, // 30 minutos
  })
}
