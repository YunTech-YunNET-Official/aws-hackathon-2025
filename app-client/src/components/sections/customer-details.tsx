"use client"

import { useContext } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { ConversationContext } from "@/context/conversation-context"
import { useCustomerDetails } from "@/hooks/use-customer-details"

export function CustomerDetails() {
  const { selectedCustomer } = useContext(ConversationContext)
  const { customer, isLoading, error } = useCustomerDetails(selectedCustomer)

  if (!selectedCustomer) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-[200px]">
          <p className="text-muted-foreground text-center">請從上方選擇一位客戶以查看詳細資料。</p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>客戶資料</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <p className="text-muted-foreground text-center">載入中...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>客戶資料</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <p className="text-destructive text-center">{error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>客戶資料</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-450px)] pr-4">
          <div className="space-y-4">
            {customer &&
              Object.entries(customer.details || {}).map(([key, value]) => (
                <div key={key} className="grid grid-cols-3 gap-2">
                  <div className="text-muted-foreground">{key}：</div>
                  {key === "標籤" ? (
                    <div className="col-span-2 flex flex-wrap gap-2">
                      {(value as string[]).map((tag, index) => (
                        <Badge key={index}>{tag}</Badge>
                      ))}
                    </div>
                  ) : (
                    <div className="col-span-2 font-medium">{value as string}</div>
                  )}
                </div>
              ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
