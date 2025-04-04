import { useState, useEffect } from "react"
import { toast } from "sonner"

interface DolarBlue {
  compra: number
  venta: number
}

export function useDolarBlue() {
  const [dolarBlue, setDolarBlue] = useState<DolarBlue | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDolarBlue = async () => {
      try {
        const response = await fetch('https://dolarapi.com/v1/dolares/blue')
        if (response.ok) {
          const data = await response.json()
          setDolarBlue({
            compra: data.compra,
            venta: data.venta
          })
        } else {
          console.error('Error al obtener cotización del dólar blue')
          toast.error('No se pudo obtener la cotización del dólar')
        }
      } catch (error) {
        console.error('Error al obtener cotización:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDolarBlue()
  }, [])

  return { dolarBlue, loading }
} 