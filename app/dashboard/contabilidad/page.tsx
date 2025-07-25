"use client";

import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { CreateRecordDialog } from "./components/create-record-dialog";
import { ContabilidadTable } from "./components/contabilidad-table";
import { ScheduledRecordsDialog } from "./components/scheduled-records-dialog";
import { DailyCashDialog } from "./components/daily-cash-dialog";
import { EventReportDialog } from "./components/event-report-dialog";
import { MonthlyReportDialog } from "./components/monthly-report-dialog";
import { FiltersDialog } from "./components/filters-dialog";
import { getContabilidadRecords, getFullContabilidadList, ContabilidadRecord, deleteContabilidadRecord } from "@/app/services/contabilidad";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2, ListFilter } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface FilterValues {
  categoria?: string;
  cliente_id?: string;
  proveedor_id?: string;
  evento_id?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}

export default function ContabilidadPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [activeFilters, setActiveFilters] = useState<FilterValues>({});
  const [showAllRecords, setShowAllRecords] = useState(false);
  const { toast } = useToast();
  
  const MAX_RECORDS = 1000; // Maximum number of records to fetch when showing all

  const loadRecords = async (page = 1, filters: FilterValues = {}) => {
    setLoading(true);
    try {
      // Construir el filtro para PocketBase
      let filter = '';
      
      if (filters.categoria) {
        filter += `categoria = "${filters.categoria}"`;
      }
      
      if (filters.cliente_id) {
        filter += filter ? ' && ' : '';
        filter += `cliente_id = "${filters.cliente_id}"`;
      }
      
      if (filters.proveedor_id) {
        filter += filter ? ' && ' : '';
        filter += `proveedor_id = "${filters.proveedor_id}"`;
      }
      
      if (filters.evento_id) {
        filter += filter ? ' && ' : '';
        filter += `evento_id = "${filters.evento_id}"`;
      }
      
      if (filters.fechaDesde) {
        filter += filter ? ' && ' : '';
        filter += `fechaEfectuado >= "${filters.fechaDesde} 00:00:00"`;
      }
      
      if (filters.fechaHasta) {
        filter += filter ? ' && ' : '';
        filter += `fechaEfectuado <= "${filters.fechaHasta} 23:59:59"`;
      }

      // Primero, obtener todos los registros para el cálculo
      console.log('Obteniendo todos los registros para cálculos...');
      const allRecords = await getFullContabilidadList({
        filter,
        expand: 'cliente_id,evento_id,proveedor_id,equipo_id'
      });

      if (!allRecords) {
        throw new Error('No se pudieron obtener los registros');
      }

      // Calcular totales en dólares efectivo
      console.log('Calculando totales...');
      const dollarCashRecords = allRecords.filter(record => 
        record.moneda === 'usd' && record.especie === 'efectivo'
      );

      const ingresos = dollarCashRecords
        .filter(record => record.type === 'cobro')
        .reduce((sum, record) => sum + (record.montoEspera || 0), 0);

      const egresos = dollarCashRecords
        .filter(record => record.type === 'pago')
        .reduce((sum, record) => sum + (record.montoEspera || 0), 0);

      const balance = ingresos - egresos;

      console.log('=== BALANCE DE DÓLARES EN EFECTIVO ===');
      console.log(`Total Cobros (USD): $${ingresos.toFixed(2)}`);
      console.log(`Total Pagos (USD): $${egresos.toFixed(2)}`);
      console.log(`Balance Final (USD): $${balance.toFixed(2)}`);
      console.log('Total registros procesados:', dollarCashRecords.length);
      console.log('====================================');

      // Luego, obtener los registros paginados para la tabla
      console.log('Obteniendo registros paginados para la tabla...');
      const options = {
        sort: '-created',
        expand: 'cliente_id,evento_id,proveedor_id,equipo_id',
        filter,
        page,
        perPage: showAllRecords ? MAX_RECORDS : 50
      };

      const paginatedData = await getContabilidadRecords(options);
      
      if (!paginatedData) {
        throw new Error('No se pudieron obtener los registros paginados');
      }

      setRecords(paginatedData.items || []);
      setTotalPages(paginatedData.totalPages || 1);
      setTotalItems(paginatedData.totalItems || 0);
      setCurrentPage(showAllRecords ? 1 : page);

      // Mostrar advertencia si hay demasiados registros
      if (showAllRecords && paginatedData.totalItems > MAX_RECORDS) {
        toast({
          title: "Advertencia",
          description: `Se están mostrando los primeros ${MAX_RECORDS} registros de un total de ${paginatedData.totalItems}. Use los filtros para reducir la cantidad de registros.`,
          variant: "default",
        });
      }
      
    } catch (error) {
      console.error("Error loading records:", error);
      setRecords([]);
      toast({
        title: "Error al cargar registros",
        description: error instanceof Error ? error.message : "No se pudieron cargar los registros contables. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords(currentPage, activeFilters);
  }, [currentPage, activeFilters]);

  const handleRecordUpdate = () => {
    loadRecords(currentPage, activeFilters);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleFiltersChange = (filters: FilterValues) => {
    setActiveFilters(filters);
    setCurrentPage(1); // Resetear a la primera página cuando se aplican filtros
  };

  const handleDeleteRecord = async (recordId: string) => {
    setLoading(true);
    try {
      await deleteContabilidadRecord(recordId);
      toast({
        title: "Registro eliminado",
        description: "El registro contable ha sido eliminado exitosamente.",
      });
      if (records.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        loadRecords(currentPage, activeFilters);
      }
    } catch (error) {
      console.error("Error deleting record:", error);
      toast({
        title: "Error al eliminar",
        description: "No se pudo eliminar el registro. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-2xl font-bold">Registros Contables</h2>
                    <p className="text-sm text-muted-foreground">
                      Total: {totalItems} registros
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowAllRecords(!showAllRecords);
                        loadRecords(1, activeFilters);
                      }}
                    >
                      <ListFilter className="h-4 w-4 mr-2" />
                      {showAllRecords ? "Ver paginado" : "Ver todos"}
                    </Button>
                    <FiltersDialog 
                      onFiltersChange={handleFiltersChange}
                      activeFilters={Object.keys(activeFilters).length}
                    />
                    <EventReportDialog />
                    <MonthlyReportDialog />
                    <DailyCashDialog />
                    <ScheduledRecordsDialog 
                      records={records}
                      onRecordUpdate={handleRecordUpdate}
                    />
                    <CreateRecordDialog onRecordCreated={handleRecordUpdate} />
                  </div>
                </div>
                {loading ? (
                  <div className="text-center py-4 flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Cargando registros...</span>
                  </div>
                ) : (
                  <>
                    <ContabilidadTable 
                      records={records} 
                      onRecordUpdate={handleRecordUpdate}
                      onRecordDelete={handleDeleteRecord}
                    />
                    <div className="mt-4 flex items-center justify-between px-2">
                      <div className="text-sm text-muted-foreground">
                        Página {currentPage} de {totalPages}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1 || loading}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages || loading}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
} 