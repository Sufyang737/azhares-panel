"use client"

import { z } from "zod"
import { 
  IconMail, 
  IconPhone, 
  IconWorld, 
  IconBrandInstagram, 
  IconMapPin,
  IconPercentage,
  IconTags
} from "@tabler/icons-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

import { proveedorSchema } from "./proveedores-data-table"

type Proveedor = z.infer<typeof proveedorSchema>

// Función para capitalizar la primera letra
const capitalizeFirstLetter = (string: string) => {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Mapa para nombres de países especiales
const NOMBRES_PAISES: Record<string, string> = {
  'espana': 'España',
  'usa': 'Estados Unidos',
};

// Función para formatear el nombre del país
const formatearPais = (codigo: string) => {
  if (!codigo) return '';
  return NOMBRES_PAISES[codigo] || capitalizeFirstLetter(codigo);
}

interface ViewProveedorDialogProps {
  proveedor: Proveedor | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ViewProveedorDialog({
  proveedor,
  open,
  onOpenChange,
}: ViewProveedorDialogProps) {
  if (!proveedor) {
    return null
  }

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {proveedor.nombre}
            {proveedor.alias && (
              <Badge variant="outline" className="ml-2">
                {proveedor.alias}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Detalles completos del proveedor
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Información de contacto</h3>
              <Separator className="my-2" />
              
              {proveedor.contacto && (
                <div className="text-sm text-muted-foreground mt-2">
                  <span className="font-medium text-foreground">Contacto:</span> {proveedor.contacto}
                </div>
              )}
              
              {proveedor.telefono && (
                <div className="flex items-center gap-2 mt-2">
                  <IconPhone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{proveedor.telefono}</span>
                </div>
              )}
              
              {proveedor.email && (
                <div className="flex items-center gap-2 mt-2">
                  <IconMail className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href={`mailto:${proveedor.email}`} 
                    className="text-sm text-blue-500 hover:underline"
                  >
                    {proveedor.email}
                  </a>
                </div>
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-medium">Ubicación</h3>
              <Separator className="my-2" />
              
              {proveedor.direccion && (
                <div className="flex items-center gap-2 mt-2">
                  <IconMapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{proveedor.direccion}</span>
                </div>
              )}
              
              {proveedor.pais && (
                <div className="text-sm text-muted-foreground mt-2">
                  <span className="font-medium text-foreground">País:</span> {formatearPais(proveedor.pais)}
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Enlaces</h3>
              <Separator className="my-2" />
              
              {proveedor.web && (
                <div className="flex items-center gap-2 mt-2">
                  <IconWorld className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href={proveedor.web} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-500 hover:underline truncate"
                  >
                    {proveedor.web}
                  </a>
                </div>
              )}
              
              {proveedor.instagram && (
                <div className="flex items-center gap-2 mt-2">
                  <IconBrandInstagram className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href={proveedor.instagram} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-500 hover:underline truncate"
                  >
                    {proveedor.instagram}
                  </a>
                </div>
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-medium">Detalles comerciales</h3>
              <Separator className="my-2" />
              
              {proveedor.comision !== null && proveedor.comision !== undefined && (
                <div className="flex items-center gap-2 mt-2">
                  <IconPercentage className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Comisión: {proveedor.comision}%</span>
                </div>
              )}
              
              {proveedor.categoria && (
                <div className="flex items-center gap-2 mt-2">
                  <IconTags className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Categoría: {proveedor.categoria}</span>
                </div>
              )}
              
              <div className="text-sm text-muted-foreground mt-4">
                <div><span className="font-medium text-foreground">ID:</span> {proveedor.id}</div>
                <div><span className="font-medium text-foreground">Creado:</span> {formatDate(proveedor.created)}</div>
                <div><span className="font-medium text-foreground">Actualizado:</span> {formatDate(proveedor.updated)}</div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 