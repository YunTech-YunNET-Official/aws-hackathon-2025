import { NextResponse } from "next/server"
import { conversations } from "@/lib/data/conversations"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const id = params.id
  const conversation = conversations.find((c) => c.id === id)

  if (!conversation) {
    return new NextResponse("Conversation not found", { status: 404 })
  }

  // Set up Server-Sent Events
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      // Send initial status
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "status", status: "對話進行中" })}\n\n`))

      // Simulate status changes and customer responses
      setTimeout(() => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "status", status: "聆聽中..." })}\n\n`))

        setTimeout(() => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "status", status: "語音處理中..." })}\n\n`))

          setTimeout(() => {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "status", status: "AI 正在生成回覆..." })}\n\n`),
            )

            setTimeout(() => {
              const customerResponse = {
                sender: "customer",
                text: "謝謝您的解釋。我想了解一下這個產品的價格範圍，以及是否有任何促銷活動？",
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              }

              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "message", message: customerResponse })}\n\n`),
              )

              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "status", status: "對話進行中" })}\n\n`),
              )
            }, 2000)
          }, 1500)
        }, 1500)
      }, 1000)
    },
  })

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
