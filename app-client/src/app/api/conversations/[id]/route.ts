import { NextResponse } from "next/server"
import { conversations } from "@/lib/data/conversations"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const conversation = conversations.find((c) => c.id === id)

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    return NextResponse.json(conversation)
  } catch (error) {
    console.error("Error fetching conversation:", error)
    return NextResponse.json({ error: "Failed to fetch conversation" }, { status: 500 })
  }
}
