import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { IconApps, IconCalendarEvent, IconUserPlus, IconTruck, IconReceipt, IconCalendar } from "@tabler/icons-react"
import Link from 'next/link'
import { cn } from "@/lib/utils"

interface QuickAction {
  title: string
  href: string
  description: string
  icon: JSX.Element
  color: string
}

interface QuickActionsProps {
  rol: string
}

export function QuickActions({ rol }: QuickActionsProps) {
  // Definir acciones por rol
  const actions: Record<string, QuickAction[]> = {
    admin: [
      {
        title: "Nuevo Evento",
        href: "/dashboard/events/new",
        description: "Crear un nuevo evento",
        icon: <IconCalendarEvent className="h-6 w-6" />,
        color: "text-rose-500"
      },
      {
        title: "Nuevo Cliente",
        href: "/dashboard/clients/new",
        description: "Registrar un nuevo cliente",
        icon: <IconUserPlus className="h-6 w-6" />,
        color: "text-sky-500"
      },
      {
        title: "Nuevo Proveedor",
        href: "/dashboard/providers/new",
        description: "Agregar un nuevo proveedor",
        icon: <IconTruck className="h-6 w-6" />,
        color: "text-violet-500"
      },
      {
        title: "Nuevo Registro",
        href: "/dashboard/contabilidad/new",
        description: "Crear registro contable",
        icon: <IconReceipt className="h-6 w-6" />,
        color: "text-emerald-500"
      }
    ],
    staff: [
      {
        title: "Nuevo Evento",
        href: "/dashboard/events/new",
        description: "Crear un nuevo evento",
        icon: <IconCalendarEvent className="h-6 w-6" />,
        color: "text-rose-500"
      },
      {
        title: "Nuevo Cliente",
        href: "/dashboard/clients/new",
        description: "Registrar un nuevo cliente",
        icon: <IconUserPlus className="h-6 w-6" />,
        color: "text-sky-500"
      },
      {
        title: "Ver Calendario",
        href: "/dashboard/events/calendar",
        description: "Ver calendario de eventos",
        icon: <IconCalendar className="h-6 w-6" />,
        color: "text-violet-500"
      }
    ],
    viewer: [
      {
        title: "Ver Eventos",
        href: "/dashboard/events",
        description: "Ver listado de eventos",
        icon: <IconCalendarEvent className="h-6 w-6" />,
        color: "text-rose-500"
      },
      {
        title: "Ver Calendario",
        href: "/dashboard/events/calendar",
        description: "Ver calendario de eventos",
        icon: <IconCalendar className="h-6 w-6" />,
        color: "text-sky-500"
      }
    ]
  }

  // Obtener acciones según el rol
  const userActions = actions[rol] || actions.viewer

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Accesos Rápidos</CardTitle>
        <IconApps className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {userActions.map((action, index) => (
            <Link
              key={index}
              href={action.href}
              className="flex items-center gap-4 rounded-lg border p-4 hover:bg-muted/50 transition-colors"
            >
              <div className={cn("p-2 rounded-full bg-muted", action.color)}>
                {action.icon}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">{action.title}</p>
                <p className="text-sm text-muted-foreground">{action.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 