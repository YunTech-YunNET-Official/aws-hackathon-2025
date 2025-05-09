// src/components/app-sidebar.tsx
import { CustomerSelector } from "@/components/sections/customer-selector";
import { CustomerDetails } from "@/components/sections/customer-details";
import { AIAssistanceSettings } from "@/components/sections/ai-assistance-settings";
import { ControlButtons } from "@/components/sections/control-buttons";

import {
    Sidebar,
    SidebarContent,
    SidebarGroup
} from "@/components/ui/sidebar";

export function AppSidebar() {
    return (
        <Sidebar>
            <SidebarContent className="flex flex-col h-full"> 
                <SidebarGroup className="flex flex-col items-center overflow-hidden"> {/* flex-1 和 overflow-hidden 很重要 */}
                    
                    <div className="w-full border-b">
                        <CustomerSelector />
                    </div>
                    
                    <div className="flex-1 w-full overflow-y-auto">
                        <CustomerDetails />
                        <AIAssistanceSettings />
                    </div>

                    <div className="w-full border-t">
                        <ControlButtons />
                    </div>

                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
}