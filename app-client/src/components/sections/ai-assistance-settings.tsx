import { Textarea } from "@/components/ui/textarea"

export function AIAssistanceSettings() {
  return (
    <div className="mt-4 space-y-4">
      <div>
        <label htmlFor="system-prompt" className="block text-sm font-medium mb-1">
          系統 Prompt
        </label>
        <Textarea
          id="system-prompt"
          placeholder="輸入引導 AI 回應的通用指令或參考資訊..."
          rows={3}
        />
      </div>
      <div>
        <label htmlFor="opening-script" className="block text-sm font-medium mb-1">
          開場白
        </label>
        <Textarea
          id="opening-script"
          placeholder="輸入常用的對話開場白或問候語..."
          rows={3}
        />
      </div>
    </div>
  )
}
