"use client"

import { useContext } from "react"
import { Mic, PhoneOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConversationContext } from "@/context/conversation-context"
import { useFormStatus } from "react-dom"
import { startConversationAction, endConversationAction } from "@/app/actions/conversation-actions"
import { useOptimistic } from "react"

function StartButton() {
  const { pending } = useFormStatus()

  return (
    <Button className="flex-1" type="submit" disabled={pending}>
      <Mic className={`mr-2 h-4 w-4 ${pending ? "animate-pulse" : ""}`} />
      {pending ? "開始中..." : "開始對話"}
    </Button>
  )
}

function EndButton() {
  const { pending } = useFormStatus()

  return (
    <Button variant="destructive" className="flex-1" type="submit" disabled={pending}>
      <PhoneOff className="mr-2 h-4 w-4" />
      {pending ? "結束中..." : "結束對話"}
    </Button>
  )
}

export function ControlButtons() {
  const { selectedCustomer, currentConversationId, systemPrompt, openingScript, status } =
    useContext(ConversationContext)
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(status, (state, newStatus: string) => newStatus)

  return (
    <div className="p-4 border-t mt-auto">
      <div className="flex space-x-2">
        <form
          action={async () => {
            if (!selectedCustomer) return
            setOptimisticStatus("開始對話中...")
            await startConversationAction(selectedCustomer, systemPrompt, openingScript)
          }}
        >
          <StartButton />
        </form>

        <form
          action={async () => {
            if (!currentConversationId) return
            setOptimisticStatus("結束對話中...")
            await endConversationAction()
          }}
        >
          <EndButton />
        </form>
      </div>
      {/* Display the optimistic status to use the variable and inform the user */}
      <div className="mt-2 text-sm text-gray-500">{optimisticStatus}</div>
    </div>
  )
}
