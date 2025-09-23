import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { IconCalendarEvent, IconUser, IconNotes, IconClock } from "@tabler/icons-react";
import { parseDateFromDb } from "@/lib/date";

interface EventDetailsDialogProps {
  event: {
    id: string;
    nombre: string;
    tipo: string;
    fecha: string;
    estado: string;
    comentario?: string;
    cliente?: {
      id: string;
      nombre: string;
      contacto?: string;
      email?: string;
    } | null;
    planner?: {
      id: string;
      nombre: string;
    } | null;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EventDetailsDialog({ event, isOpen, onClose }: EventDetailsDialogProps) {
  if (!event) return null;

  const eventDate = parseDateFromDb(event.fecha);

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'en-curso':
        return 'bg-green-500';
      case 'completado':
        return 'bg-blue-500';
      case 'cancelado':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{event.nombre}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-start gap-4">
            <IconCalendarEvent className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="grid gap-1">
              <div className="font-medium">Fecha del Evento</div>
              <div className="text-sm text-muted-foreground">
                {eventDate
                  ? format(eventDate, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })
                  : 'Fecha no disponible'}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <IconUser className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="grid gap-1">
              <div className="font-medium">Cliente</div>
              <div className="text-sm text-muted-foreground">
                {event.cliente?.nombre || 'No especificado'}
                {event.cliente?.email && (
                  <div className="text-xs text-muted-foreground">{event.cliente.email}</div>
                )}
                {event.cliente?.contacto && (
                  <div className="text-xs text-muted-foreground">{event.cliente.contacto}</div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <IconClock className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="grid gap-1">
              <div className="font-medium">Estado y Tipo</div>
              <div className="flex gap-2">
                <Badge className={getStatusColor(event.estado)}>
                  {event.estado.charAt(0).toUpperCase() + event.estado.slice(1)}
                </Badge>
                <Badge variant="outline">{event.tipo}</Badge>
              </div>
            </div>
          </div>

          {event.comentario && (
            <div className="flex items-start gap-4">
              <IconNotes className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="grid gap-1">
                <div className="font-medium">Comentarios</div>
                <div className="text-sm text-muted-foreground">{event.comentario}</div>
              </div>
            </div>
          )}

          {event.planner && (
            <div className="flex items-start gap-4">
              <IconUser className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="grid gap-1">
                <div className="font-medium">Planner</div>
                <div className="text-sm text-muted-foreground">{event.planner.nombre}</div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 
