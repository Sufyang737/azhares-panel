'use client';

import { useState, useEffect, useMemo } from "react";
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
import { BarChart3 } from "lucide-react";
import { ContabilidadRecord } from "@/app/services/contabilidad";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getEventos } from "@/app/services/relations";

interface Evento {
  id: string;
  nombre: string;
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

interface EventTotals {
  ingresos: {
    ars: number;
    usd: number;
  };
  egresos: {
    ars: number;
    usd: number;
  };
  records: ContabilidadRecord[];
}

export function EventReportDialog() {
  const [open, setOpen] = useState(false);
  const [allRecords, setAllRecords] = useState<ContabilidadRecord[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'evento' | 'oficina'>('evento');
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);

  // Cargar todos los datos al abrir el diálogo
  useEffect(() => {
    async function loadInitialData() {
      if (open) {
        try {
          // Cargar todos los registros contables
          const recordsResponse = await fetch('/api/contabilidad?perPage=999999');
          const recordsData = await recordsResponse.json();
          if (!recordsResponse.ok) throw new Error('Error al cargar registros');
          setAllRecords(recordsData.items);
          
          // Cargar todos los eventos
          const eventosData = await getEventos();
          setEventos(eventosData);

        } catch (error) {
          console.error("Error al cargar datos:", error);
        }
      }
    }
    loadInitialData();
  }, [open]);

  const filteredEvents = (eventos || []).sort((a, b) => a.nombre.localeCompare(b.nombre));

  // Filtrar registros por categoría y evento
  const filteredRecords = useMemo(() => allRecords.filter(r => {
    // Primero verificamos la categoría
    if (r.categoria !== selectedCategory) return false;
    
    // Si la categoría es 'oficina', no filtramos por evento
    if (selectedCategory === 'oficina') return true;
    
    // Si hay un evento seleccionado, filtramos por ese evento específico
    if (selectedEvent) {
      const eventId = typeof r.evento_id === 'object' ? r.evento_id.id : r.evento_id;
      return eventId === selectedEvent;
    }
    
    // Si no hay evento seleccionado, mostramos todos los de la categoría 'evento'
    return true;
  }), [allRecords, selectedCategory, selectedEvent]);

  const recordsToShow = selectedEvent ? filteredRecords.filter(r => r.evento_id === selectedEvent) : filteredRecords;

  // Calcular totales para la categoría seleccionada
  const totals = useMemo(() => {
    return recordsToShow.reduce((acc, record) => {
      const monto = record.montoEspera || 0;
      if (record.type === 'cobro') {
        if (record.moneda === 'ars') acc.ingresos.ars += monto;
        else acc.ingresos.usd += monto;
      } else {
        if (record.moneda === 'ars') acc.egresos.ars += monto;
        else acc.egresos.usd += monto;
      }
      return acc;
    }, {
      ingresos: { ars: 0, usd: 0 },
      egresos: { ars: 0, usd: 0 },
      records: recordsToShow
    } as EventTotals);
  }, [recordsToShow]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <BarChart3 className="h-4 w-4 mr-2" />
          Reporte Analítico
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[90vw] max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reporte Analítico</DialogTitle>
          <DialogDescription>
            Análisis detallado de ingresos y egresos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Selección de categoría */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h4 className="mb-2 text-sm font-medium">Categoría</h4>
              <Select
                value={selectedCategory}
                onValueChange={(value: 'evento' | 'oficina') => {
                  setSelectedCategory(value);
                  setSelectedEvent(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="evento">Eventos</SelectItem>
                  <SelectItem value="oficina">Oficina</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Selección de evento (solo si la categoría es evento) */}
            {selectedCategory === 'evento' && (
              <div>
                <h4 className="mb-2 text-sm font-medium">Eventos</h4>
                <Select
                  value={selectedEvent || ''}
                  onValueChange={setSelectedEvent}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar Evento" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredEvents.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Totales (mostrar siempre que haya una categoría seleccionada) */}
            {selectedCategory && (
              <div className="grid grid-cols-3 gap-8">
                <div>
                  <h4 className="mb-2 text-sm font-medium">Ingresos Totales</h4>
                  <div className="space-y-1">
                    <p>ARS: {formatCurrency(totals.ingresos.ars, 'ars')}</p>
                    <p>USD: {formatCurrency(totals.ingresos.usd, 'usd')}</p>
                  </div>
                </div>
                <div>
                  <h4 className="mb-2 text-sm font-medium">Egresos Totales</h4>
                  <div className="space-y-1">
                    <p>ARS: {formatCurrency(totals.egresos.ars, 'ars')}</p>
                    <p>USD: {formatCurrency(totals.egresos.usd, 'usd')}</p>
                  </div>
                </div>
                <div>
                  <h4 className="mb-2 text-sm font-medium">Ganancia Obtenida</h4>
                  <div className="space-y-1">
                    <p>ARS: {formatCurrency(totals.ingresos.ars - totals.egresos.ars, 'ars')}</p>
                    <p>USD: {formatCurrency(totals.ingresos.usd - totals.egresos.usd, 'usd')}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tabla de registros */}
          {selectedCategory && (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Tipo</TableHead>
                    <TableHead className="whitespace-nowrap">Método</TableHead>
                    <TableHead className="whitespace-nowrap">Moneda</TableHead>
                    <TableHead className="whitespace-nowrap">Subcargo</TableHead>
                    <TableHead className="whitespace-nowrap">Detalle</TableHead>
                    <TableHead className="whitespace-nowrap">Monto</TableHead>
                    <TableHead className="whitespace-nowrap">Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recordsToShow.length > 0 ? (
                    recordsToShow.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <Badge variant={record.type === 'cobro' ? 'default' : 'destructive'}>
                            {record.type === 'cobro' ? 'Ingreso' : 'Egreso'}
                          </Badge>
                        </TableCell>
                        <TableCell>{record.especie}</TableCell>
                        <TableCell>{record.moneda.toUpperCase()}</TableCell>
                        <TableCell>{record.subcargo || '-'}</TableCell>
                        <TableCell>{record.detalle || '-'}</TableCell>
                        <TableCell>{formatCurrency(record.montoEspera || 0, record.moneda)}</TableCell>
                        <TableCell>{formatDate(record.created)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">
                        No hay registros disponibles
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 