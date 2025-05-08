"use client"

import { useState } from "react"
import { ResizableLayout } from "@/components/layout/resizable-layout"
import { ConversationProvider } from "@/context/conversation-context"

export function PhoneSalesSystem() {
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false)

  const togglePanel = () => {
    setIsPanelCollapsed(!isPanelCollapsed)
  }

  return (
    <ConversationProvider>
      <ResizableLayout isPanelCollapsed={isPanelCollapsed} togglePanel={togglePanel} />
    </ConversationProvider>
  )
}
