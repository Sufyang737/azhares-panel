"use client";

import * as React from "react";
import { 
  IconDashboard,
  IconHelp, 
  IconSettings,
  IconCalendarEvent,
  IconBuilding,
  IconUserCircle,
  IconTruck,
  IconCash,
  IconUsers,
  type TablerIcon 
} from "@tabler/icons-react";
import { useAuth } from "@/lib/AuthContext";
import { Sidebar, SidebarContent, SidebarHeader } from "@/components/ui/sidebar";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";

interface NavItem {
  title: string;
  url: string;
  icon: TablerIcon;
  roles?: string[];
}

const navMain: NavItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: IconDashboard,
    roles: ['admin', 'planner', 'contabilidad', 'dev'],
  },
  {
    title: "Events",
    url: "/dashboard/events",
    icon: IconCalendarEvent,
    roles: ['admin', 'planner', 'dev'],
  },
  {
    title: "Clients",
    url: "/dashboard/clients",
    icon: IconBuilding,
    roles: ['admin', 'planner', 'dev'],
  },
  {
    title: "People",
    url: "/dashboard/people",
    icon: IconUserCircle,
    roles: ['admin', 'planner', 'dev'],
  },
  {
    title: "Team",
    url: "/dashboard/team",
    icon: IconUsers,
    roles: ['admin', 'dev'],
  },
  {
    title: "Proveedores",
    url: "/dashboard/proveedores",
    icon: IconTruck,
    roles: ['admin', 'planner', 'dev'],
  },
  {
    title: "Contabilidad",
    url: "/dashboard/contabilidad",
    icon: IconCash,
    roles: ['admin', 'contabilidad', 'dev'],
  },
];

const navSecondary: NavItem[] = [
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: IconSettings,
    roles: ["admin", "dev"]
  },
  {
    title: "Help",
    url: "/dashboard/help",
    icon: IconHelp,
    roles: ["admin", "planner", "contabilidad", "dev"]
  }
];

export function AppSidebar({ variant }: { variant?: 'sidebar' | 'floating' | 'inset' }) {
  const { user } = useAuth();
  const userRole = user?.rol?.toLowerCase() || "";

  // Transform user data to match NavUser expectations
  const navUserData = user ? {
    name: user.username || "",
    email: user.email || "",
    avatar: ""
  } : null;

  // Si el usuario es admin o dev, mostrar todas las rutas sin filtrar
  const filteredMainNav = (userRole === 'admin' || userRole === 'dev') 
    ? navMain 
    : navMain.filter(item => !item.roles || item.roles.includes(userRole));
    
  const filteredSecondaryNav = (userRole === 'admin' || userRole === 'dev')
    ? navSecondary
    : navSecondary.filter(item => !item.roles || item.roles.includes(userRole));

  return (
    <Sidebar variant={variant}>
      <SidebarContent>
        <SidebarHeader className="flex items-center justify-center py-6">
          <img
            src="/logo.png"
            alt="Azhares Logo"
            className="h-14 w-auto dark:brightness-0 dark:invert"
          />
        </SidebarHeader>
        <NavMain items={filteredMainNav} />
        <NavSecondary items={filteredSecondaryNav} className="mt-auto" />
        {navUserData && <NavUser user={navUserData} />}
      </SidebarContent>
    </Sidebar>
  );
}
