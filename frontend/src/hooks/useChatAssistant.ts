import { useState, useCallback, useRef } from 'react'

const FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface UseChatAssistantReturn {
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
  sendMessage: (text: string) => Promise<void>
  clearChat: () => void
}

const STORAGE_KEY = 'optikara-chat-history'
const MAX_STORED_MESSAGES = 30

function loadStoredMessages(): ChatMessage[] {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored) as { id: string; role: 'user' | 'assistant'; content: string; timestamp: string }[]
    return parsed.map((m) => ({ ...m, timestamp: new Date(m.timestamp) }))
  } catch {
    return []
  }
}

function storeMessages(messages: ChatMessage[]) {
  try {
    const toStore = messages.slice(-MAX_STORED_MESSAGES)
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(toStore))
  } catch {
    // sessionStorage full or unavailable — ignore
  }
}

export function useChatAssistant(): UseChatAssistantReturn {
  const [messages, setMessages] = useState<ChatMessage[]>(loadStoredMessages)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    }

    setMessages((prev) => {
      const updated = [...prev, userMessage]
      storeMessages(updated)
      return updated
    })

    setIsLoading(true)
    setError(null)

    // Cancel any in-flight request
    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()

    try {
      // Build messages array for the API (role + content only)
      const apiMessages = [...messages, userMessage].slice(-20).map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const res = await fetch(`${FUNCTIONS_URL}/chat-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ messages: apiMessages }),
        signal: abortRef.current.signal,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error ?? 'Error al enviar mensaje')
      }

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.reply,
        timestamp: new Date(),
      }

      setMessages((prev) => {
        const updated = [...prev, assistantMessage]
        storeMessages(updated)
        return updated
      })
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [messages])

  const clearChat = useCallback(() => {
    setMessages([])
    setError(null)
    sessionStorage.removeItem(STORAGE_KEY)
  }, [])

  return { messages, isLoading, error, sendMessage, clearChat }
}
