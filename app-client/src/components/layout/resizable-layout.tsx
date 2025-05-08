import { cn } from "@/lib/utils"
import { PanelToggleButton } from "@/components/ui-elements/panel-toggle-button"
import { LeftPanel } from "@/components/panels/left-panel"
import { RightPanel } from "@/components/panels/right-panel"

interface ResizableLayoutProps {
  isPanelCollapsed: boolean
  togglePanel: () => void
}

export function ResizableLayout({ isPanelCollapsed, togglePanel }: ResizableLayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      {/* 左側面板 */}
      <div
        className={cn(
          "flex flex-col border-r transition-all duration-300 ease-in-out bg-card",
          isPanelCollapsed ? "w-0 overflow-hidden" : "w-2/5",
        )}
      >
        <LeftPanel isPanelCollapsed={isPanelCollapsed} />
      </div>
      
      {/* 左側摺疊按鈕 */}
      <PanelToggleButton isPanelCollapsed={isPanelCollapsed} togglePanel={togglePanel} isMobile={false} />

      {/* 右側面板 */}
      <div
        className={cn(
          "flex flex-col transition-all duration-300 ease-in-out",
          isPanelCollapsed ? "w-full" : "w-3/5",
        )}
      >
        <RightPanel />
      </div>
    </div>
  )
}