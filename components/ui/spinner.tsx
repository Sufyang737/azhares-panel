import React from "react"
import { cn } from "@/lib/utils"

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg"
}

export function Spinner({ size = "md", className, ...props }: SpinnerProps) {
  const sizeClass = {
    sm: "h-4 w-4 border-2",
    md: "h-6 w-6 border-2",
    lg: "h-10 w-10 border-3",
  }
  
  return (
    <div
      className={cn(
        "animate-spin rounded-full border-solid border-current border-t-transparent text-muted-foreground",
        sizeClass[size],
        className
      )}
      {...props}
    >
      <span className="sr-only">Cargando...</span>
    </div>
  )
} 