import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { MessageCircle, X, Send, Calendar, Clock, Tag, MapPin, Trash2, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useChatAssistant, type ChatMessage } from '../../hooks/useChatAssistant'

// ── Quick action chips ───────────────────────────────────────

const QUICK_ACTIONS = [
  { label: 'Agendar cita', icon: Calendar, message: 'Quiero agendar una cita' },
  { label: 'Ver horarios', icon: Clock, message: '¿Cuáles son sus horarios de atención?' },
  { label: 'Promociones', icon: Tag, message: '¿Tienen alguna promoción vigente?' },
  { label: '¿Cómo llegar?', icon: MapPin, message: '¿Dónde están ubicados y cómo llego?' },
]

// ── Chat bubble component ────────────────────────────────────

interface ChatBubbleProps {
  message: ChatMessage
}

function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user'

  // Detect if assistant suggests booking
  const suggestsBooking = !isUser && (
    message.content.toLowerCase().includes('agendar') ||
    message.content.toLowerCase().includes('reservar')
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: '8px',
      }}
    >
      <div
        style={{
          maxWidth: '85%',
          padding: '10px 14px',
          borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          backgroundColor: isUser ? 'var(--btn-primary-bg)' : 'var(--bg-surface-hover)',
          color: isUser ? '#FFFFFF' : 'var(--text-primary)',
          fontSize: '14px',
          lineHeight: '1.5',
          wordBreak: 'break-word',
        }}
      >
        <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{message.content}</p>
        {suggestsBooking && (
          <Link
            to="/agendar"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: '8px',
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: 'var(--btn-primary-bg)',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            <Calendar size={14} />
            Agendar ahora
          </Link>
        )}
      </div>
    </motion.div>
  )
}

// ── Typing indicator ─────────────────────────────────────────

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      style={{
        display: 'flex',
        justifyContent: 'flex-start',
        marginBottom: '8px',
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          borderRadius: '16px 16px 16px 4px',
          backgroundColor: 'var(--bg-surface-hover)',
          display: 'flex',
          gap: '4px',
          alignItems: 'center',
        }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'var(--text-muted)',
            }}
          />
        ))}
      </div>
    </motion.div>
  )
}

// ── Main widget ──────────────────────────────────────────────

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const { messages, isLoading, error, sendMessage, clearChat } = useChatAssistant()
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const isFirstOpen = useRef(true)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Focus input when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const handleSend = () => {
    if (!input.trim() || isLoading) return
    sendMessage(input)
    setInput('')
  }

  const handleQuickAction = (message: string) => {
    if (isLoading) return
    sendMessage(message)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleOpen = () => {
    setIsOpen(true)
    // Send welcome message on first open if no history
    if (isFirstOpen.current && messages.length === 0) {
      isFirstOpen.current = false
    }
  }

  const showQuickActions = messages.length === 0 && !isLoading

  return createPortal(
    <>
      {/* ── Floating button ─────────────────────── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleOpen}
            aria-label="Abrir chat de asistencia"
            style={{
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--btn-primary-bg) 0%, #7C3AED 100%)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(37, 99, 235, 0.4)',
              zIndex: 9998,
              color: '#FFFFFF',
            }}
          >
            <MessageCircle size={26} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Chat panel ──────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              width: '380px',
              maxWidth: 'calc(100vw - 32px)',
              height: '560px',
              maxHeight: 'calc(100vh - 48px)',
              borderRadius: '16px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              boxShadow: '0 8px 40px rgba(0, 0, 0, 0.15)',
              zIndex: 9999,
            }}
          >
            {/* ── Header ──────────────────────── */}
            <div
              style={{
                padding: '16px 20px',
                background: 'linear-gradient(135deg, var(--btn-primary-bg) 0%, #7C3AED 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MessageCircle size={18} color="#FFFFFF" />
                </div>
                <div>
                  <p style={{ margin: 0, color: '#FFFFFF', fontWeight: 600, fontSize: '15px' }}>
                    Asistente Optikara
                  </p>
                  <p style={{ margin: 0, color: 'rgba(255,255,255,0.75)', fontSize: '12px' }}>
                    Responde en segundos
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                {messages.length > 0 && (
                  <button
                    onClick={clearChat}
                    aria-label="Limpiar conversación"
                    style={{
                      background: 'rgba(255,255,255,0.15)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '6px',
                      cursor: 'pointer',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  aria-label="Cerrar chat"
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px',
                    cursor: 'pointer',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* ── Messages area ───────────────── */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Welcome message */}
              {messages.length === 0 && !isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ textAlign: 'center', padding: '16px 8px' }}
                >
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--color-primary-soft) 0%, rgba(124,58,237,0.1) 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px',
                    }}
                  >
                    <MessageCircle size={24} style={{ color: 'var(--btn-primary-bg)' }} />
                  </div>
                  <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: '16px', color: 'var(--text-primary)' }}>
                    ¡Hola! 👋
                  </p>
                  <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    Soy el asistente de Optikara. Pregúntame sobre nuestros servicios, horarios o disponibilidad.
                  </p>
                </motion.div>
              )}

              {/* Quick action chips */}
              {showQuickActions && (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    justifyContent: 'center',
                    marginTop: '8px',
                    marginBottom: '8px',
                  }}
                >
                  {QUICK_ACTIONS.map((action) => (
                    <motion.button
                      key={action.label}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleQuickAction(action.message)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        borderRadius: '20px',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--bg-surface)',
                        color: 'var(--text-primary)',
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'border-color 0.2s',
                      }}
                    >
                      <action.icon size={14} style={{ color: 'var(--btn-primary-bg)' }} />
                      {action.label}
                    </motion.button>
                  ))}
                </div>
              )}

              {/* Message list */}
              {messages.map((msg) => (
                <ChatBubble key={msg.id} message={msg} />
              ))}

              {/* Typing indicator */}
              <AnimatePresence>
                {isLoading && <TypingIndicator />}
              </AnimatePresence>

              {/* Error message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--toast-error-bg)',
                    color: 'var(--status-danger)',
                    fontSize: '13px',
                    textAlign: 'center',
                    marginBottom: '8px',
                  }}
                >
                  {error}
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* ── Input area ──────────────────── */}
            <div
              style={{
                padding: '12px 16px',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                flexShrink: 0,
                backgroundColor: 'var(--bg-surface)',
              }}
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu pregunta..."
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg-page)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                  fontFamily: 'var(--font-sans)',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--border-focus)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                aria-label="Enviar mensaje"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  border: 'none',
                  background: input.trim() && !isLoading
                    ? 'linear-gradient(135deg, var(--btn-primary-bg) 0%, #7C3AED 100%)'
                    : 'var(--bg-surface-hover)',
                  cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: input.trim() && !isLoading ? '#FFFFFF' : 'var(--text-muted)',
                  transition: 'background 0.2s',
                }}
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>,
    document.body
  )
}
