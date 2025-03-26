import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { IconUserCircle, IconBuildingCommunity, IconCalendarTime, IconUserPlus } from "@tabler/icons-react";

import { PeopleDataTable } from "@/components/people/people-data-table";
import peopleData from "@/components/people/people-data.json";

export default function PeoplePage() {
  // Calculate summary statistics
  const totalPeople = peopleData.length;
  const activePeople = peopleData.filter(person => person.status === "Active").length;
  const onLeavePeople = peopleData.filter(person => person.status === "On Leave").length;
  const departments = new Set(peopleData.map(person => person.department)).size;
  
  // Calculate average tenure in years
  const today = new Date();
  const totalDays = peopleData.reduce((sum, person) => {
    const hireDate = new Date(person.hireDate);
    const diffTime = Math.abs(today.getTime() - hireDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return sum + diffDays;
  }, 0);
  const avgTenure = (totalDays / totalPeople / 365).toFixed(1);

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
                      Total People
                    </CardTitle>
                    <IconUserCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalPeople}</div>
                    <p className="text-muted-foreground text-xs">
                      {activePeople} active
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Departments
                    </CardTitle>
                    <IconBuildingCommunity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{departments}</div>
                    <p className="text-muted-foreground text-xs">
                      Active departments
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Average Tenure
                    </CardTitle>
                    <IconCalendarTime className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {avgTenure} years
                    </div>
                    <p className="text-muted-foreground text-xs">
                      Company average
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      On Leave
                    </CardTitle>
                    <IconUserCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {onLeavePeople}
                    </div>
                    <p className="text-muted-foreground text-xs">
                      Currently on leave
                    </p>
                  </CardContent>
                </Card>
              </div>
              <div className="px-4 lg:px-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-muted-foreground text-lg font-semibold">
                    People Dashboard
                  </h2>
                  <Button size="sm" className="h-8">
                    <IconUserPlus className="mr-2 h-4 w-4" />
                    Add Person
                  </Button>
                </div>
              </div>
              <div className="px-4 lg:px-6">
                <PeopleDataTable data={peopleData} />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
} 