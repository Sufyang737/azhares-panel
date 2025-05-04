"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { IconPlus } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { IconUsers, IconUserCheck, IconUsersGroup, IconCalendarTime } from "@tabler/icons-react"
import { PeopleDataTable } from "@/components/people/people-data-table"

export interface Person {
  id: string;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  tipo_persona: string;
  cliente_id?: string;
  cliente?: { id: string; nombre: string };
  direccion: string;
  ciudad?: string;
  pais?: string;
  instagram?: string;
  comentario?: string;
  cumpleanio?: string;
  created?: string;
  updated?: string;
}

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
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  
  // Cargar personas al montar el componente
  useEffect(() => {
    const fetchPeople = async () => {
      try {
        const response = await fetch('/api/personas?page=1&perPage=100&sort=-created')
        const result = await response.json()
        
        if (result.success) {
          setPeople(result.data)
        } else {
          toast.error(result.error || "Error al cargar personas")
        }
      } catch (error) {
        console.error("Error al obtener personas:", error)
        toast.error("Error al conectar con el servidor")
      } finally {
        setLoading(false)
      }
    }
    
    fetchPeople()
  }, [])
  
  // Calcular estadísticas
  const totalPersonas = people.length;
  const personasConEmail = people.filter(p => p.email).length;
  const personasConTelefono = people.filter(p => p.telefono).length;
  const personasConCliente = people.filter(p => p.cliente_id).length;
  const tipoPersonaStats = people.reduce((acc, p) => {
    if (p.tipo_persona) {
      acc[p.tipo_persona] = (acc[p.tipo_persona] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
  
  // Obtener el tipo de persona más común
  const tipoMasComun = Object.entries(tipoPersonaStats).length > 0 
    ? Object.entries(tipoPersonaStats).sort((a, b) => b[1] - a[1])[0] 
    : null;
  
  return (
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
              {tipoMasComun ? ` · Tipo más común: ${tipoMasComun[0]}` : ''}
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="px-4 lg:px-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Personas</h1>
          <Button onClick={() => { window.location.href = "/dashboard/people/new" }}>
            <IconPlus className="mr-2 h-4 w-4" />
            Nueva Persona
          </Button>
        </div>
      </div>
      
      <div className="px-4 lg:px-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner size="lg" />
          </div>
        ) : (
          <PeopleDataTable data={people} />
        )}
      </div>
    </div>
  )
} 