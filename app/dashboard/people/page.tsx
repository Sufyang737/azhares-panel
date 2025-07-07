"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  IconUserPlus
} from '@tabler/icons-react'
import { PeopleDataTable, personaSchema } from '@/components/people/people-data-table'
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
    totalPages: z.number()
  })
});

type Persona = z.infer<typeof personaSchema>;

interface RawPersona {
  id?: string;
  nombre?: string;
  apellido?: string;
  telefono?: string | null;
  email?: string;
  cumpleanio?: string | null;
  pais?: string | null;
  ciudad?: string | null;
  instagram?: string | null;
  direccion?: string | null;
  comentario?: string | null;
  tipo_persona?: string | null;
  cliente_id?: string | null;
  expand?: {
    cliente_id?: {
      id: string;
      nombre: string;
    };
  };
  relacion?: string | null;
  created?: string;
  updated?: string;
}

// Función para limpiar y validar los datos de una persona
function sanitizePersonaData(persona: RawPersona) {
  return {
    id: persona.id || '',
    nombre: persona.nombre || '',
    apellido: persona.apellido || '',
    telefono: persona.telefono || null,
    email: persona.email && persona.email.includes('@') ? persona.email : null,
    cumpleanio: persona.cumpleanio || null,
    pais: persona.pais || null,
    ciudad: persona.ciudad || null,
    instagram: persona.instagram || null,
    direccion: persona.direccion || null,
    comentario: persona.comentario || null,
    tipo_persona: persona.tipo_persona || null,
    cliente_id: persona.cliente_id || null,
    cliente: persona.expand?.cliente_id ? {
      id: persona.expand.cliente_id.id,
      nombre: persona.expand.cliente_id.nombre
    } : null,
    clientes: persona.expand?.cliente_id ? [{
      id: persona.expand.cliente_id.id,
      nombre: persona.expand.cliente_id.nombre
    }] : [],
    relacion: persona.relacion || null,
    created: persona.created || '',
    updated: persona.updated || ''
  };
}

export default function PeoplePage() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const perPage = 10;
  
  // Función para obtener personas desde la API
  const fetchPersonas = async (page: number = 1) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/personas?page=${page}&perPage=${perPage}&sort=-created&expand=cliente_id`);
      
      if (!response.ok) {
        throw new Error(`Error en la petición: ${response.status}`);
      }
      
      const rawData = await response.json();
      console.log("Datos recibidos de la API:", rawData);
      
      // Limpiar y validar los datos antes de la validación de Zod
      const cleanData = {
        ...rawData,
        data: rawData.data.map(sanitizePersonaData)
      };

      try {
        // Validar respuesta con Zod
        const validatedData = apiResponseSchema.parse(cleanData);
        setPersonas(validatedData.data);
        setCurrentPage(validatedData.pagination.page);
        setTotalPages(validatedData.pagination.totalPages);
        setTotalItems(validatedData.pagination.totalItems);
      } catch (validationError) {
        console.error('Error de validación:', validationError);
        // Si hay error de validación, usamos los datos limpios de todas formas
        setPersonas(cleanData.data);
      }
      
    } catch (err) {
      console.error('Error fetching personas:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonas(currentPage);
  }, [currentPage]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handlePersonDeleted = () => {
    // Refetch data after deletion
    fetchPersonas(currentPage);
  };

  const handlePersonUpdated = () => {
    // Refetch data after update
    fetchPersonas(currentPage);
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
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-muted-foreground text-lg font-semibold">
                      Directorio de Personas
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Total: {totalItems} personas
                    </p>
                  </div>
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
                      onClick={() => fetchPersonas(currentPage)}
                    >
                      Reintentar
                    </Button>
                  </div>
                ) : (
                  <>
                    <PeopleDataTable 
                      data={personas}
                      onPersonDeleted={handlePersonDeleted}
                      onPersonUpdated={handlePersonUpdated}
                    />
                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Página {currentPage} de {totalPages}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1 || loading}
                        >
                          Anterior
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages || loading}
                        >
                          Siguiente
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