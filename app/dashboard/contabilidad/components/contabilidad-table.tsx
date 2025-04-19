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
import { CheckCircle, Loader2, Check, Edit, MoreHorizontal } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ContabilidadTableProps {
  records: ContabilidadRecord[];
  onRecordUpdate?: () => void;
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

export function ContabilidadTable({ records, onRecordUpdate }: ContabilidadTableProps) {
  const { toast } = useToast();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [selectedClientId, setSelectedClientId] = useState<string>('all');

  // Obtener lista única de eventos
  const events = records
    .filter(r => r.evento_id?.id && r.evento_id?.nombre)
    .reduce((acc, record) => {
      if (!record.evento_id) return acc;
      
      const eventId = record.evento_id.id;
      const eventName = record.evento_id.nombre;
      
      if (!acc.some(e => e.id === eventId)) {
        acc.push({
          id: eventId,
          nombre: eventName
        });
      }
      return acc;
    }, [] as Array<{ id: string; nombre: string }>)
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  // Obtener lista única de clientes
  const clients = records
    .filter(r => r.cliente_id?.id && r.cliente_id?.nombre)
    .reduce((acc, record) => {
      if (!record.cliente_id) return acc;
      
      const clientId = record.cliente_id.id;
      const clientName = record.cliente_id.nombre;
      
      if (!acc.some(c => c.id === clientId)) {
        acc.push({
          id: clientId,
          nombre: clientName
        });
      }
      return acc;
    }, [] as Array<{ id: string; nombre: string }>)
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  // Filtrar registros
  const filteredRecords = records.filter(record => {
    if (selectedEventId !== 'all' && record.evento_id?.id !== selectedEventId) {
      return false;
    }
    if (selectedClientId !== 'all' && record.cliente_id?.id !== selectedClientId) {
      return false;
    }
    return true;
  });

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

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Filtro de Eventos */}
        <div className="w-full sm:w-auto">
          <label className="text-sm font-medium mb-2 block text-muted-foreground">
            Filtrar por Evento
          </label>
          <Select
            value={selectedEventId}
            onValueChange={setSelectedEventId}
          >
            <SelectTrigger className="w-full sm:w-[300px]">
              <SelectValue placeholder="Seleccionar evento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los eventos</SelectItem>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filtro de Clientes */}
        <div className="w-full sm:w-auto">
          <label className="text-sm font-medium mb-2 block text-muted-foreground">
            Filtrar por Cliente
          </label>
          <Select
            value={selectedClientId}
            onValueChange={setSelectedClientId}
          >
            <SelectTrigger className="w-full sm:w-[300px]">
              <SelectValue placeholder="Seleccionar cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los clientes</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

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
            {filteredRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center">
                  No hay registros disponibles
                </TableCell>
              </TableRow>
            ) : (
              filteredRecords.map((record) => (
                <TableRow key={record.id} className={updatingId === record.id ? "opacity-50" : ""}>
                  <TableCell>
                    <Badge variant={record.type === 'cobro' ? 'success' : 'destructive'}>
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
                      variant={record.fechaEfectuado ? 'success' : 'secondary'}
                      className="gap-2 px-3 py-1"
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
                          Marcar como {record.type === "ingreso" ? "cobrado" : "pagado"}
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar registro
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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