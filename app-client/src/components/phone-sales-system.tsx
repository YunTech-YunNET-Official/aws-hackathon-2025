"use client"

import { useState } from "react"
import { ResizableLayout } from "@/components/layout/resizable-layout"

export function PhoneSalesSystem() {
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false)

  const togglePanel = () => {
    setIsPanelCollapsed(!isPanelCollapsed)
  }

  return (
    <ResizableLayout isPanelCollapsed={isPanelCollapsed} togglePanel={togglePanel} />
  )
}
