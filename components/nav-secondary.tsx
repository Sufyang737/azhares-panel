"use client"

import { cn } from "@/lib/utils"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"

interface NavSecondaryProps {
  items: Array<{
    title: string
    url: string
    icon: React.ComponentType<{ className?: string }>
    roles?: string[]
  }>
  className?: string
}

export function NavSecondary({ items, className }: NavSecondaryProps) {
  return (
    <SidebarMenu className={cn("px-2", className)}>
      {items.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton
            asChild
            tooltip={item.title}
          >
            <a href={item.url}>
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}
