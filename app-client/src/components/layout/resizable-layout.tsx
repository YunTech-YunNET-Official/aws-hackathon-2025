"use client"

import { useMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { PanelToggleButton } from "@/components/ui-elements/panel-toggle-button"
import { LeftPanel } from "@/components/panels/left-panel"
import { RightPanel } from "@/components/panels/right-panel"

interface ResizableLayoutProps {
  isPanelCollapsed: boolean
  togglePanel: () => void
}

export function ResizableLayout({ isPanelCollapsed, togglePanel }: ResizableLayoutProps) {
  const isMobile = useMobile()

  return (
    <div className="flex h-screen bg-background">
      {/* Left Panel */}
      <div
        className={cn(
          "flex flex-col border-r transition-all duration-300 ease-in-out bg-card",
          isPanelCollapsed ? "w-0 overflow-hidden" : isMobile ? "w-full" : "w-2/5",
        )}
      >
        <LeftPanel isPanelCollapsed={isPanelCollapsed} />
      </div>

      {/* Panel Toggle Button */}
      <PanelToggleButton isPanelCollapsed={isPanelCollapsed} togglePanel={togglePanel} isMobile={isMobile} />

      {/* Right Panel */}
      <div
        className={cn(
          "flex flex-col transition-all duration-300 ease-in-out",
          isPanelCollapsed || isMobile ? "w-full" : "w-3/5",
        )}
      >
        <RightPanel />
      </div>
    </div>
  )
}
