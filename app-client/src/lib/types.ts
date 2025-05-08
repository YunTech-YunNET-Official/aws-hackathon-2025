export interface Message {
  sender: "customer" | "sales"
  text: string
  timestamp: string
}

export interface Customer {
  id: string
  name: string
  company: string
  details: Record<string, string | string[]>
}

export interface ConversationHistory {
  id: string
  customerId: string
  customerName: string
  date: string
  messages: Message[]
}

export interface ConversationResponse {
  conversationId: string
  messages: Message[]
}

export interface CustomerResponse {
  customerResponse: Message
}
