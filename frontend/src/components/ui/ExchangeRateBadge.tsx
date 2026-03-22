import { DollarSign } from 'lucide-react'
import { useExchangeRate } from '../../hooks/useExchangeRate'

export function ExchangeRateBadge() {
  const { data: rateData, isLoading, isError } = useExchangeRate()

  if (isLoading) {
    return (
      <div
        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium animate-pulse"
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '9999px',
          color: 'var(--text-muted)',
        }}
      >
        <DollarSign size={13} />
        <span>USD/CLP ...</span>
      </div>
    )
  }

  if (isError || !rateData) {
    return (
      <div
        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium"
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--status-danger)',
          borderRadius: '9999px',
          color: 'var(--status-danger)',
        }}
      >
        <DollarSign size={13} />
        <span>USD/CLP sin datos</span>
      </div>
    )
  }

  const isFallback = rateData.fuente === 'api-fallback'

  return (
    <div
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium"
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: `1px solid ${isFallback ? 'var(--status-warning)' : 'var(--border)'}`,
        borderRadius: '9999px',
        color: 'var(--text-primary)',
      }}
      title={isFallback ? 'Valor obtenido desde API externa (sin dato en BD)' : 'Valor desde base de datos'}
    >
      <DollarSign size={13} style={{ color: 'var(--status-success)' }} />
      <span>USD/CLP</span>
      <span className="font-semibold">${rateData.tasa.toLocaleString('es-CL')}</span>
      {isFallback && (
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: 'var(--status-warning)' }}
          title="Usando API externa como fallback"
        />
      )}
    </div>
  )
}
