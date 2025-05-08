"use client"

import { useContext } from "react"
import { Textarea } from "@/components/ui/textarea"
import { ConversationContext } from "@/context/conversation-context"

export function AIAssistanceSettings() {
  const { systemPrompt, setSystemPrompt, openingScript, setOpeningScript } = useContext(ConversationContext)

  return (
    <div className="mt-4 space-y-4">
      <div>
        <label htmlFor="system-prompt" className="block text-sm font-medium mb-1">
          系統 Prompt (AI 輔助)
        </label>
        <Textarea
          id="system-prompt"
          placeholder="輸入引導 AI 回應的通用指令或參考資訊..."
          rows={3}
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="opening-script" className="block text-sm font-medium mb-1">
          開場白腳本建議
        </label>
        <Textarea
          id="opening-script"
          placeholder="輸入常用的對話開場白或問候語..."
          rows={3}
          value={openingScript}
          onChange={(e) => setOpeningScript(e.target.value)}
        />
      </div>
    </div>
  )
}
