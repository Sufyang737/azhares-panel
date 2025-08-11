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
import { CheckCircle, Loader2, Check, MoreHorizontal, Trash2, User, Building, PartyPopper, Users } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
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

const getRelationName = (expandData: ContabilidadRecord['expand'], relationKey: string): string => {
  if (expandData && expandData[relationKey] && typeof expandData[relationKey] === 'object' && expandData[relationKey].nombre) {
    return expandData[relationKey].nombre;
  }
  return 'N/A';
};

export function ContabilidadTable({ records, onRecordUpdate, onRecordDelete }: ContabilidadTableProps) {
  const { toast } = useToast();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleMarkAsCollected = async (record: ContabilidadRecord) => {
    setUpdatingId(record.id);
    try {
      await updateContabilidadRecord(record.id, {
        fechaEfectuado: new Date().toISOString(),
      });
      
      toast({
        title: "Registro actualizado",
        description: "El registro ha sido marcado como cobrado/pagado.",
      });

      if (onRecordUpdate) {
        onRecordUpdate();
      }
    } catch (error) {
      console.error('Error al marcar como cobrado:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el registro.",
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
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
              <TableHead>Comentario</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead>Fecha Esperada</TableHead>
              <TableHead><User className="h-4 w-4 inline-block mr-1"/>Cliente</TableHead>
              <TableHead><Building className="h-4 w-4 inline-block mr-1"/>Proveedor</TableHead>
              <TableHead><PartyPopper className="h-4 w-4 inline-block mr-1"/>Evento</TableHead>
              <TableHead><Users className="h-4 w-4 inline-block mr-1"/>Equipo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={14} className="text-center">
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
                  <TableCell>{record.comentario}</TableCell>
                  <TableCell className="text-right font-mono">
                    {record.montoEspera.toLocaleString('es-AR', {
                      style: 'currency',
                      currency: record.moneda === 'ars' ? 'ARS' : 'USD'
                    })}
                  </TableCell>
                  <TableCell>
                    {formatDate(record.fechaEspera)}
                  </TableCell>
                  <TableCell>{getRelationName(record.expand, 'cliente_id')}</TableCell>
                  <TableCell>{getRelationName(record.expand, 'proveedor_id')}</TableCell>
                  <TableCell>{getRelationName(record.expand, 'evento_id')}</TableCell>
                  <TableCell>{getRelationName(record.expand, 'equipo_id')}</TableCell>
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