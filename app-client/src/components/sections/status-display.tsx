import { Mic, Loader2, Sparkles } from "lucide-react"

export function StatusDisplay() {

  return (
    <div className="p-2 border-t bg-muted/30 text-sm flex items-center">
      <span className="mr-2">狀態：</span>
      <span className="flex items-center">
        聆聽中 <Mic className="mr-1 h-4 w-4 animate-pulse" />
        語音處理中... <Loader2 className="mr-1 h-4 w-4 animate-spin" />
        正在生成回覆... <Sparkles className="mr-1 h-4 w-4 animate-pulse" />
      </span>
    </div>
  )
}
