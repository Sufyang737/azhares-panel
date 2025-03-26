import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { IconBuilding, IconUsers, IconCoin, IconChartPie } from "@tabler/icons-react";

import { ClientsDataTable } from "@/components/clients/clients-data-table";
import clientsData from "@/components/clients/clients-data.json";

export default function ClientsPage() {
  // Calculate summary statistics
  const totalClients = clientsData.length;
  const activeClients = clientsData.filter(client => client.status === "Active").length;
  const totalRevenue = clientsData.reduce((sum, client) => sum + client.totalSpent, 0);
  const avgSpend = Math.round(totalRevenue / totalClients);
  const industries = new Set(clientsData.map(client => client.industry)).size;

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
                      Total Clients
                    </CardTitle>
                    <IconBuilding className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalClients}</div>
                    <p className="text-muted-foreground text-xs">
                      {activeClients} active clients
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Industries
                    </CardTitle>
                    <IconChartPie className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{industries}</div>
                    <p className="text-muted-foreground text-xs">
                      Unique industries
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Revenue
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
                      }).format(totalRevenue)}
                    </div>
                    <p className="text-muted-foreground text-xs">
                      From all clients
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Average Spend
                    </CardTitle>
                    <IconUsers className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(avgSpend)}
                    </div>
                    <p className="text-muted-foreground text-xs">
                      Per client
                    </p>
                  </CardContent>
                </Card>
              </div>
              <div className="px-4 lg:px-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-muted-foreground text-lg font-semibold">
                    Clients Dashboard
                  </h2>
                  <Button size="sm" className="h-8">
                    <IconBuilding className="mr-2 h-4 w-4" />
                    Add Client
                  </Button>
                </div>
              </div>
              <div className="px-4 lg:px-6">
                <ClientsDataTable data={clientsData} />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
} 