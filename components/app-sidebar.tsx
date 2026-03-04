"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  ShieldBan,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Home,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

const menuItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Reservaciones", icon: CalendarDays, path: "/reservaciones" },
  { label: "Clientes", icon: Users, path: "/clientes" },
  { label: "Bloqueos", icon: ShieldBan, path: "/bloqueos" },
  { label: "Calendario", icon: CalendarRange, path: "/calendario" },
]

interface AppSidebarProps {
  collapsed: boolean
  onToggle: () => void
  onMobileClose?: () => void
}

export function AppSidebar({ collapsed, onToggle, onMobileClose }: AppSidebarProps) {
  const pathname = usePathname()

  const handleNavClick = () => {
    if (onMobileClose) onMobileClose()
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
        {/* Logo */}
        <div className="flex flex-col items-center gap-1 border-b border-sidebar-border px-4 py-5">
          <div className={cn(
            "flex items-center justify-center rounded-xl bg-sidebar-accent p-2 transition-all",
            collapsed ? "h-10 w-10" : "h-12 w-12"
          )}>
            <Home className={cn("text-sidebar-primary", collapsed ? "h-5 w-5" : "h-6 w-6")} />
          </div>
          {!collapsed && (
            <>
              <span className="mt-1 text-sm font-semibold tracking-wide text-sidebar-foreground">
                Cielito Home
              </span>
              <span className="text-[0.65rem] uppercase tracking-[0.15em] text-sidebar-foreground/50">
                Gestion de Reservas
              </span>
            </>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {menuItems.map((item) => {
            const isActive =
              item.path === "/"
                ? pathname === "/"
                : pathname.startsWith(item.path)

            const linkContent = (
              <Link
                href={item.path}
                onClick={handleNavClick}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  collapsed && "justify-center px-2",
                  isActive
                    ? "bg-sidebar-primary/15 text-sidebar-foreground border-l-[3px] border-sidebar-primary"
                    : "text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <item.icon className={cn(
                  "shrink-0",
                  collapsed ? "h-5 w-5" : "h-[18px] w-[18px]",
                  isActive ? "text-sidebar-primary" : ""
                )} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )

            if (collapsed) {
              return (
                <Tooltip key={item.path}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              )
            }

            return <div key={item.path}>{linkContent}</div>
          })}
        </nav>

        {/* Footer */}
        <Separator className="bg-sidebar-border" />
        <div className={cn(
          "flex items-center px-3 py-3",
          collapsed ? "justify-center" : "justify-between"
        )}>
          {!collapsed && (
            <span className="text-[0.65rem] text-sidebar-foreground/30 tracking-wider">
              Cielito Home v2.0
            </span>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggle}
                className="h-8 w-8 text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              >
                {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {collapsed ? "Expandir" : "Contraer"}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  )
}
