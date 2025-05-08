import { ScrollArea } from "@/components/ui/scroll-area"

interface Message {
  sender: "user" | "sales";
  text: string;
  timestamp: string;
}

export function ChatDisplay() {
  const hardcodedMessages: Message[] = [
    { sender: "user", text: "你好，我想了解一下你們的服務。", timestamp: "上午 09:30" },
    { sender: "sales", text: "您好！很高興為您服務。請問您對哪方面的服務感興趣呢？我們提供多種解決方案。", timestamp: "上午 09:31" },
    { sender: "user", text: "我對企業級的雲端儲存方案比較感興趣。", timestamp: "上午 09:32" },
    { sender: "sales", text: "好的，我們的企業雲端儲存方案非常穩定且安全，有不同容量和功能的套餐可供選擇。", timestamp: "上午 09:33" },
    { sender: "user", text: "聽起來不錯，可以給我一份詳細的介紹資料嗎？", timestamp: "上午 09:34" },
    { sender: "sales", text: "當然，我馬上將資料寄到您的信箱。請問您的電子郵件是？", timestamp: "上午 09:35" },
  ];

  return (
    <ScrollArea className="flex-grow p-4">
      <div className="space-y-4">
        {hardcodedMessages.map((message, index) => (
          <div
            key={index}
            className={
              `flex ${message.sender === "sales" ? "justify-end" : "justify-start"}`
            }
          >
            <div
              className={
                `max-w-[80%] rounded-lg p-3 ${message.sender === "sales"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
                }`
              }
            >
              <p>{message.text}</p>
              <p className="text-xs mt-1 opacity-70">{message.timestamp}</p>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}