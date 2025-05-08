"use client"

import { PanelLeftClose, PanelLeftOpen } from "lucide-react"

interface PanelToggleButtonProps {
  isPanelCollapsed: boolean
  togglePanel: () => void
  isMobile: boolean
}

export function PanelToggleButton({ isPanelCollapsed, togglePanel, isMobile }: PanelToggleButtonProps) {
  return (
    <button
      className="absolute top-1/2 transform -translate-y-1/2 z-10 bg-primary text-primary-foreground p-1 rounded-r-md"
      style={{ left: isPanelCollapsed ? "0" : isMobile ? "calc(100% - 24px)" : "calc(40% - 12px)" }}
      onClick={togglePanel}
      aria-label={isPanelCollapsed ? "展開面板" : "收合面板"}
    >
      {isPanelCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
    </button>
  )
}
