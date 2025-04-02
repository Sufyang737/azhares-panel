"use client"

import { useState, useEffect } from "react"
import { z } from "zod"
import { toast } from "sonner"
import { IconLoader2, IconAlertTriangle } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

import { proveedorSchema } from "./proveedores-data-table"

type Proveedor = z.infer<typeof proveedorSchema>

interface DeleteProveedorDialogProps {
  proveedor: Proveedor | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onProveedorDeleted?: (id: string) => void
}

export function DeleteProveedorDialog({
  proveedor,
  open,
  onOpenChange,
  onProveedorDeleted,
}: DeleteProveedorDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [hasAttemptedDelete, setHasAttemptedDelete] = useState(false)
  
  // Reiniciar el estado cuando cambia el diálogo
  useEffect(() => {
    if (open) {
      setHasAttemptedDelete(false)
    }
  }, [open])
  
  // Manejar la eliminación del proveedor
  const handleDelete = async () => {
    if (!proveedor || hasAttemptedDelete) return
    
    setIsDeleting(true)
    setHasAttemptedDelete(true)
    
    try {
      const response = await fetch(`/api/proveedores?id=${proveedor.id}`, {
        method: 'DELETE',
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success(result.message || "Proveedor eliminado correctamente")
        // Notificar al componente padre sobre la eliminación
        if (onProveedorDeleted) {
          onProveedorDeleted(proveedor.id)
        }
        // Cerrar el diálogo
        onOpenChange(false)
      } else {
        toast.error(result.error || "Error al eliminar el proveedor")
        setHasAttemptedDelete(false)
      }
    } catch (error) {
      console.error("Error al eliminar proveedor:", error)
      toast.error("Error al comunicarse con el servidor")
      setHasAttemptedDelete(false)
    } finally {
      setIsDeleting(false)
    }
  }
  
  if (!proveedor) return null
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconAlertTriangle className="h-5 w-5 text-destructive" />
            Eliminar Proveedor
          </DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que deseas eliminar a este proveedor? Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm font-medium">Información del proveedor:</p>
          <p className="text-sm"><strong>Nombre:</strong> {proveedor.nombre}</p>
          {proveedor.contacto && (
            <p className="text-sm"><strong>Contacto:</strong> {proveedor.contacto}</p>
          )}
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isDeleting || hasAttemptedDelete}
          >
            {isDeleting ? (
              <>
                <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                Eliminando...
              </>
            ) : (
              hasAttemptedDelete ? "Procesando..." : "Eliminar Proveedor"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 