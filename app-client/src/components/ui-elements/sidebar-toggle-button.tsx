"use client"

import { PanelLeftClose, PanelRightClose } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SidebarToggleButtonProps {
  isCollapsed: boolean
  onToggle: () => void
}

export function SidebarToggleButton({ isCollapsed, onToggle }: SidebarToggleButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onToggle}
      className={cn(
        "hover:bg-muted/80 focus:bg-muted/80",
        "border border-border/50 shadow-sm",
        isCollapsed
          ? "right-0 translate-x-1/2 rounded-l-none rounded-r-md"
          : "right-0 -translate-x-full rounded-r-none rounded-l-md",
        "top-4",
      )}
      aria-label={isCollapsed ? "展開側邊欄" : "收合側邊欄"}
    >
      {isCollapsed ? <PanelRightClose className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
    </Button>
  )
}
