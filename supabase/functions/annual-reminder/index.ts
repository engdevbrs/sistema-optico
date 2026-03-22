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
    const bookUrl = `${siteUrl}/reservar`

    if (!resendKey) {
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY no configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Find patients whose last completed appointment was ~1 year ago
    // Check at 30, 15, and 7 days before the anniversary
    const now = new Date()
    const checkDays = [30, 15, 7]
    let totalEnviados = 0
    let totalErrores = 0

    for (const daysBefore of checkDays) {
      // Date that is 1 year minus X days ago
      const targetDate = new Date(now)
      targetDate.setFullYear(targetDate.getFullYear() - 1)
      targetDate.setDate(targetDate.getDate() + daysBefore)
      const targetStr = targetDate.toISOString().split('T')[0]

      // Find last completed appointment per patient on that date
      const { data: citas } = await supabase
        .from('cita')
        .select(`
          id, fecha,
          paciente:paciente_id(id, nombre, email)
        `)
        .eq('estado', 'COMPLETADA')
        .eq('fecha', targetStr)

      if (!citas || citas.length === 0) continue

      // Group by patient (only latest appointment matters)
      const pacienteMap = new Map<string, { nombre: string; email: string }>()
      for (const cita of citas) {
        const p = cita.paciente as { id: string; nombre: string; email: string }
        if (p?.email && !pacienteMap.has(p.id)) {
          // Check patient doesn't already have a future appointment
          const { data: futureCita } = await supabase
            .from('cita')
            .select('id')
            .eq('paciente_id', p.id)
            .in('estado', ['PENDIENTE', 'CONFIRMADA', 'PRE_RESERVA'])
            .limit(1)

          if (!futureCita || futureCita.length === 0) {
            pacienteMap.set(p.id, { nombre: p.nombre, email: p.email })
          }
        }
      }

      for (const [, paciente] of pacienteMap) {
        const urgencyText = daysBefore === 30
          ? 'en un mes se cumple un a&ntilde;o desde tu &uacute;ltima revisi&oacute;n visual'
          : daysBefore === 15
          ? 'en 2 semanas se cumple un a&ntilde;o desde tu &uacute;ltima revisi&oacute;n'
          : 'esta semana se cumple un a&ntilde;o desde tu &uacute;ltima revisi&oacute;n'

        const subjectText = daysBefore === 30
          ? 'Tu revisión anual se acerca'
          : daysBefore === 15
          ? 'Recordatorio: tu revisión visual anual'
          : 'Última semana para tu revisión anual'

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
                .email-surface { background-color: #0F172A !important; }
                .email-footer { background-color: #0F172A !important; border-color: #334155 !important; }
                .email-highlight { background-color: #1E3A5F !important; }
                .email-highlight-text { color: #93C5FD !important; }
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
                    <div style="background:linear-gradient(135deg,#2563EB 0%,#7C3AED 100%);padding:32px 24px;text-align:center;">
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="48" align="center" style="margin:0 auto 12px;">
                        <tr><td style="width:48px;height:48px;background:rgba(255,255,255,0.2);border-radius:12px;text-align:center;vertical-align:middle;font-size:24px;">&#128065;</td></tr>
                      </table>
                      <h1 style="color:#ffffff;font-size:20px;margin:0;font-family:-apple-system,sans-serif;">Optikara</h1>
                      <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:4px 0 0;">Centro de salud visual</p>
                    </div>
                    <div class="email-body" style="padding:32px 24px;font-family:-apple-system,sans-serif;">
                      <div style="text-align:center;margin:0 0 24px;">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="56" align="center" style="margin:0 auto 12px;">
                          <tr><td style="width:56px;height:56px;background-color:#EFF6FF;border-radius:50%;text-align:center;vertical-align:middle;font-size:28px;">&#128467;</td></tr>
                        </table>
                        <h2 class="email-text-primary" style="color:#0F172A;font-size:20px;margin:0 0 4px;">Revisi&oacute;n anual</h2>
                      </div>
                      <p class="email-text-secondary" style="color:#64748B;font-size:14px;margin:0 0 8px;line-height:1.6;">
                        Hola <strong class="email-text-primary" style="color:#0F172A;">${paciente.nombre}</strong>,
                      </p>
                      <p class="email-text-secondary" style="color:#64748B;font-size:14px;margin:0 0 24px;line-height:1.6;">
                        ${urgencyText}. Los especialistas recomiendan un examen visual al menos una vez al a&ntilde;o para detectar cambios a tiempo.
                      </p>
                      <div class="email-highlight" style="background-color:#EFF6FF;border-radius:8px;padding:16px;margin:0 0 24px;text-align:center;">
                        <p class="email-highlight-text" style="color:#1E40AF;font-size:14px;font-weight:500;margin:0;line-height:1.5;">
                          Tu evaluaci&oacute;n es <strong>gratuita</strong> y solo toma 20 minutos.
                        </p>
                      </div>
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 16px;">
                        <tr><td align="center">
                          <a href="${bookUrl}" style="display:inline-block;background:#2563EB;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:14px;font-weight:600;">
                            Agendar mi revisi&oacute;n anual
                          </a>
                        </td></tr>
                      </table>
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
              subject: `${subjectText} | Optikara`,
              html,
            }),
          })
          if (res.ok) { totalEnviados++; console.log(`[ANNUAL] ${daysBefore}d reminder sent to ${paciente.email}`) }
          else { totalErrores++; console.error(`[ANNUAL] Error:`, await res.text()) }
        } catch (e) { totalErrores++; console.error(`[ANNUAL] Error:`, e) }
      }
    }

    return new Response(
      JSON.stringify({ mensaje: 'Recordatorios anuales procesados', enviados: totalEnviados, errores: totalErrores }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
