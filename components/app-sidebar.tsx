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
import { Sidebar, SidebarContent } from "@/components/ui/sidebar";
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
    roles: ['admin', 'planner', 'contabilidad', 'developer'],
  },
  {
    title: "Events",
    url: "/dashboard/events",
    icon: IconCalendarEvent,
    roles: ['admin', 'planner'],
  },
  {
    title: "Clients",
    url: "/dashboard/clients",
    icon: IconBuilding,
    roles: ['admin', 'planner'],
  },
  {
    title: "People",
    url: "/dashboard/people",
    icon: IconUserCircle,
    roles: ['admin', 'planner'],
  },
  {
    title: "Team",
    url: "/dashboard/team",
    icon: IconUsers,
    roles: ['admin'],
  },
  {
    title: "Proveedores",
    url: "/dashboard/proveedores",
    icon: IconTruck,
    roles: ['admin', 'planner'],
  },
  {
    title: "Contabilidad",
    url: "/dashboard/contabilidad",
    icon: IconCash,
    roles: ['admin', 'contabilidad'],
  },
];

const navSecondary: NavItem[] = [
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: IconSettings,
    roles: ["admin"]
  },
  {
    title: "Help",
    url: "/dashboard/help",
    icon: IconHelp,
    roles: ["admin", "planner", "contabilidad", "developer"]
  }
];

export function AppSidebar({ variant }: { variant?: 'sidebar' | 'floating' | 'inset' }) {
  const { user } = useAuth();
  const userRole = user?.rol || "";

  // Transform user data to match NavUser expectations
  const navUserData = user ? {
    name: user.username || "",
    email: user.email || "",
    avatar: ""
  } : null;

  const filteredMainNav = navMain.filter(item => !item.roles || item.roles.includes(userRole));
  const filteredSecondaryNav = navSecondary.filter(item => !item.roles || item.roles.includes(userRole));

  return (
    <Sidebar variant={variant}>
      <SidebarContent>
        <NavMain items={filteredMainNav} />
        <NavSecondary items={filteredSecondaryNav} className="mt-auto" />
        {navUserData && <NavUser user={navUserData} />}
      </SidebarContent>
    </Sidebar>
  );
}
