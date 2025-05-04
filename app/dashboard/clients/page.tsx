"use client"

import React, { useState, useEffect } from 'react';
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { IconBuilding } from "@tabler/icons-react";
import { ClientsDataTable, clientSchema } from "@/components/clients/clients-data-table";
import { Spinner } from '@/components/ui/spinner';
import { z } from 'zod';
import Link from 'next/link';

// Schema para validar la respuesta de la API
const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(clientSchema)
});

type Cliente = z.infer<typeof clientSchema>;

export default function ClientsPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Función para obtener clientes desde la API
  const fetchClientes = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/clientes');
      
      if (!response.ok) {
        throw new Error(`Error en la petición: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Datos recibidos de la API:", data);
      
      // Validar respuesta con Zod
      const validatedData = apiResponseSchema.parse(data);
      setClientes(validatedData.data);
      
    } catch (err) {
      console.error('Error fetching clientes:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-muted-foreground text-lg font-semibold">
                    Panel de Clientes
                  </h2>
                  <Button size="sm" className="h-8" asChild>
                    <Link href="/dashboard/clients/new">
                      <IconBuilding className="mr-2 h-4 w-4" />
                      Añadir Cliente
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="px-4 lg:px-6">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Spinner size="lg" />
                  </div>
                ) : error ? (
                  <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center">
                    <p className="text-destructive">Error: {error}</p>
                    <Button 
                      variant="outline"
                      className="mt-4" 
                      onClick={() => fetchClientes()}
                    >
                      Reintentar
                    </Button>
                  </div>
                ) : (
                  <ClientsDataTable data={clientes} />
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
} 