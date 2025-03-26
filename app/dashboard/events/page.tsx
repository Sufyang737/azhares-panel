import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { IconCalendarEvent, IconUsers, IconCoin, IconMapPin } from "@tabler/icons-react";

import { EventsDataTable } from "@/components/events/events-data-table";
import eventsData from "@/components/events/events-data.json";

export default function EventsPage() {
  // Calculate summary statistics
  const totalEvents = eventsData.length;
  const upcomingEvents = eventsData.filter(event => event.status === "Upcoming").length;
  const totalAttendees = eventsData.reduce((sum, event) => sum + event.attendees, 0);
  const totalBudget = eventsData.reduce((sum, event) => sum + event.budget, 0);

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
                      {new Set(eventsData.map(event => event.location)).size}
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
                  <Button size="sm" className="h-8">
                    <IconCalendarEvent className="mr-2 h-4 w-4" />
                    Add Event
                  </Button>
                </div>
              </div>
              <div className="px-4 lg:px-6">
                <EventsDataTable data={eventsData} />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
} 