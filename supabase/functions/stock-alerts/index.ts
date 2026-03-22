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

    // Get products with low stock
    const { data: productos, error: pErr } = await supabase
      .from('producto')
      .select('nombre, sku, stock_actual, stock_optimo, categoria:categoria_id(nombre, umbral_stock_minimo)')
      .eq('eliminado', false)

    if (pErr) throw pErr

    // Filter products below minimum threshold
    const alertas = (productos || []).filter(p => {
      const cat = p.categoria as { nombre: string; umbral_stock_minimo: number }
      return p.stock_actual <= (cat?.umbral_stock_minimo || 3)
    })

    if (alertas.length === 0) {
      return new Response(
        JSON.stringify({ mensaje: 'Todos los productos tienen stock suficiente', alertas: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get admin emails
    const { data: admins } = await supabase
      .from('admin')
      .select('email')
      .eq('activo', true)

    if (!admins || admins.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No hay admins activos' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build product rows
    const productRows = alertas.map(p => {
      const cat = p.categoria as { nombre: string; umbral_stock_minimo: number }
      const isZero = p.stock_actual === 0
      const bgColor = isZero ? '#FEF2F2' : '#FEF3C7'
      const textColor = isZero ? '#DC2626' : '#D97706'
      const statusText = isZero ? 'Agotado' : 'Bajo'

      return `
        <tr>
          <td class="email-text-primary" style="color:#0F172A;font-size:13px;padding:10px 8px;border-bottom:1px solid #F1F5F9;">
            <strong>${p.nombre}</strong><br>
            <span class="email-text-muted" style="color:#94A3B8;font-size:11px;">${p.sku} &middot; ${cat?.nombre || ''}</span>
          </td>
          <td style="text-align:center;padding:10px 8px;border-bottom:1px solid #F1F5F9;">
            <span style="background-color:${bgColor};color:${textColor};font-size:12px;font-weight:600;padding:3px 8px;border-radius:9999px;">${statusText}: ${p.stock_actual}</span>
          </td>
          <td class="email-text-muted" style="color:#94A3B8;font-size:13px;text-align:center;padding:10px 8px;border-bottom:1px solid #F1F5F9;">
            ${p.stock_optimo}
          </td>
        </tr>
      `
    }).join('')

    const agotados = alertas.filter(p => p.stock_actual === 0).length
    const bajos = alertas.length - agotados

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
          }
          @media only screen and (max-width: 480px) {
            .email-container { width: 100% !important; padding: 8px !important; }
            .email-body { padding: 24px 16px !important; }
          }
        </style>
      </head>
      <body style="margin:0;padding:0;">
        <div class="email-bg" style="background-color:#F1F5F9;padding:24px 16px;">
          <table class="email-container" role="presentation" cellspacing="0" cellpadding="0" border="0" width="540" align="center" style="margin:0 auto;max-width:540px;">
            <tr><td>
              <div class="email-card" style="background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #E2E8F0;">

                <div style="background:linear-gradient(135deg,#DC2626 0%,#EA580C 100%);padding:24px;text-align:center;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="48" align="center" style="margin:0 auto 8px;">
                    <tr><td style="width:48px;height:48px;background:rgba(255,255,255,0.2);border-radius:12px;text-align:center;vertical-align:middle;font-size:24px;">&#9888;</td></tr>
                  </table>
                  <h1 style="color:#ffffff;font-size:18px;margin:0;font-family:-apple-system,sans-serif;">Alerta de Stock</h1>
                  <p style="color:rgba(255,255,255,0.9);font-size:13px;margin:4px 0 0;">${alertas.length} producto${alertas.length > 1 ? 's' : ''} requiere${alertas.length > 1 ? 'n' : ''} atenci&oacute;n</p>
                </div>

                <div class="email-body" style="padding:24px;font-family:-apple-system,sans-serif;">

                  <!-- Stats -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 20px;">
                    <tr>
                      <td style="width:50%;text-align:center;padding:12px;background-color:#FEF2F2;border-radius:8px 0 0 8px;">
                        <p style="color:#DC2626;font-size:24px;font-weight:700;margin:0;">${agotados}</p>
                        <p style="color:#DC2626;font-size:11px;margin:4px 0 0;">Agotados</p>
                      </td>
                      <td style="width:50%;text-align:center;padding:12px;background-color:#FEF3C7;border-radius:0 8px 8px 0;">
                        <p style="color:#D97706;font-size:24px;font-weight:700;margin:0;">${bajos}</p>
                        <p style="color:#D97706;font-size:11px;margin:4px 0 0;">Stock bajo</p>
                      </td>
                    </tr>
                  </table>

                  <!-- Products table -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 20px;">
                    <tr>
                      <td class="email-text-muted" style="color:#94A3B8;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;padding:8px;border-bottom:2px solid #E2E8F0;">Producto</td>
                      <td class="email-text-muted" style="color:#94A3B8;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;text-align:center;padding:8px;border-bottom:2px solid #E2E8F0;">Estado</td>
                      <td class="email-text-muted" style="color:#94A3B8;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;text-align:center;padding:8px;border-bottom:2px solid #E2E8F0;">&Oacute;ptimo</td>
                    </tr>
                    ${productRows}
                  </table>

                  <p class="email-text-muted" style="color:#94A3B8;font-size:12px;margin:0;text-align:center;">
                    Revisa el inventario y crea pedidos a proveedores desde el panel admin.
                  </p>
                </div>

                <div class="email-footer" style="background-color:#F8FAFC;padding:12px 24px;text-align:center;border-top:1px solid #E2E8F0;">
                  <p class="email-text-muted" style="color:#94A3B8;font-size:11px;margin:0;">Optikara &mdash; Alerta autom&aacute;tica de inventario</p>
                </div>

              </div>
            </td></tr>
          </table>
        </div>
      </body></html>
    `

    // Send to all admins
    let enviados = 0
    for (const admin of admins) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: `Optikara Sistema <${fromEmail}>`,
            to: [admin.email],
            subject: `⚠️ Alerta: ${agotados > 0 ? agotados + ' productos agotados' : bajos + ' productos con stock bajo'} | Optikara`,
            html,
          }),
        })
        if (res.ok) { enviados++; console.log(`[STOCK] Alert sent to ${admin.email}`) }
        else { console.error(`[STOCK] Error:`, await res.text()) }
      } catch (e) { console.error(`[STOCK] Error:`, e) }
    }

    return new Response(
      JSON.stringify({ mensaje: 'Alertas de stock procesadas', productos_alerta: alertas.length, emails_enviados: enviados }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
