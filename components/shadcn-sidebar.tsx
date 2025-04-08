"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  IconHome, 
  IconCalendarEvent, 
  IconUsers, 
  IconUserCircle, 
  IconBuildingStore, 
  IconReceipt, 
  IconSettings, 
  IconHelp,
  IconChevronLeft,
  IconChevronRight
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { dashboardConfig } from "@/config/dashboard";

interface SidebarProps {
  className?: string;
}

export function ShadcnSidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Recuperar estado del almacenamiento local al cargar
  useEffect(() => {
    const storedState = localStorage.getItem('sidebar-collapsed');
    if (storedState !== null) {
      setIsCollapsed(storedState === 'true');
    }
  }, []);
  
  // Guardar estado cuando cambia
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', isCollapsed.toString());
  }, [isCollapsed]);
  
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div 
      className={cn(
        "flex h-screen flex-col border-r bg-card transition-all duration-300",
        isCollapsed ? "w-[80px]" : "w-64",
        className
      )}
    >
      <div className="flex h-14 items-center border-b px-4 justify-between">
        {!isCollapsed && (
          <span className="font-semibold">Azares Master</span>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleCollapse} 
          className={cn("h-8 w-8", isCollapsed ? "mx-auto" : "")}
        >
          {isCollapsed ? <IconChevronRight className="h-4 w-4" /> : <IconChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
      
      <div className="flex-1 overflow-auto p-3">
        <div className="space-y-2">
          {dashboardConfig.navMain.map((item) => {
            const isActive = pathname === item.url || pathname.startsWith(`${item.url}/`);
            const Icon = item.icon;
            
            return (
              <Button
                key={item.url}
                variant={isActive ? "secondary" : "ghost"}
                asChild
                className={cn(
                  "w-full justify-start",
                  isCollapsed ? "px-2" : ""
                )}
              >
                <Link href={item.url}>
                  <Icon className="mr-2 h-4 w-4" />
                  {!isCollapsed && item.title}
                </Link>
              </Button>
            );
          })}
        </div>
        
        <div className="mt-6">
          <div className={cn("mb-2", isCollapsed ? "px-2 text-center" : "px-2")}>
            {!isCollapsed && <p className="text-xs font-medium text-muted-foreground">Soporte</p>}
          </div>
          
          <div className="space-y-2">
            {dashboardConfig.navSecondary.map((item) => {
              const isActive = pathname === item.url || pathname.startsWith(`${item.url}/`);
              const Icon = item.icon;
              
              return (
                <Button
                  key={item.url}
                  variant={isActive ? "secondary" : "ghost"}
                  asChild
                  className={cn(
                    "w-full justify-start",
                    isCollapsed ? "px-2" : ""
                  )}
                >
                  <Link href={item.url}>
                    <Icon className="mr-2 h-4 w-4" />
                    {!isCollapsed && item.title}
                  </Link>
                </Button>
              );
            })}
          </div>
        </div>
      </div>
      
      <div className="mt-auto border-t p-4">
        <div className={cn("flex items-center gap-2", isCollapsed ? "justify-center" : "")}>
          <div className="h-9 w-9 rounded-full bg-primary/10" />
          {!isCollapsed && (
            <div>
              <p className="text-sm font-medium">Usuario</p>
              <p className="text-xs text-muted-foreground">usuario@ejemplo.com</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 