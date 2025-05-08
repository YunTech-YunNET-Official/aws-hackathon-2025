"use client"

import { useContext, useRef } from "react"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ConversationContext } from "@/context/conversation-context"
import type { KeyboardEvent } from "react"
import { useFormStatus } from "react-dom"
import { sendMessageAction } from "@/app/actions/conversation-actions"
import { useOptimistic } from "react"

function SendButton() {
  const { pending } = useFormStatus()

  return (
    <Button variant="ghost" size="icon" type="submit" aria-label="發送訊息" disabled={pending}>
      <Send className={`h-5 w-5 ${pending ? "animate-pulse" : ""}`} />
    </Button>
  )
}

export function MessageInput() {
  const { currentConversationId, messages } = useContext(ConversationContext)
  const [, addOptimisticMessage] = useOptimistic(messages, (state, newMessage: { text: string }) => [
    ...state,
    {
      sender: "sales" as const,
      text: newMessage.text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ])

  const formRef = useRef<HTMLFormElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      formRef.current?.requestSubmit()
    }
  }

  return (
    <form
      ref={formRef}
      className="p-4 border-t"
      action={async (formData) => {
        const message = formData.get("message") as string
        if (!message.trim() || !currentConversationId) return

        // Add optimistic update
        addOptimisticMessage({ text: message })

        // Reset textarea
        if (textareaRef.current) {
          textareaRef.current.value = ""
        }

        // Send message via server action
        await sendMessageAction(currentConversationId, message)
      }}
    >
      <div className="flex items-center space-x-2">
        <Textarea
          ref={textareaRef}
          name="message"
          placeholder="輸入訊息..."
          className="resize-none"
          rows={1}
          onKeyDown={handleKeyDown}
        />
        <SendButton />
      </div>
    </form>
  )
}
