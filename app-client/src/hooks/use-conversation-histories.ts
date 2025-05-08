"use client"

import { useState, useEffect } from "react"
import { fetchConversationHistories } from "@/lib/api-client"

interface ConversationHistoryItem {
  id: string
  customerId: string
  customerName: string
  date: string
}

export function useConversationHistories(customerId: string | null) {
  const [histories, setHistories] = useState<ConversationHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!customerId) {
      setHistories([])
      return
    }

    const loadHistories = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await fetchConversationHistories(customerId)
        setHistories(data)
      } catch (err) {
        console.error("Failed to load conversation histories:", err)
        setError("無法載入對話歷史")
        setHistories([])
      } finally {
        setIsLoading(false)
      }
    }

    loadHistories()
  }, [customerId])

  return { histories, isLoading, error }
}
