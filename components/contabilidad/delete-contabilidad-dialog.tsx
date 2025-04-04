"use client"

import { IconAlertTriangle, IconTrash } from "@tabler/icons-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

import { Contabilidad } from "@/app/dashboard/contabilidad/page"

interface DeleteContabilidadDialogProps {
  registro: Contabilidad | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onRegistroDeleted: (id: string) => void
}

export function DeleteContabilidadDialog({
  registro,
  open,
  onOpenChange,
  onRegistroDeleted,
}: DeleteContabilidadDialogProps) {
  if (!registro) {
    return null
  }

  // Función para formatear montos con moneda
  const formatMonto = (monto: number | null, moneda: string) => {
    if (monto === null) return "No establecido";
    
    const simbolo = '$'; // Mismo símbolo para USD y ARS
    
    const formateado = new Intl.NumberFormat('es-AR', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    }).format(monto);
    
    return `${simbolo} ${formateado} ${moneda.toUpperCase()}`;
  };

  // Manejar la eliminación
  const handleDelete = () => {
    onRegistroDeleted(registro.id)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <IconAlertTriangle className="h-5 w-5" /> Eliminar Registro
          </DialogTitle>
          <DialogDescription>
            Esta acción no se puede deshacer. ¿Estás seguro de que quieres eliminar este registro?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4">
            <div className="flex flex-col gap-2">
              <div><span className="font-medium">Tipo:</span> {registro.type === 'cobro' ? 'Cobro' : 'Pago'}</div>
              <div><span className="font-medium">Categoría:</span> {registro.categoria}</div>
              <div><span className="font-medium">Monto:</span> {formatMonto(registro.montoEspera, registro.moneda)}</div>
              <div><span className="font-medium">Estado:</span> {registro.fechaEfectuado ? 'Efectuado' : 'Pendiente'}</div>
              {registro.comentario && (
                <div><span className="font-medium">Comentario:</span> {registro.comentario}</div>
              )}
              <div><span className="font-medium">ID:</span> {registro.id}</div>
            </div>
          </div>
          
          <Separator />
          
          <div className="text-center text-sm text-muted-foreground">
            Al eliminar este registro, también se eliminará toda la información asociada a él.
          </div>
        </div>
        
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <IconTrash className="mr-2 h-4 w-4" />
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 