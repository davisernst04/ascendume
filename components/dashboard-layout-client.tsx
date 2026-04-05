"use client";

import { useState } from "react";
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardLayoutClientProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

export function DashboardLayoutClient({ sidebar, children }: DashboardLayoutClientProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar Container */}
      <div
        className={`relative shrink-0 transition-all duration-300 ease-in-out border-r border-zinc-800 ${
          isSidebarOpen ? "w-64" : "w-0 border-r-0"
        } bg-zinc-950 overflow-hidden flex flex-col z-20`}
      >
        <div className="flex-1 w-64">
          {sidebar}
        </div>
      </div>

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Toggle Button for Open/Close */}
        <div className="absolute top-4 left-4 z-50">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-muted-foreground hover:text-foreground hover:bg-muted/50 focus:outline-none"
            title={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="w-5 h-5" />
            ) : (
              <PanelLeftOpen className="w-5 h-5" />
            )}
            <span className="sr-only">Toggle Sidebar</span>
          </Button>
        </div>

        <div className="flex-1 overflow-auto bg-background">
          {children}
        </div>
      </div>

      {/* Mobile Overlay (Optional for better mobile UX, could add later if needed) */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 z-10 bg-background/80 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}