"use client";

import { ReactNode } from "react";
import { SidebarProvider, useSidebar } from "@/components/sidebar-context";

interface DashboardLayoutClientProps {
  sidebar: ReactNode;
  children: ReactNode;
}

function LayoutContent({ sidebar, children }: DashboardLayoutClientProps) {
  const { isOpen, toggleSidebar } = useSidebar();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar Container */}
      <div
        className={`group/sidebar relative shrink-0 transition-all duration-300 ease-in-out border-r border-zinc-800 ${
          isOpen ? "w-64" : "w-16"
        } bg-zinc-950 flex flex-col z-20`}
        data-state={isOpen ? "open" : "closed"}
      >
        <div className="flex-1 w-full overflow-hidden flex flex-col h-full">
          {sidebar}
        </div>
      </div>

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <div className="flex-1 overflow-auto bg-background">
          {children}
        </div>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 z-10 bg-background/80 backdrop-blur-sm"
          onClick={toggleSidebar}
        />
      )}
    </div>
  );
}

export function DashboardLayoutClient(props: DashboardLayoutClientProps) {
  return (
    <SidebarProvider>
      <LayoutContent {...props} />
    </SidebarProvider>
  );
}
