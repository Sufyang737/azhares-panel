"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

import {
  IconCalendarEvent,
  IconUserCircle,
  IconHome,
  IconUsers,
  IconBuildingStore,
  IconReceipt,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card">
      <div className="flex h-14 items-center border-b px-4">
        <span className="font-semibold">Orcish Communications</span>
      </div>
      
      <div className="flex-1 overflow-auto p-3">
        <div className="space-y-2">
          <Button
            variant={pathname === "/dashboard" ? "secondary" : "ghost"}
            asChild
            className="w-full justify-start"
          >
            <Link href="/dashboard">
              <IconHome className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <Button
            variant={pathname.includes("/dashboard/events") ? "secondary" : "ghost"}
            asChild
            className="w-full justify-start"
          >
            <Link href="/dashboard/events">
              <IconCalendarEvent className="mr-2 h-4 w-4" />
              Events
            </Link>
          </Button>
          <Button
            variant={pathname.includes("/dashboard/clients") ? "secondary" : "ghost"}
            asChild
            className="w-full justify-start"
          >
            <Link href="/dashboard/clients">
              <IconUsers className="mr-2 h-4 w-4" />
              Clients
            </Link>
          </Button>
          <Button
            variant={pathname.includes("/dashboard/people") ? "secondary" : "ghost"}
            asChild
            className="w-full justify-start"
          >
            <Link href="/dashboard/people">
              <IconUserCircle className="mr-2 h-4 w-4" />
              People
            </Link>
          </Button>
          <Button
            variant={pathname.includes("/dashboard/proveedores") ? "secondary" : "ghost"}
            asChild
            className="w-full justify-start"
          >
            <Link href="/dashboard/proveedores">
              <IconBuildingStore className="mr-2 h-4 w-4" />
              Proveedores
            </Link>
          </Button>
          <Button
            variant={pathname.includes("/dashboard/contabilidad") ? "secondary" : "ghost"}
            asChild
            className="w-full justify-start"
          >
            <Link href="/dashboard/contabilidad">
              <IconReceipt className="mr-2 h-4 w-4" />
              Contabilidad
            </Link>
          </Button>
        </div>
      </div>
      
      <div className="mt-auto border-t p-4">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-full bg-primary/10" />
          <div>
            <p className="text-sm font-medium">Usuario</p>
            <p className="text-xs text-muted-foreground">usuario@ejemplo.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
