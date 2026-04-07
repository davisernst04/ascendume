"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/sidebar-context";

export function SidebarToggleButton() {
  const { isOpen, toggleSidebar } = useSidebar();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleSidebar}
      className="shrink-0 text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800 focus:outline-none w-10 h-10"
      title={isOpen ? "Close sidebar" : "Open sidebar"}
    >
      {isOpen ? (
        <PanelLeftClose className="w-5 h-5" />
      ) : (
        <PanelLeftOpen className="w-5 h-5" />
      )}
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
}
