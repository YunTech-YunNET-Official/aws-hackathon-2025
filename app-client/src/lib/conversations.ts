import type { Message } from "./types"

const conversationHistory: Record<string, Message[]> = {
  customer1: [
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
  customer2: [
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
  customer3: [
    {
      sender: "sales",
      text: "王董您好，很高興再次與您聯繫。根據上次的討論，我們已經準備了專屬於貴公司的擴展方案。",
      timestamp: "09:15",
    },
    {
      sender: "customer",
      text: "很好，我們正在評估擴展計劃。請問你們能提供哪些額外的支援服務？",
      timestamp: "09:17",
    },
  ],
}

export function getSampleMessages(customerId: string): Message[] {
  return conversationHistory[customerId] || []
}

export function getAllConversationHistory(): Record<string, Message[]> {
  return conversationHistory
}
