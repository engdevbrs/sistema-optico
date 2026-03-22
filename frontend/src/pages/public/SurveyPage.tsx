import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Star, Check, MessageSquare } from 'lucide-react'
import toast from 'react-hot-toast'
import { useSubmitSurvey } from '../../hooks/usePublicBooking'

export default function SurveyPage() {
  const { token } = useParams<{ token: string }>()
  const submitSurvey = useSubmitSurvey()

  const [calificacion, setCalificacion] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comentario, setComentario] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const ratingLabels = ['', 'Muy mala', 'Mala', 'Regular', 'Buena', 'Excelente']

  const handleSubmit = async () => {
    if (calificacion === 0) {
      toast.error('Selecciona una calificación')
      return
    }

    try {
      await submitSurvey.mutateAsync({
        token: token!,
        calificacion,
        comentario: comentario.trim() || undefined,
      })
      setSubmitted(true)
      toast.success('Gracias por tu opinión')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al enviar')
    }
  }

  if (submitted) {
    return (
      <div className="px-4 sm:px-6 py-16 text-center">
        <div className="max-w-md mx-auto">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: 'var(--badge-success-bg)' }}
          >
            <Check size={32} style={{ color: 'var(--status-success)' }} />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Gracias por tu opinión
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
            Tu feedback nos ayuda a mejorar nuestro servicio.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium mt-6"
            style={{ backgroundColor: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', borderRadius: '6px' }}
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 py-8 sm:py-12">
      <div className="max-w-md mx-auto">
        <div
          className="p-6 space-y-6"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px' }}
        >
          <div className="text-center">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
              style={{ backgroundColor: 'var(--badge-primary-bg)' }}
            >
              <MessageSquare size={24} style={{ color: 'var(--btn-primary-bg)' }} />
            </div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              ¿Cómo fue tu experiencia?
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Tu opinión nos ayuda a mejorar
            </p>
          </div>

          {/* Star rating */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const active = star <= (hoverRating || calificacion)
                return (
                  <button
                    key={star}
                    onClick={() => setCalificacion(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1"
                  >
                    <Star
                      size={36}
                      style={{
                        color: active ? 'var(--status-warning)' : 'var(--border)',
                        fill: active ? 'var(--status-warning)' : 'transparent',
                        transition: 'all 0.15s ease',
                      }}
                    />
                  </button>
                )
              })}
            </div>
            {(hoverRating || calificacion) > 0 && (
              <p className="text-sm font-medium mt-2" style={{ color: 'var(--text-primary)' }}>
                {ratingLabels[hoverRating || calificacion]}
              </p>
            )}
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Comentario (opcional)
            </label>
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              rows={4}
              className="w-full text-sm py-2.5 px-3 outline-none resize-none"
              style={{
                backgroundColor: 'var(--input-bg)',
                border: '1px solid var(--input-border)',
                borderRadius: '6px',
                color: 'var(--text-primary)',
              }}
              placeholder="Cuéntanos sobre tu experiencia..."
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={calificacion === 0 || submitSurvey.isPending}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium"
            style={{
              backgroundColor: 'var(--btn-primary-bg)',
              color: 'var(--btn-primary-text)',
              borderRadius: '6px',
              opacity: calificacion === 0 || submitSurvey.isPending ? 0.5 : 1,
            }}
          >
            {submitSurvey.isPending ? 'Enviando...' : 'Enviar opinión'}
          </button>
        </div>
      </div>
    </div>
  )
}
