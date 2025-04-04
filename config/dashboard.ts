import {
  IconHome,
  IconCalendarEvent,
  IconUsers,
  IconUserCircle,
  IconBuildingStore,
  IconReceipt,
  IconSettings,
  IconHelp,
} from "@tabler/icons-react"

export const dashboardConfig = {
  companyLogo: "/logo.svg",
  user: {
    name: "Usuario Demo",
    email: "demo@orcish.com",
    avatar: "/avatars/user.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconHome,
    },
    {
      title: "Events",
      url: "/dashboard/events",
      icon: IconCalendarEvent,
    },
    {
      title: "Clients",
      url: "/dashboard/clients",
      icon: IconUsers,
    },
    {
      title: "People",
      url: "/dashboard/people",
      icon: IconUserCircle,
    },
    {
      title: "Proveedores",
      url: "/dashboard/proveedores",
      icon: IconBuildingStore,
    },
    {
      title: "Contabilidad",
      url: "/dashboard/contabilidad",
      icon: IconReceipt,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: IconSettings,
    },
    {
      title: "Help",
      url: "/dashboard/help",
      icon: IconHelp,
    },
  ],
} 