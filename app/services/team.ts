import { adminPocketBase } from "@/lib/pocketbase"
import PocketBase from "pocketbase"

export interface TeamMember {
  id: string
  nombre: string
  apellido: string
  cargo: string
  dni: number
  telefono: number
  email: string
  cumpleanio: string
  pais: string
  ciudad: string
  created: string
  updated: string
}

export interface CreateTeamMemberData {
  nombre: string
  apellido: string
  cargo: string
  dni: number
  telefono: number
  email: string
  cumpleanio: string
  pais: string
  ciudad: string
}

export async function getTeamMembers() {
  try {
    const pb = await adminPocketBase()
    const records = await pb.collection('equipo').getList<TeamMember>(1, 50, {
      sort: '-created',
    })
    return records
  } catch (error) {
    console.error('Error fetching team members:', error)
    throw error
  }
}

export async function createTeamMember(data: CreateTeamMemberData) {
  try {
    console.log('Iniciando creación de miembro del equipo con datos:', data)
    const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL)
    pb.authStore.save(process.env.POCKETBASE_ADMIN_TOKEN!, null)
    console.log('PocketBase inicializado')
    const record = await pb.collection('equipo').create<TeamMember>(data)
    console.log('Registro creado en PocketBase:', record)
    return record
  } catch (error) {
    console.error('Error creating team member:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    throw error
  }
}

export async function updateTeamMember(id: string, data: Partial<CreateTeamMemberData>) {
  try {
    const pb = await adminPocketBase()
    const record = await pb.collection('equipo').update<TeamMember>(id, data)
    return record
  } catch (error) {
    console.error('Error updating team member:', error)
    throw error
  }
}

export async function deleteTeamMember(id: string) {
  try {
    const pb = await adminPocketBase()
    await pb.collection('equipo').delete(id)
  } catch (error) {
    console.error('Error deleting team member:', error)
    throw error
  }
} 