"use client"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface AvailabilityItem {
  ubicacion_id: string
  nombre: string
  status: "DISPONIBLE" | "OCUPADO" | "MANTENIMIENTO"
  tipo?: string
  cliente?: string
}

// Demo data
const demoAvailability: AvailabilityItem[] = [
  { ubicacion_id: "1", nombre: "Cabana Pino", status: "DISPONIBLE" },
  { ubicacion_id: "2", nombre: "Cabana Roble", status: "OCUPADO", tipo: "Reserva Directa", cliente: "Maria Garcia" },
  { ubicacion_id: "3", nombre: "Suite Bosque", status: "OCUPADO", tipo: "Airbnb", cliente: "John Smith" },
  { ubicacion_id: "4", nombre: "Villa Lago", status: "DISPONIBLE" },
  { ubicacion_id: "5", nombre: "Cabana Cedro", status: "MANTENIMIENTO" },
  { ubicacion_id: "6", nombre: "Suite Montaña", status: "DISPONIBLE" },
]

const statusConfig = {
  DISPONIBLE: { label: "Disponible", variant: "default" as const, className: "bg-emerald-500/10 text-emerald-700 border-emerald-200" },
  OCUPADO: { label: "Ocupado", variant: "destructive" as const, className: "bg-red-500/10 text-red-700 border-red-200" },
  MANTENIMIENTO: { label: "Mantenimiento", variant: "secondary" as const, className: "bg-orange-500/10 text-orange-700 border-orange-200" },
}

export function AvailabilityWidget() {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-border px-5 py-4">
        <h3 className="text-base font-semibold text-card-foreground">Disponibilidad Hoy</h3>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {demoAvailability.map((item) => {
            const config = statusConfig[item.status]
            return (
              <div
                key={item.ubicacion_id}
                className={cn(
                  "rounded-lg border p-3.5 transition-colors",
                  item.status === "DISPONIBLE" && "border-emerald-200 bg-emerald-50/50",
                  item.status === "OCUPADO" && "border-red-200/60 bg-red-50/30",
                  item.status === "MANTENIMIENTO" && "border-orange-200/60 bg-orange-50/30"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-card-foreground">{item.nombre}</p>
                  <Badge variant="outline" className={cn("shrink-0 text-[0.65rem] font-semibold", config.className)}>
                    {config.label}
                  </Badge>
                </div>
                {item.status === "OCUPADO" && (
                  <div className="mt-2 space-y-0.5">
                    {item.tipo && (
                      <p className="text-xs text-muted-foreground">{item.tipo}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-card-foreground">Cliente:</span> {item.cliente}
                    </p>
                  </div>
                )}
                {item.status === "DISPONIBLE" && (
                  <div className="mt-2">
                    <Link href={`/reservaciones/nueva?ubicacion_id=${item.ubicacion_id}`}>
                      <Button size="sm" variant="outline" className="h-7 gap-1 border-emerald-300 text-xs text-emerald-700 hover:bg-emerald-100">
                        <Plus className="h-3 w-3" />
                        Agendar
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
