"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getContabilidadRecords, type ContabilidadRecord } from "@/app/services/contabilidad";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";
import { IconCalendarEvent, IconUserCircle, IconBuildingStore, IconTruck } from "@tabler/icons-react";
import { EventCalendar } from "@/app/components/events/event-calendar";

// Componente para el panel de contabilidad
function ContabilidadPanel() {
  const [records, setRecords] = useState<ContabilidadRecord[]>([]);

  const loadRecords = async () => {
    try {
      const response = await getContabilidadRecords({
        sort: '-created',
        expand: 'cliente_id,proveedor_id,evento_id,equipo_id'
      });
      setRecords(response?.items || []);
    } catch (error) {
      console.error("Error loading records:", error);
      setRecords([]);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  return (
    <Card className="col-span-7">
      <CardHeader>
        <CardTitle>Registros Contables</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          <Link href="/dashboard/contabilidad" className="text-primary hover:underline">
            Ver todos los registros
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente para los accesos directos
function QuickAccess({ rol }: { rol: string }) {
  if (rol === 'contabilidad') {
    return null; // No mostrar accesos rápidos para contabilidad
  }

  // Para el rol de planner y otros roles
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Link href="/dashboard/events">
        <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Eventos
            </CardTitle>
            <IconCalendarEvent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Gestionar</div>
            <p className="text-xs text-muted-foreground">
              Gestionar eventos
            </p>
          </CardContent>
        </Card>
      </Link>

      <Link href="/dashboard/people">
        <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Personas
            </CardTitle>
            <IconUserCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Gestionar</div>
            <p className="text-xs text-muted-foreground">
              Gestionar personas
            </p>
          </CardContent>
        </Card>
      </Link>

      <Link href="/dashboard/clients">
        <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Clientes
            </CardTitle>
            <IconBuildingStore className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Gestionar</div>
            <p className="text-xs text-muted-foreground">
              Gestionar clientes
            </p>
          </CardContent>
        </Card>
      </Link>

      <Link href="/dashboard/providers">
        <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Proveedores
            </CardTitle>
            <IconTruck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Gestionar</div>
            <p className="text-xs text-muted-foreground">
              Gestionar proveedores
            </p>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}

export default function Page() {
  const { user } = useAuth();
  const rol = user?.rol || 'planner';

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
              <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold">
                  Bienvenido, {user?.username || 'Usuario'}
                </h1>
                <p className="text-muted-foreground">
                  Aquí tienes un resumen de tu actividad
                </p>
              </div>

              <QuickAccess rol={rol} />

              {rol === 'contabilidad' ? (
                <ContabilidadPanel />
              ) : rol === 'planner' ? (
                <EventCalendar />
              ) : null}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
