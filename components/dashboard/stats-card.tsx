"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface StatsCardProps {
  title: string
  value: string | number
  icon: ReactNode
  description?: string
  trend?: "up" | "down" | "neutral"
  variant?: "primary" | "secondary" | "info" | "warning" | "success" | "destructive"
}

const variantStyles = {
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary/10 text-secondary",
  info: "bg-blue-500/10 text-blue-600",
  warning: "bg-orange-500/10 text-orange-600",
  success: "bg-emerald-500/10 text-emerald-600",
  destructive: "bg-destructive/10 text-destructive",
}

export function StatsCard({
  title,
  value,
  icon,
  description,
  variant = "primary",
}: StatsCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-card-foreground">
            {value}
          </p>
          {description && (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            variantStyles[variant]
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  )
}
