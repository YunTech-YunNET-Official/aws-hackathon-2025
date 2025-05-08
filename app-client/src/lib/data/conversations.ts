import type { Message, ConversationHistory } from "@/lib/types"
import { v4 as uuidv4 } from "uuid"

// In-memory storage for conversations
// In a real application, this would be stored in a database
export const conversations: (ConversationHistory & {
  status: "active" | "ended"
  systemPrompt?: string
})[] = [
  {
    id: "conv1",
    customerId: "customer1",
    customerName: "張小明",
    date: "2023/04/15",
    status: "ended",
    messages: [
      {
        sender: "sales",
        text: "您好，我是ABC公司的銷售代表。我們注意到您最近對我們的產品表示了興趣，想詢問您是否有時間討論一下？",
        timestamp: "10:03",
      },
      {
        sender: "customer",
        text: "是的，我對你們的產品有些問題想了解。",
        timestamp: "10:04",
      },
    ],
  },
  {
    id: "conv2",
    customerId: "customer1",
    customerName: "張小明",
    date: "2023/03/22",
    status: "ended",
    messages: [
      {
        sender: "sales",
        text: "張先生您好，我是ABC公司的銷售代表。上次我們討論了雲端解決方案的基本功能，今天想跟您分享一些案例研究。",
        timestamp: "14:30",
      },
      {
        sender: "customer",
        text: "好的，我很有興趣了解其他公司是如何使用你們的產品的。",
        timestamp: "14:32",
      },
    ],
  },
  {
    id: "conv3",
    customerId: "customer2",
    customerName: "李大華",
    date: "2023/05/20",
    status: "ended",
    messages: [
      {
        sender: "sales",
        text: "李先生您好，感謝您對我們創新數位解決方案的關注。請問您目前公司面臨哪些數位化挑戰？",
        timestamp: "14:30",
      },
      {
        sender: "customer",
        text: "我們正在尋找一個能夠整合現有系統的解決方案，預算有限。",
        timestamp: "14:32",
      },
    ],
  },
]

// Add a new conversation
export function addConversation(customerId: string, initialMessages: Message[] = [], systemPrompt?: string) {
  const customer = customers.find((c) => c.id === customerId)
  const newConversation = {
    id: uuidv4(),
    customerId,
    customerName: customer?.name || "Unknown",
    date: new Date().toLocaleDateString("zh-TW"),
    status: "active" as const,
    messages: initialMessages,
    systemPrompt,
  }

  conversations.push(newConversation)
  return newConversation
}

// Update an existing conversation
export function updateConversation(id: string, updatedConversation: (typeof conversations)[0]) {
  const index = conversations.findIndex((c) => c.id === id)
  if (index !== -1) {
    conversations[index] = updatedConversation
    return conversations[index]
  }
  return null
}

// Add a message to a conversation
export function addMessageToConversation(id: string, message: Message) {
  const conversation = conversations.find((c) => c.id === id)
  if (conversation) {
    conversation.messages.push(message)
    return conversation
  }
  return null
}

// Import customers for reference
import { customers } from "./customers"
