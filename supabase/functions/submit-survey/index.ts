import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

    const { token, calificacion, comentario } = await req.json()

    if (!token || !calificacion) {
      return new Response(
        JSON.stringify({ error: 'Token y calificación son requeridos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (calificacion < 1 || calificacion > 5) {
      return new Response(
        JSON.stringify({ error: 'La calificación debe estar entre 1 y 5' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Find survey by token
    const { data: encuesta, error: fetchErr } = await supabase
      .from('encuesta')
      .select('id, respondida')
      .eq('token', token)
      .single()

    if (fetchErr || !encuesta) {
      return new Response(
        JSON.stringify({ error: 'Encuesta no encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (encuesta.respondida) {
      return new Response(
        JSON.stringify({ error: 'Esta encuesta ya fue respondida' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update survey
    const { error: updateErr } = await supabase
      .from('encuesta')
      .update({
        calificacion,
        comentario: comentario?.trim() || null,
        respondida: true,
        respondida_at: new Date().toISOString(),
      })
      .eq('id', encuesta.id)

    if (updateErr) throw updateErr

    return new Response(
      JSON.stringify({ mensaje: 'Gracias por tu opinión' }),
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
