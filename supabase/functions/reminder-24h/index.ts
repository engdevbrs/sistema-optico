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

    if (!resendKey) {
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY no configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get tomorrow's date in Chile timezone (UTC-3 / UTC-4)
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    // Find confirmed/pending appointments for tomorrow
    const { data: citas, error: citasErr } = await supabase
      .from('cita')
      .select(`
        id, fecha, hora_inicio, token,
        paciente:paciente_id(nombre, email, telefono),
        tipo_cita:tipo_cita_id(nombre)
      `)
      .eq('fecha', tomorrowStr)
      .in('estado', ['PENDIENTE', 'CONFIRMADA'])

    if (citasErr) throw citasErr

    if (!citas || citas.length === 0) {
      return new Response(
        JSON.stringify({ mensaje: 'No hay citas para mañana', enviados: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let enviados = 0
    let errores = 0

    for (const cita of citas) {
      const paciente = cita.paciente as { nombre: string; email: string; telefono: string | null }
      const tipoCita = cita.tipo_cita as { nombre: string }

      if (!paciente?.email) continue

      const fechaFormateada = new Date(cita.fecha + 'T12:00:00').toLocaleDateString('es-CL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })

      const siteUrl = Deno.env.get('SITE_URL') || 'http://localhost:5173'
      const manageUrl = cita.token ? `${siteUrl}/mi-cita/${cita.token}` : siteUrl

      const html = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta name="color-scheme" content="light dark">
          <meta name="supported-color-schemes" content="light dark">
          <title>Recordatorio de cita - Optikara</title>
          <style>
            :root { color-scheme: light dark; }
            @media (prefers-color-scheme: dark) {
              .email-bg { background-color: #0F172A !important; }
              .email-card { background-color: #1E293B !important; border-color: #334155 !important; }
              .email-text-primary { color: #F1F5F9 !important; }
              .email-text-secondary { color: #94A3B8 !important; }
              .email-text-muted { color: #64748B !important; }
              .email-surface { background-color: #0F172A !important; border-color: #334155 !important; }
              .email-footer { background-color: #0F172A !important; border-color: #334155 !important; }
              .email-value { color: #E2E8F0 !important; }
              .email-alert-bg { background-color: #1E3A5F !important; }
              .email-alert-text { color: #93C5FD !important; }
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

                      <!-- Clock icon -->
                      <div style="text-align: center; margin: 0 0 24px;">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="56" align="center" style="margin: 0 auto 12px;">
                          <tr><td style="width: 56px; height: 56px; background-color: #FEF3C7; border-radius: 50%; text-align: center; vertical-align: middle; font-size: 28px;">&#9200;</td></tr>
                        </table>
                        <h2 class="email-text-primary" style="color: #0F172A; font-size: 20px; margin: 0 0 4px;">Tu cita es ma&ntilde;ana</h2>
                        <p class="email-text-secondary" style="color: #64748B; font-size: 14px; margin: 0;">${paciente.nombre}, te recordamos que tienes una cita agendada</p>
                      </div>

                      <!-- Details -->
                      <div class="email-surface" style="background-color: #F8FAFC; border-radius: 8px; padding: 16px; margin: 0 0 24px;">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                          <tr>
                            <td class="email-text-muted" style="color: #94A3B8; font-size: 13px; padding: 5px 0;">Servicio</td>
                            <td class="email-value" style="color: #0F172A; font-size: 13px; font-weight: 500; text-align: right; padding: 5px 0;">${tipoCita.nombre}</td>
                          </tr>
                          <tr>
                            <td class="email-text-muted" style="color: #94A3B8; font-size: 13px; padding: 5px 0;">Fecha</td>
                            <td class="email-value" style="color: #0F172A; font-size: 13px; font-weight: 500; text-align: right; padding: 5px 0;">${fechaFormateada}</td>
                          </tr>
                          <tr>
                            <td class="email-text-muted" style="color: #94A3B8; font-size: 13px; padding: 5px 0;">Hora</td>
                            <td class="email-value" style="color: #0F172A; font-size: 13px; font-weight: 500; text-align: right; padding: 5px 0;">${cita.hora_inicio} hrs</td>
                          </tr>
                          <tr>
                            <td class="email-text-muted" style="color: #94A3B8; font-size: 13px; padding: 5px 0;">Ubicaci&oacute;n</td>
                            <td class="email-value" style="color: #0F172A; font-size: 13px; font-weight: 500; text-align: right; padding: 5px 0;">Piso 2, Local 8</td>
                          </tr>
                        </table>
                      </div>

                      <!-- Tips -->
                      <div class="email-alert-bg" style="background-color: #EFF6FF; border-radius: 8px; padding: 16px; margin: 0 0 24px;">
                        <p class="email-alert-text" style="color: #1E40AF; font-size: 13px; font-weight: 600; margin: 0 0 8px;">&#128161; Recuerda</p>
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                          <tr><td class="email-alert-text" style="color: #3B82F6; font-size: 13px; padding: 3px 0 3px 12px;">&#8226; Trae tus lentes actuales si los usas</td></tr>
                          <tr><td class="email-alert-text" style="color: #3B82F6; font-size: 13px; padding: 3px 0 3px 12px;">&#8226; Si usas lentes de contacto, ret&iacute;ralos 2 horas antes</td></tr>
                          <tr><td class="email-alert-text" style="color: #3B82F6; font-size: 13px; padding: 3px 0 3px 12px;">&#8226; Llega 5 minutos antes de tu hora</td></tr>
                        </table>
                      </div>

                      <!-- CTA -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0 0 16px;">
                        <tr>
                          <td align="center">
                            <a href="${manageUrl}" style="display: inline-block; background: #2563EB; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 14px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                              Ver mi cita
                            </a>
                          </td>
                        </tr>
                      </table>

                      <p class="email-text-muted" style="color: #94A3B8; font-size: 12px; margin: 0; text-align: center; line-height: 1.4;">
                        &iquest;No puedes asistir? Cancela desde el enlace para liberar el horario.
                      </p>
                    </div>

                    <!-- Footer -->
                    <div class="email-footer" style="background-color: #F8FAFC; padding: 16px 24px; text-align: center; border-top: 1px solid #E2E8F0;">
                      <p class="email-text-muted" style="color: #94A3B8; font-size: 11px; margin: 0 0 4px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                        Optikara &mdash; Av. O'Higgins 1074, Piso 2, Local 8, Chiguayante
                      </p>
                      <p class="email-text-muted" style="color: #94A3B8; font-size: 11px; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                        &#128222; +56 9 1234 5678
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
            subject: `Recordatorio: tu cita es mañana a las ${cita.hora_inicio} | Optikara`,
            html,
            tracking: { clicks: false },
          }),
        })

        if (res.ok) {
          enviados++
          console.log(`[REMINDER] Email enviado a ${paciente.email}`)
        } else {
          errores++
          const err = await res.text()
          console.error(`[REMINDER] Error enviando a ${paciente.email}:`, err)
        }
      } catch (e) {
        errores++
        console.error(`[REMINDER] Error enviando a ${paciente.email}:`, e)
      }
    }

    // Update appointments to CONFIRMADA if they were PENDIENTE
    await supabase
      .from('cita')
      .update({ estado: 'CONFIRMADA' })
      .eq('fecha', tomorrowStr)
      .eq('estado', 'PENDIENTE')

    return new Response(
      JSON.stringify({
        mensaje: `Recordatorios procesados para ${tomorrowStr}`,
        total_citas: citas.length,
        enviados,
        errores,
      }),
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
