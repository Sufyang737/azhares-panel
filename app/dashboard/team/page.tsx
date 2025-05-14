"use client"

import { TeamTable } from "@/components/team/team-table"
import { IconUsers } from "@tabler/icons-react"
import { CreateMemberDialog } from "@/components/team/create-member-dialog"
import { useState } from "react"

export default function TeamPage() {
  const [key, setKey] = useState(0)

  const handleSuccess = () => {
    // Forzar la recarga de la tabla
    setKey(prev => prev + 1)
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Equipo de Trabajo</h1>
        <p className="text-muted-foreground">
          Gestiona los miembros del equipo y sus roles
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IconUsers className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Miembros del equipo
          </span>
        </div>
        <CreateMemberDialog onSuccess={handleSuccess} />
      </div>

      <TeamTable key={key} />
    </div>
  )
} 