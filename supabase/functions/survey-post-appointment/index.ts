import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const resendKey = Deno.env.get('RESEND_API_KEY')
    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'onboarding@resend.dev'
    const siteUrl = Deno.env.get('SITE_URL') || 'http://localhost:5173'

    if (!resendKey) {
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY no configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Find completed appointments from ~2 hours ago that don't have a survey yet
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()

    const { data: citas, error: citasErr } = await supabase
      .from('cita')
      .select(`
        id,
        paciente:paciente_id(id, nombre, email),
        tipo_cita:tipo_cita_id(nombre)
      `)
      .eq('estado', 'COMPLETADA')
      .gte('updated_at', fourHoursAgo)
      .lte('updated_at', twoHoursAgo)

    if (citasErr) throw citasErr

    if (!citas || citas.length === 0) {
      return new Response(
        JSON.stringify({ mensaje: 'No hay citas completadas para encuestar', enviados: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let enviados = 0
    let errores = 0

    for (const cita of citas) {
      const paciente = cita.paciente as { id: string; nombre: string; email: string }
      const tipoCita = cita.tipo_cita as { nombre: string }

      if (!paciente?.email) continue

      // Check if survey already exists for this appointment
      const { data: existing } = await supabase
        .from('encuesta')
        .select('id')
        .eq('cita_id', cita.id)
        .limit(1)

      if (existing && existing.length > 0) continue

      // Create survey record with unique token
      const token = crypto.randomUUID()
      const { error: insertErr } = await supabase.from('encuesta').insert({
        paciente_id: paciente.id,
        cita_id: cita.id,
        token,
        respondida: false,
        aprobada_para_publica: false,
      })

      if (insertErr) {
        console.error(`[SURVEY] Error creando encuesta para cita ${cita.id}:`, insertErr)
        errores++
        continue
      }

      const surveyUrl = `${siteUrl}/encuesta/${token}`

      const html = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta name="color-scheme" content="light dark">
          <meta name="supported-color-schemes" content="light dark">
          <title>Cu&eacute;ntanos tu experiencia - Optikara</title>
          <style>
            :root { color-scheme: light dark; }
            @media (prefers-color-scheme: dark) {
              .email-bg { background-color: #0F172A !important; }
              .email-card { background-color: #1E293B !important; border-color: #334155 !important; }
              .email-text-primary { color: #F1F5F9 !important; }
              .email-text-secondary { color: #94A3B8 !important; }
              .email-text-muted { color: #64748B !important; }
              .email-surface { background-color: #0F172A !important; }
              .email-footer { background-color: #0F172A !important; border-color: #334155 !important; }
            }
            @media only screen and (max-width: 480px) {
              .email-container { width: 100% !important; padding: 8px !important; }
              .email-card { border-radius: 8px !important; }
              .email-header { padding: 24px 16px !important; }
              .email-body { padding: 24px 16px !important; }
              .email-footer { padding: 12px 16px !important; }
            }
          </style>
        </head>
        <body style="margin: 0; padding: 0; -webkit-text-size-adjust: 100%;">
          <div class="email-bg" style="background-color: #F1F5F9; padding: 24px 16px;">
            <table class="email-container" role="presentation" cellspacing="0" cellpadding="0" border="0" width="480" align="center" style="margin: 0 auto; max-width: 480px;">
              <tr>
                <td>
                  <div class="email-card" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #E2E8F0;">

                    <!-- Header -->
                    <div class="email-header" style="background: linear-gradient(135deg, #2563EB 0%, #7C3AED 100%); padding: 32px 24px; text-align: center;">
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="48" align="center" style="margin: 0 auto 12px;">
                        <tr><td style="width: 48px; height: 48px; background: rgba(255,255,255,0.2); border-radius: 12px; text-align: center; vertical-align: middle; font-size: 24px;">&#128065;</td></tr>
                      </table>
                      <h1 style="color: #ffffff; font-size: 20px; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Optikara</h1>
                      <p style="color: rgba(255,255,255,0.8); font-size: 13px; margin: 4px 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Centro de salud visual</p>
                    </div>

                    <!-- Body -->
                    <div class="email-body" style="padding: 32px 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">

                      <div style="text-align: center; margin: 0 0 24px;">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="56" align="center" style="margin: 0 auto 12px;">
                          <tr><td style="width: 56px; height: 56px; background-color: #FEF3C7; border-radius: 50%; text-align: center; vertical-align: middle; font-size: 28px;">&#11088;</td></tr>
                        </table>
                        <h2 class="email-text-primary" style="color: #0F172A; font-size: 20px; margin: 0 0 4px;">&iquest;C&oacute;mo fue tu experiencia?</h2>
                        <p class="email-text-secondary" style="color: #64748B; font-size: 14px; margin: 0;">Tu opini&oacute;n nos ayuda a mejorar, ${paciente.nombre}</p>
                      </div>

                      <p class="email-text-secondary" style="color: #64748B; font-size: 14px; margin: 0 0 24px; line-height: 1.6;">
                        Gracias por visitarnos hoy para tu <strong class="email-text-primary" style="color: #0F172A;">${tipoCita.nombre}</strong>. Nos encantar&iacute;a saber c&oacute;mo te fue. Solo toma 30 segundos.
                      </p>

                      <div class="email-surface" style="background-color: #F8FAFC; border-radius: 8px; padding: 20px; margin: 0 0 24px; text-align: center;">
                        <p class="email-text-secondary" style="color: #64748B; font-size: 13px; margin: 0 0 12px;">&iquest;C&oacute;mo calificar&iacute;as tu visita?</p>
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
                          <tr>
                            <td style="font-size: 32px; padding: 0 6px;">&#11088;</td>
                            <td style="font-size: 32px; padding: 0 6px;">&#11088;</td>
                            <td style="font-size: 32px; padding: 0 6px;">&#11088;</td>
                            <td style="font-size: 32px; padding: 0 6px;">&#11088;</td>
                            <td style="font-size: 32px; padding: 0 6px;">&#11088;</td>
                          </tr>
                        </table>
                      </div>

                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0 0 16px;">
                        <tr>
                          <td align="center">
                            <a href="${surveyUrl}" style="display: inline-block; background: #2563EB; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 14px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                              Dejar mi opini&oacute;n
                            </a>
                          </td>
                        </tr>
                      </table>

                      <p class="email-text-muted" style="color: #94A3B8; font-size: 12px; margin: 0; text-align: center; line-height: 1.4;">
                        Solo 2 preguntas, menos de 30 segundos.
                      </p>
                    </div>

                    <!-- Footer -->
                    <div class="email-footer" style="background-color: #F8FAFC; padding: 16px 24px; text-align: center; border-top: 1px solid #E2E8F0;">
                      <p class="email-text-muted" style="color: #94A3B8; font-size: 11px; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                        Optikara &mdash; Av. O'Higgins 1074, Piso 2, Local 8, Chiguayante
                      </p>
                    </div>

                  </div>
                </td>
              </tr>
            </table>
          </div>
        </body>
        </html>
      `

      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: `Optikara <${fromEmail}>`,
            to: [paciente.email],
            subject: `¿Cómo fue tu visita? Cuéntanos en 30 segundos | Optikara`,
            html,
          }),
        })

        if (res.ok) {
          enviados++
          console.log(`[SURVEY] Email enviado a ${paciente.email}`)
        } else {
          errores++
          const err = await res.text()
          console.error(`[SURVEY] Error enviando a ${paciente.email}:`, err)
        }
      } catch (e) {
        errores++
        console.error(`[SURVEY] Error:`, e)
      }
    }

    return new Response(
      JSON.stringify({ mensaje: 'Encuestas procesadas', enviados, errores }),
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
