import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { parseDateFromDb } from "@/lib/date";

interface EditEventDialogProps {
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
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditEventDialog({ event, isOpen, onClose, onSuccess }: EditEventDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initialDate = parseDateFromDb(event.fecha);

  const [formData, setFormData] = useState({
    nombre: event.nombre,
    tipo: event.tipo,
    fecha: initialDate ? format(initialDate, "yyyy-MM-dd") : "",
    estado: event.estado,
    comentario: event.comentario || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/eventos/${event.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar el evento");
      }

      onSuccess();
    } catch (error) {
      console.error("Error al actualizar el evento:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Evento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nombre">Nombre del Evento</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, nombre: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tipo">Tipo de Evento</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, tipo: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="boda">Boda</SelectItem>
                  <SelectItem value="corporativo">Corporativo</SelectItem>
                  <SelectItem value="social">Social</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fecha">Fecha</Label>
              <Input
                id="fecha"
                type="date"
                value={formData.fecha}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, fecha: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="estado">Estado</Label>
              <Select
                value={formData.estado}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, estado: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en-curso">En Curso</SelectItem>
                  <SelectItem value="completado">Completado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="comentario">Comentarios</Label>
              <Textarea
                id="comentario"
                value={formData.comentario}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, comentario: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 
