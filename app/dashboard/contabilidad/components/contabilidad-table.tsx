'use client';

import { ContabilidadRecord, updateContabilidadRecord } from "@/app/services/contabilidad";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, isValid, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, Check, Edit, MoreHorizontal, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { CreateRecordDialog } from "./create-record-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RecordDetailsDialog } from "./record-details-dialog";
import { EditRecordDialog } from "./edit-record-dialog";

interface ContabilidadTableProps {
  records: ContabilidadRecord[];
  onRecordUpdate?: () => void;
  onRecordDelete?: (recordId: string) => void;
}

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return 'Fecha inválida';
    return format(date, 'dd/MM/yyyy', { locale: es });
  } catch (error) {
    console.error('Error formatting date:', dateString, error);
    return 'Error en fecha';
  }
};

export function ContabilidadTable({ records, onRecordUpdate, onRecordDelete }: ContabilidadTableProps) {
  const { toast } = useToast();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleMarkAsCompleted = async (record: ContabilidadRecord) => {
    try {
      setUpdatingId(record.id);
      toast({
        title: "Actualizando registro...",
        description: "Por favor espere mientras se procesa la actualización.",
      });

      const fechaEfectuado = new Date().toISOString();
      await updateContabilidadRecord(record.id, {
        fechaEfectuado
      });
      
      toast({
        title: "¡Registro efectuado!",
        description: (
          <div className="mt-2">
            <p>Se ha marcado como efectuado:</p>
            <p className="font-medium">{record.type === 'cobro' ? 'Cobro' : 'Pago'} de {record.montoEspera.toLocaleString('es-AR', {
              style: 'currency',
              currency: record.moneda === 'ars' ? 'ARS' : 'USD'
            })}</p>
            <p className="text-sm text-muted-foreground">Fecha: {formatDate(fechaEfectuado)}</p>
          </div>
        ),
      });

      if (onRecordUpdate) {
        onRecordUpdate();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al actualizar el registro",
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleMarkAsCollected = async (record: ContabilidadRecord) => {
    try {
      await updateContabilidadRecord(record.id, {
        fechaEfectuado: new Date().toISOString(),
      });
      
      toast({
        title: "Registro actualizado",
        description: "El registro ha sido marcado como cobrado/pagado.",
      });
    } catch (error) {
      console.error('Error al marcar como cobrado:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el registro.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer.")) {
      if (onRecordDelete) {
        onRecordDelete(recordId);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Especie</TableHead>
              <TableHead>Moneda</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Subcargo</TableHead>
              <TableHead>Detalle</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead>Fecha Esperada</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center">
                  No hay registros disponibles
                </TableCell>
              </TableRow>
            ) : (
              records.map((record) => (
                <TableRow key={record.id} className={updatingId === record.id ? "opacity-50" : ""}>
                  <TableCell>
                    <Badge variant={record.type === 'cobro' ? 'default' : 'destructive'}>
                      {record.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{record.especie}</TableCell>
                  <TableCell>
                    <Badge variant={record.moneda === 'usd' ? 'outline' : 'secondary'}>
                      {record.moneda.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>{record.categoria}</TableCell>
                  <TableCell>{record.subcargo}</TableCell>
                  <TableCell>{record.detalle}</TableCell>
                  <TableCell className="text-right font-mono">
                    {record.montoEspera.toLocaleString('es-AR', {
                      style: 'currency',
                      currency: record.moneda === 'ars' ? 'ARS' : 'USD'
                    })}
                  </TableCell>
                  <TableCell>
                    {formatDate(record.fechaEspera)}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={record.fechaEfectuado ? 'default' : 'secondary'}
                      className="gap-2 px-3 py-1"
                    >
                      {record.fechaEfectuado ? (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          Efectuado
                        </>
                      ) : (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Pendiente
                        </>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menú</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleMarkAsCollected(record)}
                          disabled={!!record.fechaEfectuado}
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Marcar como {record.type === "cobro" ? "cobrado" : "pagado"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteRecord(record.id)}
                          className="text-red-600 hover:text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <RecordDetailsDialog record={record} />
                    <EditRecordDialog record={record} onRecordUpdate={onRecordUpdate} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 