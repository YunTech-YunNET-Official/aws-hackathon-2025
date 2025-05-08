import { NextResponse } from "next/server"
import { conversations, addMessageToConversation } from "@/lib/data/conversations"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const conversation = conversations.find((c) => c.id === id)

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    const body = await request.json()
    const { message } = body

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // In a real application, this would process the message through an AI model
    // and generate a response based on the conversation context

    // Simulate customer response
    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    const customerResponse = {
      sender: "customer" as const,
      text: "謝謝您的解釋。我想了解一下這個產品的價格範圍，以及是否有任何促銷活動？",
      timestamp,
    }

    // Add message to conversation
    addMessageToConversation(id, {
      sender: "sales",
      text: message,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    })

    // Add customer response to conversation
    addMessageToConversation(id, customerResponse)

    return NextResponse.json({ customerResponse })
  } catch (error) {
    console.error("Error sending message:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}
