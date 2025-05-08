"use client"

import React from "react";
import { useContext } from "react"
import { PlusCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ConversationContext } from "@/context/conversation-context"
import { useCustomers } from "@/hooks/use-customers"

export function CustomerSelector() {
  const { handleCustomerSelect } = useContext(ConversationContext)
  const { customers, isLoading, refresh } = useCustomers()

  return (
    <div className="p-4 border-b">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center space-x-2">
          <Select onValueChange={handleCustomerSelect} disabled={isLoading}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={isLoading ? "載入中..." : "請選擇一位客戶"} />
            </SelectTrigger>
            <SelectContent>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.name} - {customer.company}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" className="flex-1">
            <PlusCircle className="mr-2 h-4 w-4" />
            新增對話
          </Button>
          <Button variant="outline" className="flex-1" onClick={refresh} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            重新載入
          </Button>
        </div>
      </div>
    </div>
  )
}
