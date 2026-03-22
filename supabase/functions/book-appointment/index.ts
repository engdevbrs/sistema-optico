import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

async function sendVerificationEmail(to: string, nombre: string, codigo: string, tipoCita: string, fecha: string, hora: string) {
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

  const html = `
    <!DOCTYPE html>
    <html lang="es" xmlns:v="urn:schemas-microsoft-com:vml">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="color-scheme" content="light dark">
      <meta name="supported-color-schemes" content="light dark">
      <title>Código de verificación - Optikara</title>
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
          .email-code { color: #F1F5F9 !important; }
          .email-value { color: #E2E8F0 !important; }
        }
        @media only screen and (max-width: 480px) {
          .email-container { width: 100% !important; padding: 8px !important; }
          .email-card { border-radius: 8px !important; }
          .email-header { padding: 24px 16px !important; }
          .email-body { padding: 24px 16px !important; }
          .email-code { font-size: 28px !important; letter-spacing: 6px !important; }
          .email-footer { padding: 12px 16px !important; }
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
                  <p class="email-text-primary" style="color: #0F172A; font-size: 16px; margin: 0 0 8px;">Hola <strong>${nombre}</strong>,</p>
                  <p class="email-text-secondary" style="color: #64748B; font-size: 14px; margin: 0 0 24px; line-height: 1.5;">
                    Estás a un paso de confirmar tu cita. Ingresa este código en la página:
                  </p>

                  <!-- Code box -->
                  <div class="email-surface" style="background-color: #F8FAFC; border: 2px dashed #E2E8F0; border-radius: 12px; padding: 24px 16px; text-align: center; margin: 0 0 24px;">
                    <p class="email-text-muted" style="color: #64748B; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">Tu código de verificación</p>
                    <p class="email-code" style="color: #0F172A; font-size: 36px; font-weight: 700; letter-spacing: 8px; margin: 0; font-family: 'SF Mono', 'Fira Code', monospace;">${codigo}</p>
                    <p class="email-text-muted" style="color: #94A3B8; font-size: 11px; margin: 8px 0 0;">Expira en 15 minutos</p>
                  </div>

                  <!-- Appointment details -->
                  <div class="email-surface" style="background-color: #F8FAFC; border-radius: 8px; padding: 16px; margin: 0 0 24px;">
                    <p class="email-text-secondary" style="color: #64748B; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px;">Detalles de tu cita</p>
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
                    </table>
                  </div>

                  <p class="email-text-muted" style="color: #94A3B8; font-size: 12px; margin: 0; text-align: center; line-height: 1.4;">
                    Si no solicitaste esta cita, puedes ignorar este mensaje.
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

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `Optikara <${fromEmail}>`,
      to: [to],
      subject: `${codigo} — Tu código de verificación | Optikara`,
      html,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('[EMAIL] Error enviando:', err)
    return false
  }

  console.log(`[EMAIL] Código de verificación enviado a ${to}`)
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

    const { nombre, email, telefono, tipo_cita_id, fecha, hora_inicio } = await req.json()

    // Validate required fields
    if (!nombre || !email || !tipo_cita_id || !fecha || !hora_inicio) {
      return new Response(
        JSON.stringify({ error: 'Campos requeridos: nombre, email, tipo_cita_id, fecha, hora_inicio' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get appointment type for duration
    const { data: tipoCita, error: tcErr } = await supabase
      .from('tipo_cita')
      .select('duracion_min, nombre')
      .eq('id', tipo_cita_id)
      .single()

    if (tcErr || !tipoCita) {
      return new Response(
        JSON.stringify({ error: 'Tipo de cita no encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculate hora_fin
    const [h, m] = hora_inicio.split(':').map(Number)
    const finMinutes = h * 60 + m + tipoCita.duracion_min
    const hora_fin = `${Math.floor(finMinutes / 60).toString().padStart(2, '0')}:${(finMinutes % 60).toString().padStart(2, '0')}`

    // Find or create patient
    const emailLower = email.toLowerCase().trim()
    let { data: paciente } = await supabase
      .from('paciente')
      .select('id, cancelaciones_mes')
      .eq('email', emailLower)
      .eq('eliminado', false)
      .single()

    if (!paciente) {
      const { data: newPaciente, error: createErr } = await supabase
        .from('paciente')
        .insert({
          nombre: nombre.trim(),
          email: emailLower,
          telefono: telefono?.trim() || null,
          preferencia_contacto: 'EMAIL',
        })
        .select('id, cancelaciones_mes')
        .single()

      if (createErr) throw createErr
      paciente = newPaciente
    }

    // Check max cancellations
    const { data: config } = await supabase
      .from('configuracion')
      .select('max_cancelaciones_mes')
      .limit(1)
      .single()

    if (config && paciente.cancelaciones_mes >= config.max_cancelaciones_mes) {
      return new Response(
        JSON.stringify({ error: 'Has alcanzado el límite de cancelaciones este mes. Contacta a la óptica directamente.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check no active appointment
    const { data: activaCita } = await supabase
      .from('cita')
      .select('id')
      .eq('paciente_id', paciente.id)
      .in('estado', ['PRE_RESERVA', 'PENDIENTE', 'CONFIRMADA'])
      .limit(1)

    if (activaCita && activaCita.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Ya tienes una cita activa. Cancela la existente antes de reservar una nueva.' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify slot is still available
    const { data: overlap } = await supabase
      .from('cita')
      .select('id')
      .eq('fecha', fecha)
      .not('estado', 'in', '(CANCELADA,NO_ASISTIO)')
      .lt('hora_inicio', hora_fin)
      .gt('hora_fin', hora_inicio)
      .limit(1)

    if (overlap && overlap.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Este horario ya no está disponible. Por favor selecciona otro.' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate verification code
    const codigo = Math.floor(100000 + Math.random() * 900000).toString()
    const codigoExpira = new Date(Date.now() + 15 * 60 * 1000).toISOString()

    // Create appointment as PRE_RESERVA
    const { data: cita, error: citaErr } = await supabase
      .from('cita')
      .insert({
        paciente_id: paciente.id,
        tipo_cita_id,
        fecha,
        hora_inicio,
        hora_fin,
        duracion_min: tipoCita.duracion_min,
        estado: 'PRE_RESERVA',
        codigo_verificacion: codigo,
        codigo_verificacion_expira: codigoExpira,
      })
      .select('id')
      .single()

    if (citaErr) throw citaErr

    // Send verification email via Resend
    const emailSent = await sendVerificationEmail(
      emailLower,
      nombre.trim(),
      codigo,
      tipoCita.nombre,
      fecha,
      hora_inicio
    )

    return new Response(
      JSON.stringify({
        cita_id: cita.id,
        mensaje: emailSent
          ? 'Reserva creada. Revisa tu email para el código de verificación.'
          : 'Reserva creada. No pudimos enviar el email, contacta a la óptica.',
        email_enviado: emailSent,
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
