import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ── Tool definitions for Claude ──────────────────────────────

const tools = [
  {
    name: 'consultar_disponibilidad',
    description: 'Consulta los horarios disponibles para agendar una cita en una fecha específica. Usa esta herramienta cuando el usuario pregunte por disponibilidad, horas libres o quiera saber si hay citas para un día.',
    input_schema: {
      type: 'object',
      properties: {
        fecha: { type: 'string', description: 'Fecha en formato YYYY-MM-DD' },
        tipo_cita_id: { type: 'string', description: 'ID del tipo de cita. Si no se conoce, usar el ID del examen visual completo.' },
      },
      required: ['fecha'],
    },
  },
  {
    name: 'consultar_horario_dia',
    description: 'Consulta si un día específico de la semana está abierto y en qué horario. Usa esta herramienta cuando pregunten por horarios de atención, si abren tal día, a qué hora abren/cierran.',
    input_schema: {
      type: 'object',
      properties: {
        dia_semana: { type: 'number', description: 'Día de la semana: 0=Domingo, 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado' },
      },
      required: ['dia_semana'],
    },
  },
  {
    name: 'consultar_promociones',
    description: 'Consulta las promociones y descuentos activos actualmente. Usa esta herramienta cuando pregunten por ofertas, descuentos o promociones vigentes.',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'consultar_tipos_cita',
    description: 'Consulta los tipos de cita/servicio disponibles con su duración. Usa esta herramienta cuando pregunten qué servicios ofrecen, tipos de examen, o duración de consultas.',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'guardar_lead',
    description: 'Guarda información de un potencial cliente interesado que no agendó cita. Usa esta herramienta cuando el usuario muestre interés pero no concrete la cita, para seguimiento posterior.',
    input_schema: {
      type: 'object',
      properties: {
        nombre: { type: 'string', description: 'Nombre del interesado (si lo proporcionó)' },
        interes: { type: 'string', description: 'Resumen breve de lo que le interesa al usuario' },
      },
      required: ['interes'],
    },
  },
]

// ── System prompt ────────────────────────────────────────────

function buildSystemPrompt(config: Record<string, unknown>): string {
  const nombre = config.nombre_optica ?? 'Optikara'
  const direccion = config.direccion ?? 'Av. O\'Higgins 1074, Piso 2, Local 8, Chiguayante'
  const telefono = config.telefono ?? ''
  const email = config.email ?? ''

  return `Eres el asistente virtual de ${nombre}, un Centro de Salud Visual ubicado en ${direccion}, Chile.

## Tu personalidad
- Amable, profesional y cercano
- Respondes en español chileno pero sin exagerar el modismo
- Eres conciso: respuestas cortas y directas, máximo 2-3 oraciones por respuesta
- Siempre buscas guiar al usuario hacia agendar una cita o visitar la óptica

## Información de ${nombre}

### Ubicación y contacto
- Dirección: ${direccion}
- Estacionamiento gratuito frente al edificio
${telefono ? `- Teléfono: ${telefono}` : ''}
${email ? `- Email: ${email}` : ''}
- Link para agendar: disponible en nuestra web

### Servicios
- Examen Visual Completo (60 min): examen profesional con receta incluida
- Consulta General (45 min): evaluación y asesoría personalizada
- Control Visual (20 min): seguimiento de tratamiento
- No se necesita receta previa para agendar

### Productos y marcas
- Armazones ópticos (graduados)
- Lentes de sol (con o sin receta)
- Lentes ópticos (monofocales y progresivos)
- Lentes de contacto (diarios y mensuales)
- Accesorios (estuches, paños, etc.)
- Marcas: Ray-Ban, Oakley, Tom Ford, Gucci, Prada, Essilor, Vogue, Carrera, Hugo Boss, Emporio Armani

### Formas de pago
- Efectivo (pesos chilenos)
- Tarjeta de débito
- Tarjeta de crédito (Visa, MasterCard, American Express)
- Transferencia bancaria

### Cobertura de salud
- Emitimos boleta y receta oficial para reembolso
- Compatible con Fonasa e Isapre

### Antes de tu cita
- Trae tus lentes actuales si los tienes
- Retira lentes de contacto al menos 2 horas antes
- Informa sobre medicamentos que tomes
- Menores de edad deben venir acompañados de un adulto
- Llega 5 minutos antes

### Políticas
- Cancelación o reagendamiento: con al menos 24 horas de anticipación
- Atendemos todas las edades

## Reglas estrictas
1. SOLO respondes preguntas relacionadas con ${nombre}, salud visual, lentes, óptica y temas directamente relacionados.
2. Si te preguntan algo fuera de contexto (política, deportes, cocina, etc.), responde exactamente: "Solo puedo ayudarte con temas relacionados a ${nombre} y salud visual. ¿Hay algo sobre nuestros servicios en lo que pueda ayudarte?"
3. NUNCA inventes información. Si no sabes un dato específico (como un precio exacto de un producto), di que puede variar y sugiere visitar la óptica o agendar cita.
4. SIEMPRE intenta llevar la conversación hacia agendar una cita. Después de responder, sugiere agendar si es pertinente.
5. Cuando consultes disponibilidad, presenta los horarios de forma clara y amigable.
6. Si detectas urgencia visual (dolor, visión borrosa súbita, etc.), recomienda agendar lo antes posible.
7. NUNCA menciones que eres una IA, Claude, o un modelo de lenguaje. Eres "el asistente de ${nombre}".
8. No uses emojis excesivamente. Máximo 1-2 por mensaje cuando sea natural.

## Herramientas disponibles
Tienes acceso a herramientas para consultar datos en tiempo real de la óptica. Úsalas cuando necesites información actualizada sobre horarios, disponibilidad o promociones. No inventes datos — consulta siempre.`
}

// ── Tool execution ───────────────────────────────────────────

interface ToolInput {
  fecha?: string
  tipo_cita_id?: string
  dia_semana?: number
  nombre?: string
  interes?: string
}

async function executeTool(
  supabase: ReturnType<typeof createClient>,
  toolName: string,
  input: ToolInput,
): Promise<string> {
  switch (toolName) {
    case 'consultar_disponibilidad': {
      const { fecha, tipo_cita_id } = input

      // If no tipo_cita_id, get the default (examen visual — longest duration)
      let tipoCitaId = tipo_cita_id
      if (!tipoCitaId) {
        const { data: tipos } = await supabase
          .from('tipo_cita')
          .select('id, nombre, duracion_min')
          .order('duracion_min', { ascending: false })
          .limit(1)
        tipoCitaId = tipos?.[0]?.id
      }

      if (!fecha || !tipoCitaId) {
        return JSON.stringify({ error: 'No se pudo determinar la fecha o tipo de cita' })
      }

      const dateObj = new Date(fecha + 'T12:00:00')
      const dayOfWeek = dateObj.getDay()
      const fechaFormateada = dateObj.toLocaleDateString('es-CL', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      })

      const [tipoCitaRes, horarioRes, bloqueosRes, citasRes, configRes] = await Promise.all([
        supabase.from('tipo_cita').select('duracion_min').eq('id', tipoCitaId).single(),
        supabase.from('horario_semanal').select('activo, hora_inicio, hora_fin').eq('dia_semana', dayOfWeek).single(),
        supabase.from('bloqueo').select('id').eq('fecha', fecha).limit(1),
        supabase.from('cita').select('hora_inicio, hora_fin').eq('fecha', fecha).not('estado', 'in', '(CANCELADA,NO_ASISTIO)'),
        supabase.from('configuracion').select('limite_citas_dia').limit(1).single(),
      ])

      if (!horarioRes.data?.activo) {
        return JSON.stringify({ disponible: false, fecha: fechaFormateada, mensaje: 'Ese día no atendemos.' })
      }

      if (bloqueosRes.data && bloqueosRes.data.length > 0) {
        return JSON.stringify({ disponible: false, fecha: fechaFormateada, mensaje: 'Esa fecha está bloqueada (feriado o evento especial).' })
      }

      const duracion = tipoCitaRes.data?.duracion_min ?? 45
      const horario = horarioRes.data
      const citas = citasRes.data ?? []
      const limiteDia = configRes.data?.limite_citas_dia ?? 10

      if (citas.length >= limiteDia) {
        return JSON.stringify({ disponible: false, fecha: fechaFormateada, mensaje: 'No quedan horas disponibles para ese día.' })
      }

      const slots: string[] = []
      const inicio = timeToMinutes(horario.hora_inicio)
      const fin = timeToMinutes(horario.hora_fin)
      const occupiedSlots = citas.map((c: { hora_inicio: string; hora_fin: string }) => ({
        inicio: timeToMinutes(c.hora_inicio),
        fin: timeToMinutes(c.hora_fin),
      }))

      for (let t = inicio; t + duracion <= fin; t += 15) {
        const slotInicio = t
        const slotFin = t + duracion
        const overlaps = occupiedSlots.some(
          (occ: { inicio: number; fin: number }) => slotInicio < occ.fin && slotFin > occ.inicio
        )
        if (!overlaps) {
          slots.push(minutesToTime(slotInicio))
        }
      }

      return JSON.stringify({
        disponible: true,
        fecha: fechaFormateada,
        horario_atencion: `${horario.hora_inicio.substring(0, 5)} a ${horario.hora_fin.substring(0, 5)}`,
        horas_disponibles: slots.map((s: string) => s.substring(0, 5)),
        total_disponibles: slots.length,
      })
    }

    case 'consultar_horario_dia': {
      const { dia_semana } = input
      if (dia_semana === undefined) return JSON.stringify({ error: 'Día no especificado' })

      const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
      const { data: horario } = await supabase
        .from('horario_semanal')
        .select('activo, hora_inicio, hora_fin')
        .eq('dia_semana', dia_semana)
        .single()

      if (!horario || !horario.activo) {
        return JSON.stringify({ dia: dias[dia_semana], abierto: false, mensaje: `Los ${dias[dia_semana].toLowerCase()} no atendemos.` })
      }

      return JSON.stringify({
        dia: dias[dia_semana],
        abierto: true,
        hora_apertura: horario.hora_inicio.substring(0, 5),
        hora_cierre: horario.hora_fin.substring(0, 5),
      })
    }

    case 'consultar_promociones': {
      const today = new Date().toISOString().split('T')[0]
      const { data: promos } = await supabase
        .from('regla_descuento')
        .select('nombre, porcentaje, fecha_fin, categoria:categoria_id(nombre), producto:producto_id(nombre)')
        .eq('activo', true)
        .eq('nivel', 'TEMPORAL')
        .lte('fecha_inicio', today)
        .gte('fecha_fin', today)
        .order('porcentaje', { ascending: false })

      if (!promos || promos.length === 0) {
        return JSON.stringify({ promociones: [], mensaje: 'No hay promociones activas en este momento, pero siempre ofrecemos la mejor atención.' })
      }

      const formatted = promos.map((p: { nombre: string; porcentaje: number; fecha_fin: string; categoria: unknown; producto: unknown }) => ({
        nombre: p.nombre,
        descuento: `${p.porcentaje}%`,
        valido_hasta: new Date(p.fecha_fin + 'T12:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'long' }),
        aplica_a: (p.producto as { nombre: string } | null)?.nombre
          ?? (p.categoria as { nombre: string } | null)?.nombre
          ?? 'Todos los productos',
      }))

      return JSON.stringify({ promociones: formatted })
    }

    case 'consultar_tipos_cita': {
      const { data: tipos } = await supabase
        .from('tipo_cita')
        .select('id, nombre, duracion_min')
        .order('duracion_min')

      return JSON.stringify({
        servicios: (tipos ?? []).map((t: { id: string; nombre: string; duracion_min: number }) => ({
          id: t.id,
          nombre: t.nombre,
          duracion: `${t.duracion_min} minutos`,
        })),
      })
    }

    case 'guardar_lead': {
      const { nombre, interes } = input
      await supabase.from('chat_lead').insert({
        nombre: nombre ?? null,
        interes,
        created_at: new Date().toISOString(),
      })
      return JSON.stringify({ guardado: true })
    }

    default:
      return JSON.stringify({ error: 'Herramienta no reconocida' })
  }
}

// ── Main handler ─────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY no configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { messages } = await req.json() as {
      messages: { role: string; content: string }[]
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Se requiere un array de messages' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Limit conversation history to last 20 messages to control costs
    const recentMessages = messages.slice(-20)

    // Get business config for system prompt
    const { data: config } = await supabase
      .from('configuracion')
      .select('nombre_optica, direccion, telefono, email')
      .limit(1)
      .single()

    const systemPrompt = buildSystemPrompt(config ?? {})

    // Call Claude API with tools
    let response = await callClaude(anthropicKey, systemPrompt, recentMessages, tools)

    // Process tool calls in a loop (max 3 iterations to prevent runaway)
    let iterations = 0
    while (response.stop_reason === 'tool_use' && iterations < 3) {
      iterations++

      const assistantContent = response.content
      const toolUseBlocks = assistantContent.filter(
        (block: { type: string }) => block.type === 'tool_use'
      )

      const toolResults = []
      for (const toolBlock of toolUseBlocks) {
        const result = await executeTool(supabase, toolBlock.name, toolBlock.input as ToolInput)
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolBlock.id,
          content: result,
        })
      }

      // Continue conversation with tool results
      const updatedMessages = [
        ...recentMessages,
        { role: 'assistant', content: assistantContent },
        { role: 'user', content: toolResults },
      ]

      response = await callClaude(anthropicKey, systemPrompt, updatedMessages, tools)
    }

    // Extract final text response
    const textBlocks = response.content.filter(
      (block: { type: string }) => block.type === 'text'
    )
    const reply = textBlocks.map((b: { text: string }) => b.text).join('\n')

    return new Response(
      JSON.stringify({ reply }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[CHAT] Error:', error)
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// ── Claude API call ──────────────────────────────────────────

async function callClaude(
  apiKey: string,
  system: string,
  messages: unknown[],
  toolDefs: unknown[],
) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system,
      messages,
      tools: toolDefs,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('[CHAT] Claude API error:', err)
    throw new Error('Error al procesar tu mensaje. Intenta de nuevo.')
  }

  return await res.json()
}

// ── Utilities ────────────────────────────────────────────────

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0')
  const m = (minutes % 60).toString().padStart(2, '0')
  return `${h}:${m}`
}
