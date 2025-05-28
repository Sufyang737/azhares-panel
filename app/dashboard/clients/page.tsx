"use client"

import React, { useState, useEffect } from 'react';
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { IconBuilding, IconSearch } from "@tabler/icons-react";
import { ClientsDataTable, clientSchema } from "@/components/clients/clients-data-table";
import { Spinner } from '@/components/ui/spinner';
import { z } from 'zod';
import Link from 'next/link';
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Schema para validar la respuesta de la API
const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(clientSchema)
});

type Cliente = z.infer<typeof clientSchema>;

type SortConfig = {
  key: keyof Cliente;
  direction: 'asc' | 'desc';
};

export default function ClientsPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'nombre', direction: 'asc' });
  const [filterType, setFilterType] = useState<string>('all');
  
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
      setFilteredClientes(validatedData.data);
      
    } catch (err) {
      console.error('Error fetching clientes:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // Función para filtrar y ordenar clientes
  const filterAndSortClientes = () => {
    let filtered = [...clientes];

    // Aplicar filtro de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(cliente => 
        (cliente.nombre?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (cliente.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (cliente.telefono?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (cliente.contacto?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      );
    }

    // Aplicar filtro por estado en lugar de tipo
    if (filterType !== 'all') {
      filtered = filtered.filter(cliente => cliente.estado === filterType);
    }

    // Aplicar ordenamiento
    filtered.sort((a, b) => {
      const aValue = (a[sortConfig.key] || '') as string;
      const bValue = (b[sortConfig.key] || '') as string;

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredClientes(filtered);
  };

  // Efecto para aplicar filtros y ordenamiento
  useEffect(() => {
    filterAndSortClientes();
  }, [searchTerm, filterType, sortConfig, clientes]);

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

              {/* Filtros */}
              <div className="px-4 lg:px-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-1 items-center space-x-2">
                    <div className="relative flex-1">
                      <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar clientes..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <Select
                      value={filterType}
                      onValueChange={setFilterType}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filtrar por estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="activo">Activos</SelectItem>
                        <SelectItem value="inactivo">Inactivos</SelectItem>
                        <SelectItem value="pendiente">Pendientes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Select
                    value={`${sortConfig.key}-${sortConfig.direction}`}
                    onValueChange={(value) => {
                      const [key, direction] = value.split('-');
                      setSortConfig({ 
                        key: key as keyof Cliente, 
                        direction: direction as 'asc' | 'desc' 
                      });
                    }}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nombre-asc">Nombre (A-Z)</SelectItem>
                      <SelectItem value="nombre-desc">Nombre (Z-A)</SelectItem>
                      <SelectItem value="created-desc">Más recientes</SelectItem>
                      <SelectItem value="created-asc">Más antiguos</SelectItem>
                      <SelectItem value="contacto-asc">Contacto (A-Z)</SelectItem>
                      <SelectItem value="contacto-desc">Contacto (Z-A)</SelectItem>
                    </SelectContent>
                  </Select>
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
                  <ClientsDataTable data={filteredClientes} />
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
} 