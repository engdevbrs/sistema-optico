import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function emailHeader(): string {
  return `
    <div class="email-header" style="background: linear-gradient(135deg, #2563EB 0%, #7C3AED 100%); padding: 32px 24px; text-align: center;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="48" align="center" style="margin: 0 auto 12px;">
        <tr><td style="width: 48px; height: 48px; background: rgba(255,255,255,0.2); border-radius: 12px; text-align: center; vertical-align: middle; font-size: 24px;">&#128065;</td></tr>
      </table>
      <h1 style="color: #ffffff; font-size: 20px; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Optikara</h1>
      <p style="color: rgba(255,255,255,0.8); font-size: 13px; margin: 4px 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Centro de salud visual</p>
    </div>
  `
}

function emailFooter(): string {
  return `
    <div class="email-footer" style="background-color: #F8FAFC; padding: 16px 24px; text-align: center; border-top: 1px solid #E2E8F0;">
      <p class="email-text-muted" style="color: #94A3B8; font-size: 11px; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        Optikara &mdash; Av. O'Higgins 1074, Piso 2, Local 8, Chiguayante
      </p>
    </div>
  `
}

function emailStyles(): string {
  return `
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
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
        .email-highlight { background-color: #1E3A5F !important; }
        .email-highlight-text { color: #93C5FD !important; }
        .email-discount-bg { background-color: #052E16 !important; }
        .email-discount-text { color: #86EFAC !important; }
      }
      @media only screen and (max-width: 480px) {
        .email-container { width: 100% !important; padding: 8px !important; }
        .email-card { border-radius: 8px !important; }
        .email-header { padding: 24px 16px !important; }
        .email-body { padding: 24px 16px !important; }
        .email-footer { padding: 12px 16px !important; }
      }
    </style>
  `
}

function buildEmail1(nombre: string, bookUrl: string): string {
  return `
    <!DOCTYPE html><html lang="es"><head>${emailStyles()}<title>Tu cita fue cancelada</title></head>
    <body style="margin:0;padding:0;-webkit-text-size-adjust:100%;">
      <div class="email-bg" style="background-color:#F1F5F9;padding:24px 16px;">
        <table class="email-container" role="presentation" cellspacing="0" cellpadding="0" border="0" width="480" align="center" style="margin:0 auto;max-width:480px;">
          <tr><td>
            <div class="email-card" style="background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #E2E8F0;">
              ${emailHeader()}
              <div class="email-body" style="padding:32px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                <div style="text-align:center;margin:0 0 24px;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="56" align="center" style="margin:0 auto 12px;">
                    <tr><td style="width:56px;height:56px;background-color:#FEF2F2;border-radius:50%;text-align:center;vertical-align:middle;font-size:28px;">&#128148;</td></tr>
                  </table>
                  <h2 class="email-text-primary" style="color:#0F172A;font-size:20px;margin:0 0 8px;">Tu cita fue cancelada</h2>
                </div>

                <p class="email-text-secondary" style="color:#64748B;font-size:14px;margin:0 0 8px;line-height:1.6;">
                  Hola <strong class="email-text-primary" style="color:#0F172A;">${nombre}</strong>,
                </p>
                <p class="email-text-secondary" style="color:#64748B;font-size:14px;margin:0 0 24px;line-height:1.6;">
                  Entendemos que a veces los planes cambian. No te preocupes, tu salud visual sigue siendo importante para nosotros y queremos seguir cuid&aacute;ndote.
                </p>

                <div class="email-highlight" style="background-color:#EFF6FF;border-radius:8px;padding:16px;margin:0 0 24px;text-align:center;">
                  <p class="email-highlight-text" style="color:#1E40AF;font-size:14px;font-weight:500;margin:0;line-height:1.5;">
                    Puedes reagendar tu cita en cualquier momento.<br>Seguimos con evaluaci&oacute;n visual profesional.
                  </p>
                </div>

                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 16px;">
                  <tr><td align="center">
                    <a href="${bookUrl}" style="display:inline-block;background:#2563EB;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:14px;font-weight:600;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                      Reagendar mi cita
                    </a>
                  </td></tr>
                </table>

                <p class="email-text-muted" style="color:#94A3B8;font-size:12px;margin:0;text-align:center;">
                  Te esperamos.
                </p>
              </div>
              ${emailFooter()}
            </div>
          </td></tr>
        </table>
      </div>
    </body></html>
  `
}

function buildEmail2(nombre: string, bookUrl: string): string {
  return `
    <!DOCTYPE html><html lang="es"><head>${emailStyles()}<title>Tu visión no puede esperar</title></head>
    <body style="margin:0;padding:0;-webkit-text-size-adjust:100%;">
      <div class="email-bg" style="background-color:#F1F5F9;padding:24px 16px;">
        <table class="email-container" role="presentation" cellspacing="0" cellpadding="0" border="0" width="480" align="center" style="margin:0 auto;max-width:480px;">
          <tr><td>
            <div class="email-card" style="background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #E2E8F0;">
              ${emailHeader()}
              <div class="email-body" style="padding:32px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">

                <p class="email-text-primary" style="color:#0F172A;font-size:16px;margin:0 0 8px;">Hola <strong>${nombre}</strong>,</p>
                <p class="email-text-secondary" style="color:#64748B;font-size:14px;margin:0 0 24px;line-height:1.6;">
                  Sab&iacute;as que el <strong class="email-text-primary" style="color:#0F172A;">60% de los problemas visuales</strong> pueden prevenirse con ex&aacute;menes regulares? Muchas personas no notan que su visi&oacute;n est&aacute; cambiando hasta que afecta su vida diaria.
                </p>

                <div class="email-surface" style="background-color:#F8FAFC;border-radius:8px;padding:16px;margin:0 0 24px;">
                  <p class="email-text-secondary" style="color:#64748B;font-size:13px;font-weight:600;margin:0 0 12px;">Se&ntilde;ales que no debes ignorar:</p>
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr><td class="email-text-secondary" style="color:#64748B;font-size:13px;padding:4px 0 4px 12px;">&#9888;&#65039; Dolores de cabeza frecuentes</td></tr>
                    <tr><td class="email-text-secondary" style="color:#64748B;font-size:13px;padding:4px 0 4px 12px;">&#9888;&#65039; Fatiga visual al final del d&iacute;a</td></tr>
                    <tr><td class="email-text-secondary" style="color:#64748B;font-size:13px;padding:4px 0 4px 12px;">&#9888;&#65039; Entrecerrar los ojos para ver lejos</td></tr>
                    <tr><td class="email-text-secondary" style="color:#64748B;font-size:13px;padding:4px 0 4px 12px;">&#9888;&#65039; Acercar el celular para leer</td></tr>
                  </table>
                </div>

                <div class="email-highlight" style="background-color:#EFF6FF;border-radius:8px;padding:16px;margin:0 0 24px;text-align:center;">
                  <p class="email-highlight-text" style="color:#1E40AF;font-size:14px;font-weight:500;margin:0;line-height:1.5;">
                    Tu evaluaci&oacute;n visual profesional solo toma 20 minutos y puede marcar la diferencia.
                  </p>
                </div>

                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 16px;">
                  <tr><td align="center">
                    <a href="${bookUrl}" style="display:inline-block;background:#2563EB;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:14px;font-weight:600;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                      Agendar mi cita
                    </a>
                  </td></tr>
                </table>

                <p class="email-text-muted" style="color:#94A3B8;font-size:12px;margin:0;text-align:center;">
                  Tu visi&oacute;n lo vale.
                </p>
              </div>
              ${emailFooter()}
            </div>
          </td></tr>
        </table>
      </div>
    </body></html>
  `
}

function buildEmail3(nombre: string, bookUrl: string): string {
  return `
    <!DOCTYPE html><html lang="es"><head>${emailStyles()}<title>Te echamos de menos</title></head>
    <body style="margin:0;padding:0;-webkit-text-size-adjust:100%;">
      <div class="email-bg" style="background-color:#F1F5F9;padding:24px 16px;">
        <table class="email-container" role="presentation" cellspacing="0" cellpadding="0" border="0" width="480" align="center" style="margin:0 auto;max-width:480px;">
          <tr><td>
            <div class="email-card" style="background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #E2E8F0;">
              ${emailHeader()}
              <div class="email-body" style="padding:32px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">

                <div style="text-align:center;margin:0 0 24px;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="56" align="center" style="margin:0 auto 12px;">
                    <tr><td style="width:56px;height:56px;background-color:#EFF6FF;border-radius:50%;text-align:center;vertical-align:middle;font-size:28px;">&#128075;</td></tr>
                  </table>
                  <h2 class="email-text-primary" style="color:#0F172A;font-size:20px;margin:0 0 4px;">Te echamos de menos</h2>
                  <p class="email-text-secondary" style="color:#64748B;font-size:14px;margin:0;">&Uacute;ltimo recordatorio, ${nombre}</p>
                </div>

                <p class="email-text-secondary" style="color:#64748B;font-size:14px;margin:0 0 24px;line-height:1.6;">
                  Solo queremos asegurarnos de que no se te olvide. Cuidar tu visi&oacute;n es una inversi&oacute;n en tu calidad de vida &mdash; y en Optikara lo hacemos f&aacute;cil.
                </p>

                <div class="email-surface" style="background-color:#F8FAFC;border-radius:8px;padding:16px;margin:0 0 24px;">
                  <p class="email-text-secondary" style="color:#64748B;font-size:13px;font-weight:600;margin:0 0 12px;">Lo que incluye tu evaluaci&oacute;n profesional:</p>
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr><td class="email-text-secondary" style="color:#64748B;font-size:13px;padding:4px 0 4px 12px;">&#10004;&#65039; Examen de agudeza visual</td></tr>
                    <tr><td class="email-text-secondary" style="color:#64748B;font-size:13px;padding:4px 0 4px 12px;">&#10004;&#65039; Receta &oacute;ptica profesional</td></tr>
                    <tr><td class="email-text-secondary" style="color:#64748B;font-size:13px;padding:4px 0 4px 12px;">&#10004;&#65039; Asesor&iacute;a personalizada</td></tr>
                    <tr><td class="email-text-secondary" style="color:#64748B;font-size:13px;padding:4px 0 4px 12px;">&#10004;&#65039; Tecnolog&iacute;a de punta</td></tr>
                  </table>
                </div>

                <div class="email-highlight" style="background-color:#EFF6FF;border-radius:8px;padding:16px;margin:0 0 24px;text-align:center;">
                  <p class="email-highlight-text" style="color:#1E40AF;font-size:14px;font-weight:500;margin:0;line-height:1.5;">
                    Agenda en 60 segundos.<br>Solo necesitas nombre, email y elegir horario.
                  </p>
                </div>

                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 16px;">
                  <tr><td align="center">
                    <a href="${bookUrl}" style="display:inline-block;background:linear-gradient(135deg,#2563EB 0%,#7C3AED 100%);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:8px;font-size:15px;font-weight:600;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                      Agendar mi cita
                    </a>
                  </td></tr>
                </table>

                <p class="email-text-muted" style="color:#94A3B8;font-size:12px;margin:0;text-align:center;line-height:1.4;">
                  Este es nuestro &uacute;ltimo recordatorio. No te enviaremos m&aacute;s emails sobre esto.
                </p>
              </div>
              ${emailFooter()}
            </div>
          </td></tr>
        </table>
      </div>
    </body></html>
  `
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
    const bookUrl = `${siteUrl}/reservar`

    if (!resendKey) {
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY no configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 1. Create new retention sequences for recently cancelled appointments
    const { data: canceladas } = await supabase
      .from('cita')
      .select('id, paciente_id, updated_at')
      .eq('estado', 'CANCELADA')
      .gt('updated_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()) // Last 2 hours

    if (canceladas && canceladas.length > 0) {
      for (const cita of canceladas) {
        // Check if sequence already exists
        const { data: existing } = await supabase
          .from('retencion_secuencia')
          .select('id')
          .eq('cita_cancelada_id', cita.id)
          .limit(1)

        if (!existing || existing.length === 0) {
          // Check patient doesn't have an active appointment (they already rebooked)
          const { data: activeCita } = await supabase
            .from('cita')
            .select('id')
            .eq('paciente_id', cita.paciente_id)
            .in('estado', ['PRE_RESERVA', 'PENDIENTE', 'CONFIRMADA'])
            .limit(1)

          if (!activeCita || activeCita.length === 0) {
            await supabase.from('retencion_secuencia').insert({
              paciente_id: cita.paciente_id,
              cita_cancelada_id: cita.id,
              paso_actual: 0,
              proximo_envio: new Date().toISOString(), // Send immediately
            })
          }
        }
      }
    }

    // 2. Process pending retention sequences
    const { data: secuencias } = await supabase
      .from('retencion_secuencia')
      .select(`
        id, paciente_id, paso_actual, proximo_envio,
        paciente:paciente_id(nombre, email)
      `)
      .eq('completada', false)
      .lte('proximo_envio', new Date().toISOString())

    if (!secuencias || secuencias.length === 0) {
      return new Response(
        JSON.stringify({ mensaje: 'No hay secuencias pendientes', procesadas: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let procesadas = 0
    let errores = 0

    for (const seq of secuencias) {
      const paciente = seq.paciente as { nombre: string; email: string }
      if (!paciente?.email) continue

      // Check if patient rebooked — stop sequence
      const { data: activeCita } = await supabase
        .from('cita')
        .select('id')
        .eq('paciente_id', seq.paciente_id)
        .in('estado', ['PRE_RESERVA', 'PENDIENTE', 'CONFIRMADA'])
        .limit(1)

      if (activeCita && activeCita.length > 0) {
        await supabase
          .from('retencion_secuencia')
          .update({ completada: true })
          .eq('id', seq.id)
        continue
      }

      const nextStep = seq.paso_actual + 1
      let html = ''
      let subject = ''

      if (nextStep === 1) {
        // Email 1: Immediate - empathetic
        html = buildEmail1(paciente.nombre, bookUrl)
        subject = 'Tu cita fue cancelada — reagenda cuando quieras | Optikara'
      } else if (nextStep === 2) {
        // Email 2: 3 days - educational
        html = buildEmail2(paciente.nombre, bookUrl)
        subject = 'Tu visión no puede esperar | Optikara'
      } else if (nextStep === 3) {
        // Email 3: 7 days - last reminder
        html = buildEmail3(paciente.nombre, bookUrl)
        subject = 'Te echamos de menos — último recordatorio | Optikara'
      }

      if (!html) {
        // All 3 emails sent, mark as completed
        await supabase
          .from('retencion_secuencia')
          .update({ completada: true })
          .eq('id', seq.id)
        continue
      }

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
            subject,
            html,
          }),
        })

        if (res.ok) {
          // Calculate next send time
          let proximoEnvio: string | null = null
          if (nextStep === 1) {
            proximoEnvio = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // +3 days
          } else if (nextStep === 2) {
            proximoEnvio = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString() // +4 days (total 7)
          }

          await supabase
            .from('retencion_secuencia')
            .update({
              paso_actual: nextStep,
              proximo_envio: proximoEnvio,
              completada: nextStep >= 3,
            })
            .eq('id', seq.id)

          procesadas++
          console.log(`[RETENTION] Paso ${nextStep} enviado a ${paciente.email}`)
        } else {
          errores++
          const err = await res.text()
          console.error(`[RETENTION] Error enviando a ${paciente.email}:`, err)
        }
      } catch (e) {
        errores++
        console.error(`[RETENTION] Error:`, e)
      }
    }

    return new Response(
      JSON.stringify({ mensaje: 'Secuencias procesadas', procesadas, errores }),
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
