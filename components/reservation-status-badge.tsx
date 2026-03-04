"use client"

import { cn } from "@/lib/utils"

const statusConfig: Record<string, { label: string; className: string }> = {
  PENDIENTE: {
    label: "Pendiente",
    className: "bg-amber-500/10 text-amber-700 border-amber-200",
  },
  CONFIRMADA: {
    label: "Confirmada",
    className: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  },
  CANCELADA: {
    label: "Cancelada",
    className: "bg-red-500/10 text-red-700 border-red-200",
  },
  COMPLETADA: {
    label: "Completada",
    className: "bg-blue-500/10 text-blue-700 border-blue-200",
  },
}

export function ReservationStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? { label: status, className: "bg-muted text-muted-foreground" }
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[0.7rem] font-semibold",
        config.className
      )}
    >
      {config.label}
    </span>
  )
}
