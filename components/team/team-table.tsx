"use client"

import { useEffect, useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { TeamMember } from "@/app/services/team"

export function TeamTable() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await fetch('/api/team')
        const data = await response.json()
        setMembers(data.items || [])
      } catch (err) {
        console.error('Error fetching team members:', err)
        setError('Error al cargar los miembros del equipo')
      } finally {
        setLoading(false)
      }
    }

    fetchMembers()
  }, [])

  if (loading) {
    return <div>Cargando...</div>
  }

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Miembro</TableHead>
            <TableHead>Cargo</TableHead>
            <TableHead>País</TableHead>
            <TableHead>Ciudad</TableHead>
            <TableHead>Contacto</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.nombre}`} />
                    <AvatarFallback>{member.nombre[0]}{member.apellido[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium">{member.nombre} {member.apellido}</span>
                    <span className="text-sm text-muted-foreground">{member.email}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell>{member.cargo}</TableCell>
              <TableCell>{member.pais}</TableCell>
              <TableCell>{member.ciudad}</TableCell>
              <TableCell>
                <div className="flex flex-col text-sm">
                  <span>DNI: {member.dni}</span>
                  <span>Tel: {member.telefono}</span>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 