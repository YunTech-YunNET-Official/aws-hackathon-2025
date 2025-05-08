import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function ConversationHistory() {
  return (
    <div className="p-4 border-b">
      <div className="flex items-center space-x-2">
        <Select>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={"檢視歷史對話記錄"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="record1">紀錄1</SelectItem>
            <SelectItem value="record2">紀錄2</SelectItem>
          </SelectContent>
        </Select>
        <form>
          <Button variant="outline">
            <Trash2 className="mr-2 h-4 w-4" />
            清除目前內容
          </Button>
        </form>
      </div>
    </div>
  )
}
