"use client"

import { useState } from "react"
import type { Message } from "@/lib/types"
import { getSampleMessages } from "@/lib/conversations"

export function useConversation() {
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [status, setStatus] = useState("準備就緒")

  const handleCustomerSelect = (value: string) => {
    setSelectedCustomer(value)
    // Load sample messages for the selected customer
    setMessages(getSampleMessages(value))
  }

  const startConversation = () => {
    setStatus("對話進行中")
    setMessages([
      ...messages,
      {
        sender: "sales",
        text: "您好，我是ABC公司的銷售代表。感謝您抽空與我們交流。請問您對我們的產品有什麼特別感興趣的地方嗎？",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ])
  }

  const endConversation = () => {
    setStatus("對話已結束")
  }

  const clearConversation = () => {
    setMessages([])
    setStatus("準備就緒")
  }

  const sendMessage = () => {
    if (!inputMessage.trim()) return

    // Add sales message
    setMessages([
      ...messages,
      {
        sender: "sales",
        text: inputMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ])
    setInputMessage("")

    // Simulate customer response after a delay
    setStatus("聆聽中...")
    setTimeout(() => {
      setStatus("語音處理中...")
      setTimeout(() => {
        setStatus("AI 正在生成回覆...")
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              sender: "customer",
              text: "謝謝您的解釋。我想了解一下這個產品的價格範圍，以及是否有任何促銷活動？",
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
          ])
          setStatus("對話進行中")
        }, 2000)
      }, 1500)
    }, 1500)
  }

  return {
    selectedCustomer,
    messages,
    inputMessage,
    status,
    handleCustomerSelect,
    startConversation,
    endConversation,
    clearConversation,
    sendMessage,
    setInputMessage,
  }
}
