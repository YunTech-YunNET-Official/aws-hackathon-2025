"use client"

import { useContext } from "react"
import { Mic, Loader2, Sparkles } from "lucide-react"
import { ConversationContext } from "@/context/conversation-context"

export function StatusDisplay() {
  const { status } = useContext(ConversationContext)

  return (
    <div className="p-2 border-t bg-muted/30 text-sm flex items-center">
      <span className="mr-2">狀態：</span>
      <span className="flex items-center">
        {status === "聆聽中..." && <Mic className="mr-1 h-4 w-4 animate-pulse" />}
        {status === "語音處理中..." && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
        {status === "AI 正在生成回覆..." && <Sparkles className="mr-1 h-4 w-4 animate-pulse" />}
        {status}
      </span>
    </div>
  )
}
