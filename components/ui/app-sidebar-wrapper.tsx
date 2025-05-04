"use client";

import { Sidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

interface AppSidebarWrapperProps {
  variant?: "sidebar" | "floating" | "inset";
}

export function AppSidebarWrapper({ variant = "inset" }: AppSidebarWrapperProps) {
  return (
    <Sidebar variant={variant}>
      <AppSidebar />
    </Sidebar>
  );
} 