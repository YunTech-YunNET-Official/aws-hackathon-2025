"use client"

import { useContext } from "react"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ConversationContext } from "@/context/conversation-context"
import { useConversationHistories } from "@/hooks/use-conversation-histories"
import { clearConversationAction, loadConversationHistoryAction } from "@/app/actions/conversation-actions"

export function ConversationHistory() {
  const { selectedCustomer } = useContext(ConversationContext)
  const { histories, isLoading } = useConversationHistories(selectedCustomer)

  return (
    <div className="p-4 border-b">
      <div className="flex items-center space-x-2">
        <Select
          onValueChange={async (historyId) => {
            await loadConversationHistoryAction(historyId)
          }}
          disabled={isLoading || !selectedCustomer}
        >
          <SelectTrigger className="w-full">
            <SelectValue
              placeholder={
                isLoading
                  ? "載入中..."
                  : !selectedCustomer
                    ? "請先選擇客戶"
                    : histories.length === 0
                      ? "無歷史對話記錄"
                      : "檢視歷史對話記錄"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {histories.map((history) => (
              <SelectItem key={history.id} value={history.id}>
                {history.date} - {history.customerName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <form
          action={async () => {
            await clearConversationAction();
          }}
        >
          <Button variant="outline" type="submit">
            <Trash2 className="mr-2 h-4 w-4" />
            清除目前內容
          </Button>
        </form>
      </div>
    </div>
  )
}
