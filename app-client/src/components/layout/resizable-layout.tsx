import { cn } from "@/lib/utils"
import { LeftPanel } from "@/components/panels/left-panel"
import { RightPanel } from "@/components/panels/right-panel"

interface ResizableLayoutProps {
  isPanelCollapsed: boolean
  togglePanel: () => void
}

export function ResizableLayout({ isPanelCollapsed, togglePanel }: ResizableLayoutProps) {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* 左側面板 */}
      <div
        className={cn(
          "relative z-10 h-full transition-all duration-300 ease-in-out",
          "bg-card border-r flex flex-col",
          isPanelCollapsed ? "w-[60px]" : "w-[350px] max-w-[30%]",
        )}
      >
        <LeftPanel isPanelCollapsed={isPanelCollapsed} togglePanel={togglePanel} />
      </div>      

      {/* 右側面板 */}
      <div className="flex-1 w-full max-w-[1200px] mx-auto transition-all duration-300">
        <RightPanel />
      </div>
    </div>
  )
}