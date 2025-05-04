import { useState, useEffect } from 'react'

interface User {
  id: string
  username: string
  email: string
  rol: string
  verified: boolean
  created: string
  updated: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me')
        
        if (!response.ok) {
          throw new Error('Error al obtener datos del usuario')
        }

        const userData = await response.json()
        
        if (userData && userData.user) {
          setUser({
            id: userData.user.id,
            username: userData.user.username,
            email: userData.user.email,
            rol: userData.user.rol,
            verified: userData.user.verified,
            created: userData.user.created,
            updated: userData.user.updated
          })
          setError(null)
        } else {
          setUser(null)
          setError('No se encontraron datos del usuario')
        }
      } catch (err) {
        console.error('Error fetching user:', err)
        setUser(null)
        setError(err instanceof Error ? err.message : 'Error al cargar los datos del usuario')
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  return { user, loading, error }
} 