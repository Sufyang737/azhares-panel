'use client';

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Eye } from "lucide-react";
import { ContabilidadRecord } from "@/app/services/contabilidad";
import { parseDateFromDb } from "@/lib/date";

interface RecordDetailsDialogProps {
  record: ContabilidadRecord;
}

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  const date = parseDateFromDb(dateString);
  if (!date) return 'Fecha inválida';
  return format(date, 'dd/MM/yyyy', { locale: es });
};

export function RecordDetailsDialog({ record }: RecordDetailsDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Eye className="h-4 w-4" />
          <span className="sr-only">Ver detalles</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalles del Registro</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Información básica */}
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Tipo de Registro</h3>
                <Badge variant={record.type === 'cobro' ? 'default' : 'destructive'} className="mt-1">
                  {record.type}
                </Badge>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Especie</h3>
                <p className="text-sm">{record.especie}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Moneda</h3>
                <Badge variant={record.moneda === 'usd' ? 'outline' : 'secondary'}>
                  {record.moneda.toUpperCase()}
                </Badge>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Monto</h3>
                <p className="text-sm font-mono">
                  {record.montoEspera.toLocaleString('es-AR', {
                    style: 'currency',
                    currency: record.moneda === 'ars' ? 'ARS' : 'USD'
                  })}
                </p>
              </div>
            </div>

            {/* Fechas y estado */}
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Fecha de Creación</h3>
                <p className="text-sm">{formatDate(record.created)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Fecha Esperada</h3>
                <p className="text-sm">{formatDate(record.fechaEspera)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Estado</h3>
                <Badge 
                  variant={record.fechaEfectuado ? 'default' : 'secondary'}
                  className="gap-2 mt-1"
                >
                  {record.fechaEfectuado ? (
                    <>
                      <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                      Efectuado el {formatDate(record.fechaEfectuado)}
                    </>
                  ) : (
                    <>
                      <span className="inline-block w-2 h-2 rounded-full bg-yellow-500" />
                      Pendiente
                    </>
                  )}
                </Badge>
              </div>
            </div>
          </div>

          {/* Detalles adicionales */}
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Categoría</h3>
              <p className="text-sm">{record.categoria}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Subcargo</h3>
              <p className="text-sm">{record.subcargo}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Detalle</h3>
              <p className="text-sm">{record.detalle}</p>
            </div>
          </div>

          {/* Referencias */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {record.cliente_id && typeof record.cliente_id === 'object' && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Cliente</h3>
                <p className="text-sm">{record.cliente_id.nombre}</p>
              </div>
            )}
            {record.proveedor_id && typeof record.proveedor_id === 'object' && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Proveedor</h3>
                <p className="text-sm">{record.proveedor_id.nombre}</p>
              </div>
            )}
            {record.evento_id && typeof record.evento_id === 'object' && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Evento</h3>
                <p className="text-sm">{record.evento_id.nombre}</p>
              </div>
            )}
            {record.equipo_id && typeof record.equipo_id === 'object' && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Equipo</h3>
                <p className="text-sm">{record.equipo_id.nombre}</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 
