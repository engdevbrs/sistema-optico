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

    // Find patients with birthday today
    const now = new Date()
    const month = now.getMonth() + 1
    const day = now.getDate()

    // Query patients whose fecha_nacimiento matches today's month/day
    const { data: pacientes, error: pErr } = await supabase
      .from('paciente')
      .select('id, nombre, email, fecha_nacimiento')
      .eq('eliminado', false)
      .not('fecha_nacimiento', 'is', null)
      .not('email', 'is', null)

    if (pErr) throw pErr

    // Filter by birthday (month and day match)
    const birthdayPatients = (pacientes || []).filter(p => {
      if (!p.fecha_nacimiento) return false
      const bd = new Date(p.fecha_nacimiento + 'T12:00:00')
      return bd.getMonth() + 1 === month && bd.getDate() === day
    })

    if (birthdayPatients.length === 0) {
      return new Response(
        JSON.stringify({ mensaje: 'No hay cumpleaños hoy', enviados: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let enviados = 0
    let errores = 0

    for (const paciente of birthdayPatients) {
      const html = `
        <!DOCTYPE html><html lang="es"><head>
          <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark">
          <style>
            :root { color-scheme: light dark; }
            @media (prefers-color-scheme: dark) {
              .email-bg { background-color: #0F172A !important; }
              .email-card { background-color: #1E293B !important; border-color: #334155 !important; }
              .email-text-primary { color: #F1F5F9 !important; }
              .email-text-secondary { color: #94A3B8 !important; }
              .email-text-muted { color: #64748B !important; }
              .email-footer { background-color: #0F172A !important; border-color: #334155 !important; }
            }
            @media only screen and (max-width: 480px) {
              .email-container { width: 100% !important; padding: 8px !important; }
              .email-body { padding: 24px 16px !important; }
            }
          </style>
        </head>
        <body style="margin:0;padding:0;">
          <div class="email-bg" style="background-color:#F1F5F9;padding:24px 16px;">
            <table class="email-container" role="presentation" cellspacing="0" cellpadding="0" border="0" width="480" align="center" style="margin:0 auto;max-width:480px;">
              <tr><td>
                <div class="email-card" style="background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #E2E8F0;">

                  <!-- Header festivo -->
                  <div style="background:linear-gradient(135deg,#7C3AED 0%,#EC4899 50%,#F59E0B 100%);padding:40px 24px;text-align:center;">
                    <p style="font-size:48px;margin:0 0 8px;">&#127874;</p>
                    <h1 style="color:#ffffff;font-size:24px;margin:0;font-family:-apple-system,sans-serif;">&iexcl;Feliz Cumplea&ntilde;os!</h1>
                    <p style="color:rgba(255,255,255,0.9);font-size:14px;margin:8px 0 0;">${paciente.nombre}</p>
                  </div>

                  <div class="email-body" style="padding:32px 24px;font-family:-apple-system,sans-serif;">
                    <p class="email-text-secondary" style="color:#64748B;font-size:14px;margin:0 0 24px;line-height:1.6;text-align:center;">
                      Todo el equipo de <strong class="email-text-primary" style="color:#0F172A;">Optikara</strong> te desea un d&iacute;a lleno de alegr&iacute;a. Gracias por confiar en nosotros para cuidar tu visi&oacute;n.
                    </p>

                    <div style="text-align:center;margin:0 0 24px;">
                      <p style="font-size:32px;margin:0;">&#127881; &#127880; &#11088; &#127880; &#127881;</p>
                    </div>

                    <div style="background-color:#FDF4FF;border-radius:8px;padding:16px;margin:0 0 24px;text-align:center;border:1px solid #F0ABFC;">
                      <p style="color:#7C3AED;font-size:14px;font-weight:500;margin:0;line-height:1.5;">
                        Que este nuevo a&ntilde;o lo veas todo con la mejor claridad.<br>Seguimos aqu&iacute; para cuidarte.
                      </p>
                    </div>

                    <p class="email-text-muted" style="color:#94A3B8;font-size:12px;margin:0;text-align:center;">
                      Con cari&ntilde;o, el equipo de Optikara &#128153;
                    </p>
                  </div>

                  <div class="email-footer" style="background-color:#F8FAFC;padding:16px 24px;text-align:center;border-top:1px solid #E2E8F0;">
                    <p class="email-text-muted" style="color:#94A3B8;font-size:11px;margin:0;">Optikara &mdash; Av. O'Higgins 1074, Piso 2, Local 8, Chiguayante</p>
                  </div>

                </div>
              </td></tr>
            </table>
          </div>
        </body></html>
      `

      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: `Optikara <${fromEmail}>`,
            to: [paciente.email],
            subject: `¡Feliz Cumpleaños, ${paciente.nombre}! 🎂 | Optikara`,
            html,
          }),
        })
        if (res.ok) { enviados++; console.log(`[BIRTHDAY] Email sent to ${paciente.email}`) }
        else { errores++; console.error(`[BIRTHDAY] Error:`, await res.text()) }
      } catch (e) { errores++; console.error(`[BIRTHDAY] Error:`, e) }
    }

    return new Response(
      JSON.stringify({ mensaje: 'Cumpleaños procesados', enviados, errores }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
