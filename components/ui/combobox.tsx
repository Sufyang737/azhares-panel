"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface ComboboxProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  value?: string
  onValueChange?: (value: string) => void
  children?: React.ReactNode
}

export function Combobox({
  open,
  onOpenChange,
  value,
  onValueChange,
  children
}: ComboboxProps) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      {children}
    </Popover>
  )
}

export const ComboboxTrigger = PopoverTrigger
export const ComboboxContent = PopoverContent
export const ComboboxInput = CommandInput
export const ComboboxItem = CommandItem 