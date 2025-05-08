"use client"

import { createContext, useState, useEffect, type ReactNode } from "react"
import type { Message } from "@/lib/types"

interface ConversationContextType {
  selectedCustomer: string | null
  messages: Message[]
  inputMessage: string
  status: string
  systemPrompt: string
  openingScript: string
  currentConversationId: string | null
  handleCustomerSelect: (value: string) => void
  clearConversation: () => void
  setInputMessage: (message: string) => void
  setSystemPrompt: (prompt: string) => void
  setOpeningScript: (script: string) => void
  setMessages: (messages: Message[]) => void
  setStatus: (status: string) => void
  setCurrentConversationId: (id: string | null) => void
}

export const ConversationContext = createContext<ConversationContextType>({
  selectedCustomer: null,
  messages: [],
  inputMessage: "",
  status: "準備就緒",
  systemPrompt: "",
  openingScript: "",
  currentConversationId: null,
  handleCustomerSelect: () => {},
  clearConversation: () => {},
  setInputMessage: () => {},
  setSystemPrompt: () => {},
  setOpeningScript: () => {},
  setMessages: () => {},
  setStatus: () => {},
  setCurrentConversationId: () => {},
})

interface ConversationProviderProps {
  children: ReactNode
}

export function ConversationProvider({ children }: ConversationProviderProps) {
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [status, setStatus] = useState("準備就緒")
  const [systemPrompt, setSystemPrompt] = useState(
    "你是一位專業的銷售助手。請根據客戶的反應提供適當的銷售建議，強調我們產品的優勢和價值。",
  )
  const [openingScript, setOpeningScript] = useState(
    "您好，我是[公司名稱]的[您的姓名]。感謝您抽空與我們交流。我們注意到您對[產品/服務]表示了興趣，想詢問您是否有時間討論一下您的需求？",
  )
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)

  // Subscribe to server-sent events for real-time updates
  useEffect(() => {
    if (!currentConversationId) return

    const eventSource = new EventSource(`/api/conversations/${currentConversationId}/events`)

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === "status") {
        setStatus(data.status)
      } else if (data.type === "message") {
        setMessages((prev) => [...prev, data.message])
      }
    }

    eventSource.onerror = () => {
      eventSource.close()
    }

    return () => {
      eventSource.close()
    }
  }, [currentConversationId])

  const handleCustomerSelect = (value: string) => {
    setSelectedCustomer(value)
    clearConversation()
  }

  const clearConversation = () => {
    setMessages([])
    setCurrentConversationId(null)
    setStatus("準備就緒")
  }

  const value = {
    selectedCustomer,
    messages,
    inputMessage,
    status,
    systemPrompt,
    openingScript,
    currentConversationId,
    handleCustomerSelect,
    clearConversation,
    setInputMessage,
    setSystemPrompt,
    setOpeningScript,
    setMessages,
    setStatus,
    setCurrentConversationId,
  }

  return <ConversationContext.Provider value={value}>{children}</ConversationContext.Provider>
}
