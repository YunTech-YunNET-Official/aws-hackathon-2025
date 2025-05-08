import { ConversationHistory } from "@/components/sections/conversation-history"
import { ChatDisplay } from "@/components/sections/chat-display"
import { MessageInput } from "@/components/sections/message-input"
import { StatusDisplay } from "@/components/sections/status-display"

export function RightPanel() {
  return (
    <>
      {/* Conversation History Selection */}
      <ConversationHistory />

      {/* Conversation Display */}
      <ChatDisplay />

      {/* Input Area */}
      <MessageInput />

      {/* Status Display */}
      <StatusDisplay />
    </>
  )
}
