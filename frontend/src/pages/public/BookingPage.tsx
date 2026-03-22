import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Calendar, Clock, User, Mail, Phone, Check, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { z } from 'zod'
import {
  usePublicAppointmentTypes,
  useAvailability,
  useBookAppointment,
  useVerifyAppointment,
} from '../../hooks/usePublicBooking'

const bookingSchema = z.object({
  nombre: z.string().min(3, 'Ingresa tu nombre completo'),
  email: z.string().email('Email inválido'),
  telefono: z.string().min(8, 'Teléfono inválido'),
})

export default function BookingPage() {
  const [searchParams] = useSearchParams()
  const preselectedType = searchParams.get('tipo') ?? ''

  const [step, setStep] = useState(1)
  const [tipoCitaId, setTipoCitaId] = useState(preselectedType)
  const [fecha, setFecha] = useState('')
  const [horaInicio, setHoraInicio] = useState('')
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('+56 ')
  const [citaId, setCitaId] = useState('')
  const [codigo, setCodigo] = useState('')
  const [token, setToken] = useState('')
  const [debugCode, setDebugCode] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: types } = usePublicAppointmentTypes()
  const { data: availability, isLoading: loadingSlots } = useAvailability(fecha, tipoCitaId)
  const bookMutation = useBookAppointment()
  const verifyMutation = useVerifyAppointment()

  const selectedType = types?.find((t) => t.id === tipoCitaId)

  // Get min date (today)
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (preselectedType && types?.some((t) => t.id === preselectedType)) {
      setTipoCitaId(preselectedType)
    }
  }, [preselectedType, types])

  const handleBooking = async () => {
    setErrors({})
    const result = bookingSchema.safeParse({ nombre, email, telefono })
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        fieldErrors[issue.path[0] as string] = issue.message
      }
      setErrors(fieldErrors)
      return
    }

    try {
      const res = await bookMutation.mutateAsync({
        nombre: nombre.trim(),
        email: email.trim().toLowerCase(),
        telefono: telefono.trim(),
        tipo_cita_id: tipoCitaId,
        fecha,
        hora_inicio: horaInicio,
      })
      setCitaId(res.cita_id)
      if (res._debug_codigo) setDebugCode(res._debug_codigo)
      setStep(4)
      toast.success('Código de verificación enviado')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al reservar')
    }
  }

  const handleVerify = async () => {
    if (codigo.length !== 6) {
      toast.error('Ingresa el código de 6 dígitos')
      return
    }
    try {
      const res = await verifyMutation.mutateAsync({ cita_id: citaId, codigo })
      setToken(res.token)
      toast.success('Cita confirmada')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Código incorrecto')
    }
  }

  const inputStyle = (field?: string) => ({
    backgroundColor: 'var(--input-bg)',
    border: `1px solid ${field && errors[field] ? 'var(--status-danger)' : 'var(--input-border)'}`,
    borderRadius: '6px',
    color: 'var(--text-primary)',
  })

  return (
    <div className="px-4 sm:px-6 py-8 sm:py-12">
      <div className="max-w-xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-1 text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft size={14} /> Volver al inicio
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Agenda tu examen gratis
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
            Paso {step} de 4 — {['Tipo de consulta', 'Fecha y hora', 'Tus datos', 'Verificación'][step - 1]}
          </p>
          {/* Progress bar */}
          <div className="flex gap-1 mt-4 max-w-xs mx-auto">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className="h-1.5 flex-1 rounded-full"
                style={{ backgroundColor: s <= step ? 'var(--btn-primary-bg)' : 'var(--border)' }}
              />
            ))}
          </div>
        </div>

        <div
          className="p-6"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px' }}
        >
          {/* Step 1: Type */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                ¿Qué tipo de cita necesitas?
              </h2>
              <div className="space-y-3">
                {types?.map((type) => {
                  const selected = tipoCitaId === type.id
                  return (
                    <button
                      key={type.id}
                      onClick={() => setTipoCitaId(type.id)}
                      className="w-full text-left p-4 cursor-pointer"
                      style={{
                        border: `2px solid ${selected ? 'var(--btn-primary-bg)' : 'var(--border)'}`,
                        backgroundColor: selected ? 'var(--badge-primary-bg)' : 'transparent',
                        borderRadius: '8px',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{type.nombre}</p>
                          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                            Duración: {type.duracion_min} minutos
                          </p>
                        </div>
                        {selected && <Check size={20} style={{ color: 'var(--btn-primary-bg)' }} />}
                      </div>
                    </button>
                  )
                })}
              </div>
              <button
                onClick={() => tipoCitaId && setStep(2)}
                disabled={!tipoCitaId}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium"
                style={{
                  backgroundColor: 'var(--btn-primary-bg)',
                  color: 'var(--btn-primary-text)',
                  borderRadius: '6px',
                  opacity: tipoCitaId ? 1 : 0.5,
                }}
              >
                Siguiente
                <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* Step 2: Date & Time */}
          {step === 2 && (
            <div className="space-y-4">
              <button onClick={() => setStep(1)} className="flex items-center gap-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <ArrowLeft size={14} /> Cambiar tipo de cita
              </button>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                Selecciona fecha y hora
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {selectedType?.nombre} · {selectedType?.duracion_min} minutos
              </p>

              {/* Date picker */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  <Calendar size={14} className="inline mr-1" />
                  Fecha
                </label>
                <input
                  type="date"
                  min={today}
                  value={fecha}
                  onChange={(e) => { setFecha(e.target.value); setHoraInicio('') }}
                  className="w-full text-sm py-2.5 px-3 outline-none"
                  style={inputStyle()}
                />
              </div>

              {/* Time slots */}
              {fecha && (
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    <Clock size={14} className="inline mr-1" />
                    Hora disponible
                  </label>
                  {loadingSlots ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="animate-spin" size={20} style={{ color: 'var(--text-muted)' }} />
                    </div>
                  ) : availability?.slots && availability.slots.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {availability.slots.map((slot) => {
                        const selected = horaInicio === slot.hora_inicio
                        return (
                          <button
                            key={slot.hora_inicio}
                            onClick={() => setHoraInicio(slot.hora_inicio)}
                            className="py-2 text-sm font-medium text-center"
                            style={{
                              border: `2px solid ${selected ? 'var(--btn-primary-bg)' : 'var(--border)'}`,
                              backgroundColor: selected ? 'var(--btn-primary-bg)' : 'transparent',
                              color: selected ? 'var(--btn-primary-text)' : 'var(--text-primary)',
                              borderRadius: '6px',
                            }}
                          >
                            {slot.hora_inicio}
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>
                      {availability?.mensaje ?? 'No hay horarios disponibles para esta fecha'}
                    </p>
                  )}
                </div>
              )}

              <button
                onClick={() => horaInicio && setStep(3)}
                disabled={!horaInicio}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium"
                style={{
                  backgroundColor: 'var(--btn-primary-bg)',
                  color: 'var(--btn-primary-text)',
                  borderRadius: '6px',
                  opacity: horaInicio ? 1 : 0.5,
                }}
              >
                Siguiente
                <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* Step 3: Personal info */}
          {step === 3 && (
            <div className="space-y-4">
              <button onClick={() => setStep(2)} className="flex items-center gap-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <ArrowLeft size={14} /> Cambiar horario
              </button>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                Tus datos
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Solo necesitamos esto para enviarte la confirmación y recordatorio de tu cita.
              </p>

              {/* Summary */}
              <div className="p-3 text-sm" style={{ backgroundColor: 'var(--bg-muted)', borderRadius: '6px', color: 'var(--text-secondary)' }}>
                {selectedType?.nombre} · {new Date(fecha + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })} · {horaInicio}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  <User size={14} className="inline mr-1" />
                  Nombre completo *
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full text-sm py-2.5 px-3 outline-none"
                  style={inputStyle('nombre')}
                  placeholder="Ej: María López"
                />
                {errors.nombre && <p className="text-xs mt-1" style={{ color: 'var(--status-danger)' }}>{errors.nombre}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  <Mail size={14} className="inline mr-1" />
                  Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-sm py-2.5 px-3 outline-none"
                  style={inputStyle('email')}
                  placeholder="tu@email.com"
                />
                {errors.email && <p className="text-xs mt-1" style={{ color: 'var(--status-danger)' }}>{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  <Phone size={14} className="inline mr-1" />
                  Teléfono *
                </label>
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full text-sm py-2.5 px-3 outline-none"
                  style={inputStyle('telefono')}
                  placeholder="+56 9 1234 5678"
                />
                {errors.telefono && <p className="text-xs mt-1" style={{ color: 'var(--status-danger)' }}>{errors.telefono}</p>}
              </div>

              <button
                onClick={handleBooking}
                disabled={bookMutation.isPending}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium"
                style={{
                  backgroundColor: 'var(--btn-primary-bg)',
                  color: 'var(--btn-primary-text)',
                  borderRadius: '6px',
                  opacity: bookMutation.isPending ? 0.6 : 1,
                }}
              >
                {bookMutation.isPending ? 'Agendando...' : 'Agendar examen gratis'}
              </button>
            </div>
          )}

          {/* Step 4: Verification */}
          {step === 4 && !token && (
            <div className="space-y-4 text-center">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
                style={{ backgroundColor: 'var(--badge-primary-bg)' }}
              >
                <Mail size={28} style={{ color: 'var(--btn-primary-bg)' }} />
              </div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                Verifica tu email
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Enviamos un código de 6 dígitos a <strong>{email}</strong>
              </p>

              {/* Debug code for testing */}
              {debugCode && (
                <div className="p-3 text-sm" style={{ backgroundColor: 'var(--badge-warning-bg)', color: 'var(--badge-warning-text)', borderRadius: '6px' }}>
                  Código de prueba: <strong>{debugCode}</strong>
                  <br />
                  <span className="text-xs">(En producción se envía por email)</span>
                </div>
              )}

              <div className="max-w-xs mx-auto">
                <input
                  type="text"
                  maxLength={6}
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center text-2xl font-mono tracking-[0.5em] py-3 outline-none"
                  style={inputStyle()}
                  placeholder="000000"
                  autoFocus
                />
              </div>

              <button
                onClick={handleVerify}
                disabled={verifyMutation.isPending || codigo.length !== 6}
                className="w-full max-w-xs mx-auto flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium"
                style={{
                  backgroundColor: 'var(--btn-primary-bg)',
                  color: 'var(--btn-primary-text)',
                  borderRadius: '6px',
                  opacity: verifyMutation.isPending || codigo.length !== 6 ? 0.6 : 1,
                }}
              >
                {verifyMutation.isPending ? 'Verificando...' : 'Verificar código'}
              </button>

              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                El código expira en 15 minutos
              </p>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 4 && token && (
            <div className="space-y-4 text-center">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
                style={{ backgroundColor: 'var(--badge-success-bg)' }}
              >
                <Check size={28} style={{ color: 'var(--status-success)' }} />
              </div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                Cita reservada
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Tu cita ha sido confirmada. Puedes gestionar tu cita desde el siguiente enlace:
              </p>

              <div
                className="p-4 text-sm space-y-2"
                style={{ backgroundColor: 'var(--bg-muted)', borderRadius: '8px' }}
              >
                <p style={{ color: 'var(--text-secondary)' }}>
                  <strong>{selectedType?.nombre}</strong>
                </p>
                <p style={{ color: 'var(--text-primary)' }}>
                  {new Date(fecha + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  {horaInicio}
                </p>
              </div>

              <Link
                to={`/cita/${token}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium"
                style={{
                  backgroundColor: 'var(--btn-primary-bg)',
                  color: 'var(--btn-primary-text)',
                  borderRadius: '6px',
                }}
              >
                Ver mi cita
              </Link>

              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Guarda este enlace. Lo necesitarás para confirmar, editar o cancelar tu cita.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
