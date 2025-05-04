"use client"

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
<<<<<<< HEAD
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { IconBuilding } from "@tabler/icons-react";
=======
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconBuilding, IconUsers, IconCalendarEvent, IconUserCheck } from "@tabler/icons-react";
>>>>>>> 2f4eae2d6f2b11f494f7e573f7c7025b2f26268c
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
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="grid gap-4 px-4 md:grid-cols-2 lg:grid-cols-4 lg:px-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Clientes
            </CardTitle>
            <IconBuilding className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClientes}</div>
            <p className="text-muted-foreground text-xs">
              {clientesActivos} clientes activos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Con Email
            </CardTitle>
            <IconUserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientesConEmail}</div>
            <p className="text-muted-foreground text-xs">
              {totalClientes > 0 
                ? `${Math.round((clientesConEmail / totalClientes) * 100)}% del total`
                : "No hay clientes"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Con Teléfono
            </CardTitle>
            <IconUsers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientesConTelefono}</div>
            <p className="text-muted-foreground text-xs">
              {totalClientes > 0 
                ? `${Math.round((clientesConTelefono / totalClientes) * 100)}% del total`
                : "No hay clientes"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Próximos Eventos
            </CardTitle>
            <IconCalendarEvent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Date().toLocaleDateString()}
            </div>
            <p className="text-muted-foreground text-xs">
              Fecha actual
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="px-4 lg:px-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">
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
  );
} 