import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

async function sendConfirmationEmail(
  to: string,
  nombre: string,
  tipoCita: string,
  fecha: string,
  hora: string,
  token: string
) {
  const resendKey = Deno.env.get('RESEND_API_KEY')
  const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'onboarding@resend.dev'

  if (!resendKey) {
    console.warn('[EMAIL] RESEND_API_KEY no configurada, saltando envío')
    return false
  }

  const fechaFormateada = new Date(fecha + 'T12:00:00').toLocaleDateString('es-CL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  // Link to manage appointment
  const siteUrl = Deno.env.get('SITE_URL') || 'http://localhost:5173'
  const manageUrl = `${siteUrl}/mi-cita/${token}`

  const html = `
    <!DOCTYPE html>
    <html lang="es" xmlns:v="urn:schemas-microsoft-com:vml">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="color-scheme" content="light dark">
      <meta name="supported-color-schemes" content="light dark">
      <title>Cita confirmada - Optikara</title>
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
          .email-check-bg { background-color: #052E16 !important; }
          .email-tips-bg { background-color: #1E3A5F !important; }
          .email-tips-title { color: #93C5FD !important; }
          .email-tips-text { color: #7DD3FC !important; }
        }
        @media only screen and (max-width: 480px) {
          .email-container { width: 100% !important; padding: 8px !important; }
          .email-card { border-radius: 8px !important; }
          .email-header { padding: 24px 16px !important; }
          .email-body { padding: 24px 16px !important; }
          .email-footer { padding: 12px 16px !important; }
          .email-btn { padding: 12px 16px !important; }
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
      <div class="email-bg" style="background-color: #F1F5F9; padding: 24px 16px;">
        <table class="email-container" role="presentation" cellspacing="0" cellpadding="0" border="0" width="480" align="center" style="margin: 0 auto; max-width: 480px;">
          <tr>
            <td>
              <div class="email-card" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #E2E8F0;">

                <!-- Header gradient -->
                <div class="email-header" style="background: linear-gradient(135deg, #2563EB 0%, #7C3AED 100%); padding: 32px 24px; text-align: center;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="48" align="center" style="margin: 0 auto 12px;">
                    <tr><td style="width: 48px; height: 48px; background: rgba(255,255,255,0.2); border-radius: 12px; text-align: center; vertical-align: middle; font-size: 24px;">&#128065;</td></tr>
                  </table>
                  <h1 style="color: #ffffff; font-size: 20px; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Optikara</h1>
                  <p style="color: rgba(255,255,255,0.8); font-size: 13px; margin: 4px 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Centro de salud visual</p>
                </div>

                <!-- Body -->
                <div class="email-body" style="padding: 32px 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">

                  <!-- Check icon + title -->
                  <div style="text-align: center; margin: 0 0 24px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="56" align="center" style="margin: 0 auto 12px;">
                      <tr><td class="email-check-bg" style="width: 56px; height: 56px; background-color: #F0FDF4; border-radius: 50%; text-align: center; vertical-align: middle; font-size: 24px; color: #16A34A;">&#10004;</td></tr>
                    </table>
                    <h2 class="email-text-primary" style="color: #0F172A; font-size: 20px; margin: 0 0 4px;">Cita confirmada</h2>
                    <p class="email-text-secondary" style="color: #64748B; font-size: 14px; margin: 0;">Te esperamos, ${nombre}</p>
                  </div>

                  <!-- Appointment details -->
                  <div class="email-surface" style="background-color: #F8FAFC; border-radius: 8px; padding: 16px; margin: 0 0 24px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td class="email-text-muted" style="color: #94A3B8; font-size: 13px; padding: 5px 0;">Servicio</td>
                        <td class="email-value" style="color: #0F172A; font-size: 13px; font-weight: 500; text-align: right; padding: 5px 0;">${tipoCita}</td>
                      </tr>
                      <tr>
                        <td class="email-text-muted" style="color: #94A3B8; font-size: 13px; padding: 5px 0;">Fecha</td>
                        <td class="email-value" style="color: #0F172A; font-size: 13px; font-weight: 500; text-align: right; padding: 5px 0;">${fechaFormateada}</td>
                      </tr>
                      <tr>
                        <td class="email-text-muted" style="color: #94A3B8; font-size: 13px; padding: 5px 0;">Hora</td>
                        <td class="email-value" style="color: #0F172A; font-size: 13px; font-weight: 500; text-align: right; padding: 5px 0;">${hora} hrs</td>
                      </tr>
                      <tr>
                        <td class="email-text-muted" style="color: #94A3B8; font-size: 13px; padding: 5px 0;">Ubicaci&oacute;n</td>
                        <td class="email-value" style="color: #0F172A; font-size: 13px; font-weight: 500; text-align: right; padding: 5px 0;">Piso 2, Local 8</td>
                      </tr>
                    </table>
                  </div>

                  <!-- Tips -->
                  <div class="email-tips-bg" style="background-color: #EFF6FF; border-radius: 8px; padding: 16px; margin: 0 0 24px;">
                    <p class="email-tips-title" style="color: #1E40AF; font-size: 13px; font-weight: 600; margin: 0 0 8px;">&#128161; Antes de venir</p>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr><td class="email-tips-text" style="color: #3B82F6; font-size: 13px; padding: 3px 0 3px 12px;">&#8226; Trae tus lentes actuales si los usas</td></tr>
                      <tr><td class="email-tips-text" style="color: #3B82F6; font-size: 13px; padding: 3px 0 3px 12px;">&#8226; Si usas lentes de contacto, ret&iacute;ralos 2 horas antes</td></tr>
                      <tr><td class="email-tips-text" style="color: #3B82F6; font-size: 13px; padding: 3px 0 3px 12px;">&#8226; Llega 5 minutos antes de tu hora</td></tr>
                    </table>
                  </div>

                  <!-- CTA Button -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0 0 16px;">
                    <tr>
                      <td align="center">
                        <a class="email-btn" href="${manageUrl}" style="display: inline-block; background: #2563EB; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 14px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                          Ver o gestionar mi cita
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p class="email-text-muted" style="color: #94A3B8; font-size: 12px; margin: 0; text-align: center; line-height: 1.4;">
                    Desde ese enlace puedes ver los detalles o cancelar si lo necesitas.
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

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `Optikara <${fromEmail}>`,
      to: [to],
      subject: `Cita confirmada — ${fechaFormateada} a las ${hora} | Optikara`,
      html,
      tracking: { clicks: false },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('[EMAIL] Error enviando confirmación:', err)
    return false
  }

  console.log(`[EMAIL] Confirmación enviada a ${to}`)
  return true
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

    const { cita_id, codigo } = await req.json()

    if (!cita_id || !codigo) {
      return new Response(
        JSON.stringify({ error: 'cita_id y codigo son requeridos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get appointment with patient and type info
    const { data: cita, error: citaErr } = await supabase
      .from('cita')
      .select('id, estado, codigo_verificacion, codigo_verificacion_expira, fecha, hora_inicio, paciente_id, tipo_cita_id')
      .eq('id', cita_id)
      .single()

    if (citaErr || !cita) {
      return new Response(
        JSON.stringify({ error: 'Cita no encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (cita.estado !== 'PRE_RESERVA') {
      return new Response(
        JSON.stringify({ error: 'Esta cita ya fue verificada' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check expiration
    if (new Date(cita.codigo_verificacion_expira) < new Date()) {
      // Delete expired appointment
      await supabase.from('cita').delete().eq('id', cita_id)
      return new Response(
        JSON.stringify({ error: 'El código de verificación ha expirado. Por favor reserva nuevamente.' }),
        { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify code
    if (cita.codigo_verificacion !== codigo.trim()) {
      return new Response(
        JSON.stringify({ error: 'Código de verificación incorrecto' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate unique token for appointment management
    const token = crypto.randomUUID()

    // Update appointment to PENDIENTE with token
    const { error: updateErr } = await supabase
      .from('cita')
      .update({
        estado: 'PENDIENTE',
        token,
        codigo_verificacion: null,
        codigo_verificacion_expira: null,
      })
      .eq('id', cita_id)

    if (updateErr) throw updateErr

    // Get patient and type info for email
    const [{ data: paciente }, { data: tipoCita }] = await Promise.all([
      supabase.from('paciente').select('nombre, email').eq('id', cita.paciente_id).single(),
      supabase.from('tipo_cita').select('nombre').eq('id', cita.tipo_cita_id).single(),
    ])

    // Send confirmation email
    if (paciente && tipoCita) {
      await sendConfirmationEmail(
        paciente.email,
        paciente.nombre,
        tipoCita.nombre,
        cita.fecha,
        cita.hora_inicio,
        token
      )
    }

    return new Response(
      JSON.stringify({
        token,
        mensaje: 'Cita verificada y confirmada. Revisa tu email con los detalles.',
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
