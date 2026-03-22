import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const url = new URL(req.url)
    const fecha = url.searchParams.get('fecha')
    const tipoCitaId = url.searchParams.get('tipo_cita_id')

    if (!fecha || !tipoCitaId) {
      return new Response(
        JSON.stringify({ error: 'Parámetros fecha y tipo_cita_id son requeridos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get day of week (0=Sunday, 6=Saturday)
    const dateObj = new Date(fecha + 'T12:00:00')
    const dayOfWeek = dateObj.getDay()

    // Run all independent queries in parallel
    const [tipoCitaRes, horarioRes, bloqueosRes, citasRes, configRes] = await Promise.all([
      supabase.from('tipo_cita').select('duracion_min').eq('id', tipoCitaId).single(),
      supabase.from('horario_semanal').select('activo, hora_inicio, hora_fin').eq('dia_semana', dayOfWeek).single(),
      supabase.from('bloqueo').select('id').eq('fecha', fecha).limit(1),
      supabase.from('cita').select('hora_inicio, hora_fin').eq('fecha', fecha).not('estado', 'in', '(CANCELADA,NO_ASISTIO)'),
      supabase.from('configuracion').select('limite_citas_dia').limit(1).single(),
    ])

    if (tipoCitaRes.error || !tipoCitaRes.data) {
      return new Response(
        JSON.stringify({ error: 'Tipo de cita no encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const duracion = tipoCitaRes.data.duracion_min
    const horario = horarioRes.data

    if (!horario || !horario.activo) {
      return new Response(
        JSON.stringify({ slots: [], mensaje: 'Día no disponible' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (bloqueosRes.data && bloqueosRes.data.length > 0) {
      return new Response(
        JSON.stringify({ slots: [], mensaje: 'Fecha bloqueada' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const citas = citasRes.data
    const limiteDia = configRes.data?.limite_citas_dia ?? 10

    if (citas && citas.length >= limiteDia) {
      return new Response(
        JSON.stringify({ slots: [], mensaje: 'Límite diario alcanzado' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate available slots
    const slots: { hora_inicio: string; hora_fin: string }[] = []
    const inicio = timeToMinutes(horario.hora_inicio)
    const fin = timeToMinutes(horario.hora_fin)

    const occupiedSlots = (citas ?? []).map((c) => ({
      inicio: timeToMinutes(c.hora_inicio),
      fin: timeToMinutes(c.hora_fin),
    }))

    for (let t = inicio; t + duracion <= fin; t += 15) {
      const slotInicio = t
      const slotFin = t + duracion

      // Check overlap with existing appointments
      const overlaps = occupiedSlots.some(
        (occ) => slotInicio < occ.fin && slotFin > occ.inicio
      )

      if (!overlaps) {
        slots.push({
          hora_inicio: minutesToTime(slotInicio),
          hora_fin: minutesToTime(slotFin),
        })
      }
    }

    return new Response(
      JSON.stringify({ slots, fecha, remaining: limiteDia - (citas?.length ?? 0) }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0')
  const m = (minutes % 60).toString().padStart(2, '0')
  return `${h}:${m}`
}
