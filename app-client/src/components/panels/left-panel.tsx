import { CustomerSelector } from "@/components/sections/customer-selector"
import { CustomerDetails } from "@/components/sections/customer-details"
import { AIAssistanceSettings } from "@/components/sections/ai-assistance-settings"
import { ControlButtons } from "@/components/sections/control-buttons"

interface LeftPanelProps {
  isPanelCollapsed: boolean
}

export function LeftPanel({ isPanelCollapsed }: LeftPanelProps) {
  if (isPanelCollapsed) return null

  return (
    <>
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
    </>
  )
}
