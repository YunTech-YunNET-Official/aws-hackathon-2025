import { Mic, PhoneOff } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ControlButtons() {
  return (
    <div className="p-4 w-full mt-auto">
      <div className="flex w-full justify-center space-x-8">
        <form>
          <Button className="flex-1">
            <Mic className={"mr-2 h-4 w-4"} />
            開始對話
          </Button>
        </form>

        <form>
          <Button variant="destructive" className="flex-1">
            <PhoneOff className="mr-2 h-4 w-4" />
            結束對話
          </Button>
        </form>
      </div>

      <div className="mt-2 text-sm text-gray-500">準備就緒</div>
    </div>
  )
}
