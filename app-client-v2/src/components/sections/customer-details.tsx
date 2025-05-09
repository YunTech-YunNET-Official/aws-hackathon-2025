import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

export function CustomerDetails() {
  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>客戶資料</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-570px)] pr-4">
            <div className="space-y-4">
              <Badge>新標籤</Badge>
              <p>姓名: 王曉明</p>
              <p>Email: ming.chang@techco.com.tw</p>
              <p>電話: 0912-345-678</p>
              <p>地址: 台北市信義區</p>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>

  )
}
