import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconCalendarEvent, IconUser, IconNotes, IconClock, IconEdit } from "@tabler/icons-react";
import { useState } from "react";
import { EditEventForm } from "./edit-event-form";

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
  onEventUpdated?: () => void;
}

export function EventDetailsDialog({ event, isOpen, onClose, onEventUpdated }: EventDetailsDialogProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  if (!event) return null;

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

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
    if (onEventUpdated) {
      onEventUpdated();
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="text-xl font-semibold">{event.nombre}</DialogTitle>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsEditDialogOpen(true)}
              className="h-8 w-8"
            >
              <IconEdit className="h-4 w-4" />
            </Button>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-start gap-4">
              <IconCalendarEvent className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="grid gap-1">
                <div className="font-medium">Fecha del Evento</div>
                <div className="text-sm text-muted-foreground">
                  {format(new Date(event.fecha), "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}
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

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar evento</DialogTitle>
          </DialogHeader>
          <EditEventForm
            initialData={{
              id: event.id,
              nombre: event.nombre,
              tipo: event.tipo,
              fecha: new Date(event.fecha),
              estado: event.estado,
              comentario: event.comentario || "",
              cliente_id: event.cliente?.id,
              planner_id: event.planner?.id,
            }}
            onSuccess={handleEditSuccess}
            onCancel={() => setIsEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
} 