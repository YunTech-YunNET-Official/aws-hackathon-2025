import React from "react";
import { PlusCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function CustomerSelector() {
  return (
    <div className="p-4 w-full">
      <h1 className="text-lg font-bold mb-2">客戶選擇</h1>
      <div className="flex flex-col space-y-2">
        <div className="flex items-center space-x-2">
          <Select>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="請選擇一位客戶" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="customer1">客戶1</SelectItem>
              <SelectItem value="customer2">客戶2</SelectItem>
              <SelectItem value="customer3">客戶3</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" className="flex-1">
            <PlusCircle className="mr-2 h-4 w-4" />
            新增對話
          </Button>
          <Button variant="outline" className="flex-1">
            <RefreshCw className={"mr-2 h-4 w-4"} />
            重新載入
          </Button>
        </div>
      </div>
    </div>
  )
}
