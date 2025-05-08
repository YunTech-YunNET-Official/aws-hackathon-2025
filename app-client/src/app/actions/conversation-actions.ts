"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { v4 as uuidv4 } from "uuid"
import type { Message } from "@/lib/types"

// 這裡可以實現與數據庫交互的伺服器操作
// 目前僅為示例，實際應用中可連接到真實數據庫

// 使用 cookies 來模擬會話狀態
async function getConversationState() {
  const cookieStore = await cookies()
  const state = cookieStore.get("conversation-state")
  return state
    ? JSON.parse(state.value)
    : {
        currentConversationId: null,
        messages: [],
        status: "準備就緒",
      }
}

interface ConversationState {
  currentConversationId: string | null
  messages: Message[]
  status: string
}

async function setConversationState(state: ConversationState) {
  const cookieStore = await cookies()
  cookieStore.set("conversation-state", JSON.stringify(state))
}

export async function startConversationAction(customerId: string, systemPrompt: string, openingScript: string) {
  try {
    // 在實際應用中，這裡會調用數據庫或外部 API
    const conversationId = uuidv4()
    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

    const initialMessage = {
      sender: "sales" as const,
      text:
        openingScript ||
        "您好，我是ABC公司的銷售代表。感謝您抽空與我們交流。請問您對我們的產品有什麼特別感興趣的地方嗎？",
      timestamp,
    }

    // 更新狀態
    setConversationState({
      currentConversationId: conversationId,
      messages: [initialMessage],
      status: "對話進行中",
    })

    revalidatePath("/")
    return { success: true, conversationId, messages: [initialMessage] }
  } catch (error) {
    console.error("Failed to start conversation:", error)
    return { success: false, error: "無法開始對話" }
  }
}

export async function endConversationAction() {
  try {
    // 在實際應用中，這裡會更新數據庫
    const state = await getConversationState()

    // 更新狀態
    await setConversationState({
      ...state,
      status: "對話已結束",
    })

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Failed to end conversation:", error)
    return { success: false, error: "無法結束對話" }
  }
}

export async function clearConversationAction() {
  try {
    // 清除對話狀態
    setConversationState({
      currentConversationId: null,
      messages: [],
      status: "準備就緒",
    })

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Failed to clear conversation:", error)
    return { success: false, error: "無法清除對話" }
  }
}

export async function sendMessageAction(conversationId: string, message: string) {
  try {
    const state = await getConversationState()
    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

    // 添加銷售訊息
    const salesMessage = {
      sender: "sales" as const,
      text: message,
      timestamp,
    }

    // 更新狀態
    await setConversationState({
      ...state,
      messages: [...state.messages, salesMessage],
      status: "聆聽中...",
    })

    // 模擬客戶回應
    setTimeout(async () => {
      const updatedState = await getConversationState()
      await setConversationState({
        ...updatedState,
        status: "語音處理中...",
      })

      setTimeout(async () => {
        const updatedState = await getConversationState()
        await setConversationState({
          ...updatedState,
          status: "AI 正在生成回覆...",
        })

        setTimeout(async () => {
          const updatedState = await getConversationState()
          const customerResponse = {
            sender: "customer" as const,
            text: "謝謝您的解釋。我想了解一下這個產品的價格範圍，以及是否有任何促銷活動？",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          }

          await setConversationState({
            ...updatedState,
            messages: [...updatedState.messages, customerResponse],
            status: "對話進行中",
          })

          revalidatePath("/")
        }, 2000)
      }, 1500)
    }, 1500)

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Failed to send message:", error)
    return { success: false, error: "無法發送訊息" }
  }
}

export async function loadConversationHistoryAction(historyId: string) {
  try {
    // 在實際應用中，這裡會從數據庫加載對話歷史

    // 模擬從數據庫加載的歷史對話
    const historicalMessages: Message[] = [
      {
        sender: "sales",
        text: "這是一個歷史對話記錄。您好，我是ABC公司的銷售代表。",
        timestamp: "10:15",
      },
      {
        sender: "customer",
        text: "您好，我對貴公司的產品很感興趣。",
        timestamp: "10:16",
      },
      {
        sender: "sales",
        text: "非常感謝您的興趣！我們的產品有哪些方面是您特別想了解的呢？",
        timestamp: "10:17",
      },
    ]

    // 更新狀態
    setConversationState({
      currentConversationId: historyId,
      messages: historicalMessages,
      status: "歷史對話已載入",
    })

    revalidatePath("/")
    return { success: true, messages: historicalMessages }
  } catch (error) {
    console.error("Failed to load conversation history:", error)
    return { success: false, error: "無法載入對話歷史" }
  }
}
