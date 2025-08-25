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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { ReactSearchAutocomplete } from 'react-search-autocomplete';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Scale } from "lucide-react";
import { searchEventos } from "@/app/services/relations";

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
  const [eventResults, setEventResults] = useState<Evento[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [selectedEventName, setSelectedEventName] = useState<string | null>(null);

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
          
          // Ya no cargamos todos los eventos aquí para evitar listas enormes.
          // Dejamos la búsqueda bajo demanda con el input.

        } catch (error) {
          console.error("Error al cargar datos:", error);
        }
      }
    }
    loadInitialData();
  }, [open]);

  // Búsqueda de eventos por texto (igual que en Crear movimiento)
  const searchEventosHandler = async (value: string) => {
    if (selectedCategory !== 'evento') return;
    if (!value.trim()) {
      setEventResults([]);
      return;
    }
    setEventsLoading(true);
    try {
      const results = await searchEventos(value);
      setEventResults(results);
    } catch (error) {
      console.error('Error buscando eventos:', error);
      setEventResults([]);
    } finally {
      setEventsLoading(false);
    }
  };

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

  const recordsToShow = filteredRecords;

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

            {/* Búsqueda de evento (idéntica al crear movimiento) */}
            {selectedCategory === 'evento' && (
              <div>
                <h4 className="mb-2 text-sm font-medium">🎉 Evento</h4>
                {eventsLoading && (
                  <div className="p-2 text-sm flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Buscando...
                  </div>
                )}
                <ReactSearchAutocomplete
                  items={eventResults.map(e => ({ ...e, name: e.nombre }))}
                  onSearch={(string) => searchEventosHandler(string)}
                  onSelect={(item: Evento) => {
                    setSelectedEvent(item.id);
                    setSelectedEventName(item.nombre);
                  }}
                  onClear={() => {
                    setSelectedEvent(null);
                    setSelectedEventName(null);
                    setEventResults([]);
                  }}
                  placeholder="Buscar evento..."
                  autoFocus={false}
                  resultStringKeyName="name"
                  inputSearchString={selectedEventName || ""}
                  styling={{
                    height: "38px",
                    border: "1px solid #E5E7EB",
                    borderRadius: "6px",
                    backgroundColor: "white",
                    boxShadow: "none",
                    hoverBackgroundColor: "#F3F4F6",
                    color: "#111827",
                    fontSize: "14px",
                    fontFamily: "inherit",
                    clearIconMargin: "3px 8px 0 0",
                    zIndex: 20,
                  }}
                />
              </div>
            )}

            {/* Totales (mejor UI) */}
            {selectedCategory && (
              <div className="grid gap-3 sm:grid-cols-3">
                {/* Ingresos */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-muted-foreground">ARS</span>
                      <span className="font-mono text-base">
                        {formatCurrency(totals.ingresos.ars, 'ars')}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-muted-foreground">USD</span>
                      <span className="font-mono text-base">
                        {formatCurrency(totals.ingresos.usd, 'usd')}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Egresos */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Egresos Totales</CardTitle>
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-muted-foreground">ARS</span>
                      <span className="font-mono text-base">
                        {formatCurrency(totals.egresos.ars, 'ars')}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-muted-foreground">USD</span>
                      <span className="font-mono text-base">
                        {formatCurrency(totals.egresos.usd, 'usd')}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Ganancia */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ganancia Obtenida</CardTitle>
                    <Scale className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {(() => {
                      const netArs = totals.ingresos.ars - totals.egresos.ars;
                      const netUsd = totals.ingresos.usd - totals.egresos.usd;
                      return (
                        <>
                          <div className="flex items-baseline justify-between">
                            <span className="text-xs text-muted-foreground">ARS</span>
                            <span className={`font-mono text-base ${netArs >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                              {formatCurrency(netArs, 'ars')}
                            </span>
                          </div>
                          <div className="flex items-baseline justify-between">
                            <span className="text-xs text-muted-foreground">USD</span>
                            <span className={`font-mono text-base ${netUsd >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                              {formatCurrency(netUsd, 'usd')}
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  </CardContent>
                </Card>
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
