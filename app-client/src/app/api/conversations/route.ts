import { NextResponse } from "next/server"
import { conversations, addConversation } from "@/lib/data/conversations"
import { customers } from "@/lib/data/customers"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get("customerId")

    if (!customerId) {
      return NextResponse.json({ error: "Customer ID is required" }, { status: 400 })
    }

    const customerConversations = conversations
      .filter((conv) => conv.customerId === customerId)
      .map((conv) => ({
        id: conv.id,
        customerId: conv.customerId,
        customerName: customers.find((c) => c.id === conv.customerId)?.name || "Unknown",
        date: conv.date,
      }))

    return NextResponse.json(customerConversations)
  } catch (error) {
    console.error("Error fetching conversations:", error)
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { customerId, systemPrompt, openingScript } = body

    if (!customerId) {
      return NextResponse.json({ error: "Customer ID is required" }, { status: 400 })
    }

    const customer = customers.find((c) => c.id === customerId)
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    // Create a new conversation
    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    const initialMessage = {
      sender: "sales" as const,
      text:
        openingScript ||
        `您好，我是ABC公司的銷售代表。感謝您抽空與我們交流。請問您對我們的產品有什麼特別感興趣的地方嗎？`,
      timestamp,
    }

    const newConversation = addConversation(customerId, [initialMessage], systemPrompt)

    return NextResponse.json({
      conversationId: newConversation.id,
      messages: newConversation.messages,
    })
  } catch (error) {
    console.error("Error creating conversation:", error)
    return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 })
  }
}
