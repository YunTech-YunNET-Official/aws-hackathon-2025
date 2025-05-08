import { NextResponse } from "next/server"
import { conversations, updateConversation } from "@/lib/data/conversations"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const conversation = conversations.find((c) => c.id === id)

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    // Update conversation status to ended
    updateConversation(id, { ...conversation, status: "ended" })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error ending conversation:", error)
    return NextResponse.json({ error: "Failed to end conversation" }, { status: 500 })
  }
}
