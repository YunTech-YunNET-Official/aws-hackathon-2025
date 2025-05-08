import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

export function MessageInput() {
  return (
    <form>
      <div className="flex items-center space-x-2">
        <Textarea
          name="message"
          placeholder="輸入訊息..."
          className="resize-none"
          rows={1}
        />
        <Button variant="ghost" size="icon">
          <Send className={"h-5 w-5"} />
        </Button>
      </div>
    </form>
  )
}
