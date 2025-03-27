"use client";

import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { IconCalendarEvent, IconUsers, IconCoin, IconMapPin } from "@tabler/icons-react";

import { EventsDataTable } from "@/components/events/events-data-table";
import { CreateEventDialog } from "@/components/events/create-event-dialog";
import eventsData from "@/components/events/events-data.json";

export default function EventsPage() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [events, setEvents] = useState(eventsData);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // En un escenario real, podríamos usar useEffect para cargar datos de la API
  useEffect(() => {
    // Esta es una implementación de muestra para mostrar cómo se harían las peticiones
    // En una implementación real, haríamos una llamada fetch a nuestra API
    // async function fetchEvents() {
    //   try {
    //     const response = await fetch('/api/eventos');
    //     const result = await response.json();
    //     if (result.success) {
    //       setEvents(result.data);
    //     }
    //   } catch (error) {
    //     console.error('Error al obtener eventos:', error);
    //   }
    // }
    // fetchEvents();
  }, [refreshTrigger]);

  // Función para refrescar los datos
  const handleEventCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Calculate summary statistics
  const totalEvents = events.length;
  const upcomingEvents = events.filter(event => event.status === "Upcoming").length;
  const totalAttendees = events.reduce((sum, event) => sum + event.attendees, 0);
  const totalBudget = events.reduce((sum, event) => sum + event.budget, 0);

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
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="grid gap-4 px-4 md:grid-cols-2 lg:grid-cols-4 lg:px-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Events
                    </CardTitle>
                    <IconCalendarEvent className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalEvents}</div>
                    <p className="text-muted-foreground text-xs">
                      {upcomingEvents} upcoming
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Attendees
                    </CardTitle>
                    <IconUsers className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalAttendees.toLocaleString()}</div>
                    <p className="text-muted-foreground text-xs">
                      Across all events
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Budget
                    </CardTitle>
                    <IconCoin className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(totalBudget)}
                    </div>
                    <p className="text-muted-foreground text-xs">
                      Allocated for events
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Event Locations
                    </CardTitle>
                    <IconMapPin className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {new Set(events.map(event => event.location)).size}
                    </div>
                    <p className="text-muted-foreground text-xs">
                      Unique locations
                    </p>
                  </CardContent>
                </Card>
              </div>
              <div className="px-4 lg:px-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-muted-foreground text-lg font-semibold">
                    Events Dashboard
                  </h2>
                  <CreateEventDialog onEventCreated={handleEventCreated} />
                </div>
              </div>
              <div className="px-4 lg:px-6">
                <EventsDataTable data={events} />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
} 