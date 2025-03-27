"use client";

import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { IconLoader2, IconLogout } from "@tabler/icons-react";
import { useRouter } from "next/navigation";

export function UserProfileButton() {
  const { user, loading, redirecting, logout } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut || redirecting) return;
    
    try {
      setIsLoggingOut(true);
      console.log("Cerrando sesión...");
      
      // Limpiar localStorage antes de llamar a logout
      localStorage.removeItem('user');
      
      // Crear una indicación de redirección
      sessionStorage.setItem('redirecting_from_logout', 'true');
      
      // Ejecutar el logout
      const result = await logout();
      
      if (!result.success) {
        console.error("Error al cerrar sesión:", result.error);
        setIsLoggingOut(false);
        return;
      }
      
      // Redirigir al usuario
      window.location.href = "/login";
    } catch (error) {
      console.error("Error inesperado al cerrar sesión:", error);
      setIsLoggingOut(false);
    }
  };

  if (loading || isLoggingOut || redirecting) {
    return (
      <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full">
        <IconLoader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  if (!user) {
    return null;
  }

  // Obtener las iniciales del nombre de usuario
  const getInitials = (username: string) => {
    return username.substring(0, 2).toUpperCase();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1 leading-none">
            <p className="font-medium">{user.username}</p>
            <p className="w-[200px] truncate text-sm text-muted-foreground">
              {user.email}
            </p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" onClick={handleLogout}>
          <IconLogout className="mr-2 h-4 w-4" />
          <span>Cerrar sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 