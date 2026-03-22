import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
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

    // ── GET: View appointment by token ──
    if (req.method === 'GET') {
      const token = url.searchParams.get('token')
      if (!token) {
        return new Response(
          JSON.stringify({ error: 'Token requerido' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: cita, error } = await supabase
        .from('cita')
        .select(`
          id, fecha, hora_inicio, hora_fin, duracion_min, estado, token,
          motivo_cancelacion, motivo_cancelacion_texto, cancelado_por,
          created_at, updated_at,
          paciente:paciente_id(id, nombre, email, telefono),
          tipo_cita:tipo_cita_id(id, nombre, duracion_min)
        `)
        .eq('token', token)
        .single()

      if (error || !cita) {
        return new Response(
          JSON.stringify({ error: 'Cita no encontrada. Verifica que el link sea correcto.' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify(cita),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── PUT: Update appointment (confirm, edit date/time) ──
    if (req.method === 'PUT') {
      const body = await req.json()
      const { token, estado, fecha, hora_inicio } = body

      if (!token) {
        return new Response(
          JSON.stringify({ error: 'Token requerido' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get current appointment
      const { data: cita, error: fetchErr } = await supabase
        .from('cita')
        .select('id, estado, tipo_cita_id, duracion_min')
        .eq('token', token)
        .single()

      if (fetchErr || !cita) {
        return new Response(
          JSON.stringify({ error: 'Cita no encontrada' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (['COMPLETADA', 'CANCELADA', 'NO_ASISTIO'].includes(cita.estado)) {
        return new Response(
          JSON.stringify({ error: 'Esta cita no se puede modificar' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const updates: Record<string, unknown> = {}

      // Confirm
      if (estado === 'CONFIRMADA' && cita.estado === 'PENDIENTE') {
        updates.estado = 'CONFIRMADA'
      }

      // Edit date/time
      if (fecha && hora_inicio) {
        const duracion = cita.duracion_min
        const [h, m] = hora_inicio.split(':').map(Number)
        const finMinutes = h * 60 + m + duracion
        const hora_fin = `${Math.floor(finMinutes / 60).toString().padStart(2, '0')}:${(finMinutes % 60).toString().padStart(2, '0')}`

        // Verify new slot is available
        const { data: overlap } = await supabase
          .from('cita')
          .select('id')
          .eq('fecha', fecha)
          .neq('id', cita.id)
          .not('estado', 'in', '(CANCELADA,NO_ASISTIO)')
          .lt('hora_inicio', hora_fin)
          .gt('hora_fin', hora_inicio)
          .limit(1)

        if (overlap && overlap.length > 0) {
          return new Response(
            JSON.stringify({ error: 'El nuevo horario no está disponible' }),
            { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        updates.fecha = fecha
        updates.hora_inicio = hora_inicio
        updates.hora_fin = hora_fin
      }

      if (Object.keys(updates).length === 0) {
        return new Response(
          JSON.stringify({ error: 'No se especificaron cambios' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { error: updateErr } = await supabase
        .from('cita')
        .update(updates)
        .eq('id', cita.id)

      if (updateErr) throw updateErr

      return new Response(
        JSON.stringify({ mensaje: 'Cita actualizada correctamente' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── DELETE: Cancel appointment ──
    if (req.method === 'DELETE') {
      const token = url.searchParams.get('token')
      const motivo = url.searchParams.get('motivo') ?? 'OTRO'
      const motivoTexto = url.searchParams.get('motivo_texto') ?? null

      if (!token) {
        return new Response(
          JSON.stringify({ error: 'Token requerido' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: cita, error: fetchErr } = await supabase
        .from('cita')
        .select('id, estado, paciente_id')
        .eq('token', token)
        .single()

      if (fetchErr || !cita) {
        return new Response(
          JSON.stringify({ error: 'Cita no encontrada' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (['COMPLETADA', 'CANCELADA', 'NO_ASISTIO'].includes(cita.estado)) {
        return new Response(
          JSON.stringify({ error: 'Esta cita no se puede cancelar' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Cancel appointment
      const { error: updateErr } = await supabase
        .from('cita')
        .update({
          estado: 'CANCELADA',
          motivo_cancelacion: motivo,
          motivo_cancelacion_texto: motivoTexto,
          cancelado_por: 'CLIENTE',
        })
        .eq('id', cita.id)

      if (updateErr) throw updateErr

      // Increment cancellation counter
      await supabase.rpc('increment_cancelaciones', { p_paciente_id: cita.paciente_id }).catch(() => {
        // If RPC doesn't exist, update manually
        return supabase
          .from('paciente')
          .update({ cancelaciones_mes: supabase.rpc ? undefined : 0 })
          .eq('id', cita.paciente_id)
      })

      return new Response(
        JSON.stringify({ mensaje: 'Cita cancelada' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Método no permitido' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
