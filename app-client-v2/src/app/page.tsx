import { ConversationHistory } from "@/components/sections/conversation-history"
import { ChatDisplay } from "@/components/sections/chat-display"
import { StatusDisplay } from "@/components/sections/status-display"

export default function Home() {
  return (
    <div className="flex flex-col items-center w-full max-w-[1200px] mx-auto">
      {/* Conversation History Selection */}
      <ConversationHistory />

      {/* Conversation Display */}
      <ChatDisplay />

      {/* Status Display */}
      <StatusDisplay />

    </div>
  )
}
