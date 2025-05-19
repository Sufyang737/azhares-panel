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
import { getContabilidadRecords } from "@/app/services/contabilidad";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

export default function ContabilidadPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const perPage = 20;

  const loadRecords = async (page = 1) => {
    setLoading(true);
    try {
      const data = await getContabilidadRecords({
        sort: '-created',
        expand: 'cliente_id,evento_id',
        page,
        perPage
      });
      setRecords(data?.items || []);
      setTotalPages(data?.totalPages || 1);
      setTotalItems(data?.totalItems || 0);
      setCurrentPage(page);
    } catch (error) {
      console.error("Error loading records:", error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords(currentPage);
  }, [currentPage]);

  const handleRecordUpdate = () => {
    loadRecords(currentPage);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
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
                    <EventReportDialog records={records} />
                    <MonthlyReportDialog records={records} />
                    <DailyCashDialog records={records} />
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