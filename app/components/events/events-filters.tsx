import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface EventFiltersProps {
  onFiltersChange: (filters: {
    startDate: Date | undefined
    endDate: Date | undefined
    eventType: string
  }) => void
}

export function EventFilters({ onFiltersChange }: EventFiltersProps) {
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [eventType, setEventType] = useState<string>("todos")

  const handleStartDateSelect = (date: Date | undefined) => {
    setStartDate(date)
    onFiltersChange({ startDate: date, endDate, eventType })
  }

  const handleEndDateSelect = (date: Date | undefined) => {
    setEndDate(date)
    onFiltersChange({ startDate, endDate: date, eventType })
  }

  const handleEventTypeSelect = (value: string) => {
    setEventType(value)
    onFiltersChange({ startDate, endDate, eventType: value })
  }

  return (
    <div className="flex flex-wrap gap-4 items-center mb-4">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "justify-start text-left font-normal",
              !startDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {startDate ? format(startDate, "PPP", { locale: es }) : "Fecha inicial"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={startDate}
            onSelect={handleStartDateSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "justify-start text-left font-normal",
              !endDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {endDate ? format(endDate, "PPP", { locale: es }) : "Fecha final"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={endDate}
            onSelect={handleEndDateSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <Select value={eventType} onValueChange={handleEventTypeSelect}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Tipo de evento" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos</SelectItem>
          <SelectItem value="boda">Boda</SelectItem>
          <SelectItem value="cumpleanos">Cumpleaños</SelectItem>
          <SelectItem value="corporativo">Corporativo</SelectItem>
          <SelectItem value="otro">Otro</SelectItem>
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        onClick={() => {
          setStartDate(undefined)
          setEndDate(undefined)
          setEventType("todos")
          onFiltersChange({
            startDate: undefined,
            endDate: undefined,
            eventType: "todos",
          })
        }}
      >
        Limpiar filtros
      </Button>
    </div>
  )
} 