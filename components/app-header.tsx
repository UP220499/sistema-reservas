"use client"

import { Menu, LogOut, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface AppHeaderProps {
  onMenuClick: () => void
  isMobile: boolean
}

export function AppHeader({ onMenuClick, isMobile }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-4 border-b border-border bg-card px-4 sm:px-6">
      {isMobile && (
        <Button variant="ghost" size="icon" onClick={onMenuClick} className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Abrir menu</span>
        </Button>
      )}

      <div className="flex-1" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold leading-tight text-foreground">Administrador</p>
              <p className="text-xs text-muted-foreground">ADMIN</p>
            </div>
            <Avatar className="h-8 w-8 border-2 border-primary/20">
              <AvatarFallback className="bg-primary text-xs font-bold text-primary-foreground">
                AD
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <div>
              <p className="text-sm font-semibold">Administrador</p>
              <p className="text-xs text-muted-foreground">admin</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive focus:text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar sesion
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
