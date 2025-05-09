import { CustomerSelector } from "@/components/sections/customer-selector"
import { CustomerDetails } from "@/components/sections/customer-details"
import { AIAssistanceSettings } from "@/components/sections/ai-assistance-settings"
import { ControlButtons } from "@/components/sections/control-buttons"
import { SidebarToggleButton } from "@/components/ui-elements/sidebar-toggle-button"

interface LeftPanelProps {
  isPanelCollapsed: boolean
  togglePanel?: () => void
}

export function LeftPanel({ isPanelCollapsed, togglePanel }: LeftPanelProps) {
  if (isPanelCollapsed) {
    return (
      <div className="flex flex-col h-full py-4 items-center">
        {togglePanel && <SidebarToggleButton isCollapsed={isPanelCollapsed} onToggle={togglePanel} />}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full max-h-screen overflow-hidden">
       {togglePanel && <SidebarToggleButton isCollapsed={isPanelCollapsed} onToggle={togglePanel} />}

      {/* Customer Selection Area */}
      <CustomerSelector />

      {/* Customer Details and AI Settings */}
      <div className="p-4 flex-grow overflow-auto">
        <CustomerDetails />

        {/* AI Assistance and Script Settings */}
        <AIAssistanceSettings />
      </div>

      {/* Control Buttons */}
      <ControlButtons />
    </div>
  )
}
