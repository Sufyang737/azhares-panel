"use client";

import { useAuth } from "@/hooks/use-auth";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { UpcomingBirthdays } from "@/components/dashboard/upcoming-birthdays";
import { UpcomingEvents } from "@/components/dashboard/upcoming-events";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { Spinner } from "@/components/ui/spinner";

export default function DashboardPage() {
  const { user, loading, error } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-destructive">Error al cargar los datos del usuario</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <h1 className="text-3xl font-bold tracking-tight">
              ¡Hola, {user.username}! 👋
            </h1>
            <p className="text-muted-foreground">
              Bienvenido/a de nuevo. Aquí tienes un resumen de la actividad reciente.
            </p>
          </div>

          <div className="px-4 lg:px-6">
            <QuickActions rol={user.rol} />
          </div>

          <div className="grid gap-4 px-4 md:grid-cols-2 lg:px-6">
            <UpcomingEvents />
            <UpcomingBirthdays />
          </div>

          {user.rol === 'admin' && (
            <div className="px-4 lg:px-6">
              <ChartAreaInteractive />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
