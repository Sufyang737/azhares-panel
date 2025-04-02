"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  IconUsers, 
  IconUserCheck, 
  IconUsersGroup,
  IconCalendarTime, 
  IconUserPlus
} from '@tabler/icons-react'
import { PeopleDataTable, personaSchema } from '@/components/people/people-data-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { z } from 'zod'
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Spinner } from '@/components/ui/spinner'
import Link from 'next/link'

// Schema para validar la respuesta de la API
const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(personaSchema),
  pagination: z.object({
    page: z.number(),
    perPage: z.number(),
    totalItems: z.number(),
    totalPages: z.number(),
  }),
});

type Persona = z.infer<typeof personaSchema>;

export default function PeoplePage() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Calcular estadísticas
  const totalPersonas = personas.length;
  const personasConEmail = personas.filter(p => p.email).length;
  const personasConTelefono = personas.filter(p => p.telefono).length;
  const personasConCliente = personas.filter(p => p.cliente_id).length;
  const tipoPersonaStats = personas.reduce((acc, p) => {
    if (p.tipo_persona) {
      acc[p.tipo_persona] = (acc[p.tipo_persona] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
  
  // Obtener el tipo de persona más común
  const tipoMasComun = Object.entries(tipoPersonaStats).sort((a, b) => b[1] - a[1])[0];
  
  // Función para obtener personas desde la API
  const fetchPersonas = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/personas?page=1&perPage=100&sort=-created');
      
      if (!response.ok) {
        throw new Error(`Error en la petición: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Datos recibidos de la API:", data);
      
      // Validar respuesta con Zod
      const validatedData = apiResponseSchema.parse(data);
      setPersonas(validatedData.data);
      
    } catch (err) {
      console.error('Error fetching personas:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonas();
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
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="grid gap-4 px-4 md:grid-cols-2 lg:grid-cols-4 lg:px-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Personas
                    </CardTitle>
                    <IconUsers className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalPersonas}</div>
                    <p className="text-muted-foreground text-xs">
                      Personas registradas
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
                    <div className="text-2xl font-bold">{personasConEmail}</div>
                    <p className="text-muted-foreground text-xs">
                      {totalPersonas > 0 
                        ? `${Math.round((personasConEmail / totalPersonas) * 100)}% del total`
                        : "No hay personas"}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Con Teléfono
                    </CardTitle>
                    <IconUsersGroup className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{personasConTelefono}</div>
                    <p className="text-muted-foreground text-xs">
                      {totalPersonas > 0 
                        ? `${Math.round((personasConTelefono / totalPersonas) * 100)}% del total`
                        : "No hay personas"}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Personas con Cliente
                    </CardTitle>
                    <IconCalendarTime className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {personasConCliente}
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {totalPersonas > 0 
                        ? `${Math.round((personasConCliente / totalPersonas) * 100)}% con cliente asociado`
                        : "No hay personas"}
                      {tipoMasComun && tipoMasComun[0] ? ` · Tipo más común: ${tipoMasComun[0]}` : ''}
                    </p>
                  </CardContent>
                </Card>
              </div>
              <div className="px-4 lg:px-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-muted-foreground text-lg font-semibold">
                    Directorio de Personas
                  </h2>
                  <Button size="sm" className="h-8" asChild>
                    <Link href="/dashboard/people/new">
                      <IconUserPlus className="mr-2 h-4 w-4" />
                      Añadir Persona
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
                      onClick={() => fetchPersonas()}
                    >
                      Reintentar
                    </Button>
                  </div>
                ) : (
                  <PeopleDataTable data={personas} />
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
} 