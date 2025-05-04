"use client"

import { z } from "zod"
import { 
  IconCalendar, 
  IconCoins, 
  IconCash, 
  IconBuildingBank, 
  IconReceipt,
  IconBuildingStore,
  IconUser,
  IconTicket,
  IconDeviceGamepad2
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

import { Contabilidad } from "@/app/dashboard/contabilidad/page"

interface ViewContabilidadDialogProps {
  registro: Contabilidad | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ViewContabilidadDialog({
  registro,
  open,
  onOpenChange,
}: ViewContabilidadDialogProps) {
  if (!registro) {
    return null
  }

  // Función para formatear fechas
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No establecido";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            {registro.type === "cobro" ? (
              <><IconCoins className="h-6 w-6 text-green-500" /> Cobro</>
            ) : (
              <><IconCash className="h-6 w-6 text-red-500" /> Pago</>
            )}
            <Badge variant={registro.type === "cobro" ? "success" : "destructive"} className="ml-2">
              {formatMonto(registro.montoEspera, registro.moneda)}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Detalles completos del registro
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Información Principal</h3>
              <Separator className="my-2" />
              
              <div className="text-sm text-muted-foreground mt-2">
                <span className="font-medium text-foreground">Categoría:</span> {registro.categoria}
              </div>
              
              <div className="text-sm text-muted-foreground mt-2">
                <span className="font-medium text-foreground">Subcargo:</span> {registro.subcargo}
              </div>
              
              <div className="text-sm text-muted-foreground mt-2">
                <span className="font-medium text-foreground">Detalle:</span> {registro.detalle}
              </div>
              
              <div className="flex items-center gap-2 mt-2">
                {registro.especie === 'efectivo' ? (
                  <IconCash className="h-4 w-4 text-muted-foreground" />
                ) : registro.especie === 'transferencia' ? (
                  <IconBuildingBank className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <IconCoins className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm capitalize">{registro.especie}</span>
              </div>
              
              {registro.comentario && (
                <div className="mt-4 text-sm">
                  <span className="font-medium text-foreground">Comentario:</span><br />
                  <div className="mt-1 p-2 bg-muted rounded-md">{registro.comentario}</div>
                </div>
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-medium">Fechas</h3>
              <Separator className="my-2" />
              
              <div className="flex items-center gap-2 mt-2">
                <IconCalendar className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm">
                  <span className="font-medium">Fecha Esperada:</span> {formatDate(registro.fechaEspera)}
                </div>
              </div>
              
              <div className="flex items-center gap-2 mt-2">
                <IconCalendar className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm">
                  <span className="font-medium">Fecha Efectuado:</span> {
                    registro.fechaEfectuado 
                    ? formatDate(registro.fechaEfectuado) 
                    : <Badge variant="outline" className="text-yellow-600">Pendiente</Badge>
                  }
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Información Monetaria</h3>
              <Separator className="my-2" />
              
              <div className="text-sm mt-2">
                <span className="font-medium text-foreground">Monto Esperado:</span>{" "}
                <span className={registro.type === "cobro" ? "text-green-600" : "text-red-600"}>
                  {formatMonto(registro.montoEspera, registro.moneda)}
                </span>
              </div>
              
              {registro.dolarEsperado && (
                <div className="text-sm mt-2">
                  <span className="font-medium text-foreground">Valor en Dólares:</span>{" "}
                  <span className={registro.type === "cobro" ? "text-green-600" : "text-red-600"}>
                    ${registro.dolarEsperado.toFixed(2)} USD
                  </span>
                </div>
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-medium">Relaciones</h3>
              <Separator className="my-2" />
              
              {registro.cliente_id && (
                <div className="flex items-center gap-2 mt-2">
                  <IconUser className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <span className="font-medium">Cliente:</span> {registro.cliente_id}
                  </span>
                </div>
              )}
              
              {registro.proveedor_id && (
                <div className="flex items-center gap-2 mt-2">
                  <IconBuildingStore className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <span className="font-medium">Proveedor:</span> {registro.proveedor_id}
                  </span>
                </div>
              )}
              
              {registro.evento_id && (
                <div className="flex items-center gap-2 mt-2">
                  <IconTicket className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <span className="font-medium">Evento:</span> {registro.evento_id}
                  </span>
                </div>
              )}
              
              {registro.equipo_id && (
                <div className="flex items-center gap-2 mt-2">
                  <IconDeviceGamepad2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <span className="font-medium">Equipo:</span> {registro.equipo_id}
                  </span>
                </div>
              )}
            </div>
            
            <div className="text-sm text-muted-foreground mt-4">
              <div><span className="font-medium text-foreground">ID:</span> {registro.id}</div>
              <div><span className="font-medium text-foreground">Creado:</span> {formatDate(registro.created)}</div>
              <div><span className="font-medium text-foreground">Actualizado:</span> {formatDate(registro.updated)}</div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 