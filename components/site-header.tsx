"use client";

import { IconMenu2 } from "@tabler/icons-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "./ui/mode-toggle";
import { ThemeSelector } from "./theme-selector";
import { UserProfileButton } from "./user-profile-button";

export function SiteHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden h-8 w-8"
        >
          <IconMenu2 className="h-5 w-5" />
          <span className="sr-only">Abrir menú</span>
        </Button>
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4 md:hidden"
        />
        <h1 className="text-base font-medium">Azares Master</h1>
        <div className="ml-auto flex items-center gap-2">
          <ThemeSelector />
          <ModeToggle />
          <UserProfileButton />
        </div>
      </div>
    </header>
  );
}
