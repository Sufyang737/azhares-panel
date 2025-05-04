'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format, isValid, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarClock, CheckCircle, Loader2 } from "lucide-react";
import { ContabilidadRecord, updateContabilidadRecord } from "@/app/services/contabilidad";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ScheduledRecordsDialogProps {
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

const formatCurrency = (amount: number, currency: string): string => {
  return amount.toLocaleString('es-AR', {
    style: 'currency',
    currency: currency === 'ars' ? 'ARS' : 'USD'
  });
};

export function ScheduledRecordsDialog({ records, onRecordUpdate }: ScheduledRecordsDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Filtrar solo los registros programados (sin fechaEfectuado)
  const scheduledRecords = records.filter(record => !record.fechaEfectuado);

  // Calcular totales por moneda
  const totals = scheduledRecords.reduce((acc, record) => {
    const key = record.moneda.toUpperCase();
    acc[key] = (acc[key] || 0) + record.montoEspera;
    return acc;
  }, {} as Record<string, number>);

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
            <p className="font-medium">{record.type === 'cobro' ? 'Cobro' : 'Pago'} de {formatCurrency(record.montoEspera, record.moneda)}</p>
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <CalendarClock className="h-4 w-4" />
          Programados
          {scheduledRecords.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {scheduledRecords.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-[95vw]">
        <DialogHeader>
          <DialogTitle>Registros Programados</DialogTitle>
          <DialogDescription className="flex gap-4 pt-2">
            {Object.entries(totals).map(([currency, amount]) => (
              <div key={currency} className="flex items-center gap-2">
                <Badge variant={currency === 'USD' ? 'outline' : 'secondary'}>
                  {currency}
                </Badge>
                <span className="font-mono font-medium">
                  {formatCurrency(amount, currency.toLowerCase())}
                </span>
              </div>
            ))}
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Especie</TableHead>
                <TableHead>Moneda</TableHead>
                <TableHead>Detalle</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead>Fecha Esperada</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scheduledRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                    No hay registros programados
                  </TableCell>
                </TableRow>
              ) : (
                scheduledRecords.map((record) => (
                  <TableRow 
                    key={record.id}
                    className={updatingId === record.id ? "opacity-50" : ""}
                  >
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
                    <TableCell>{record.detalle}</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(record.montoEspera, record.moneda)}
                    </TableCell>
                    <TableCell>{formatDate(record.fechaEspera)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-green-500 hover:text-green-600"
                        disabled={updatingId === record.id}
                        onClick={() => handleMarkAsCompleted(record)}
                      >
                        {updatingId === record.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
} 