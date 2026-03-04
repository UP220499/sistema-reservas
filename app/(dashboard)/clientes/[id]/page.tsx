"use client"

import Link from "next/link"
import {
  ArrowLeft,
  Phone,
  Star,
  StarOff,
  Plus,
  Edit,
  Trash2,
  Mail,
  User,
  Award,
  Trophy,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

const demoClient = {
  cliente_id: "C-001",
  nombre: "Maria Garcia Lopez",
  correo: "maria@email.com",
  activo: true,
  phones: [
    { id: "T-1", telefono: "+52 331 123 4567", es_principal: true, activo: true },
    { id: "T-2", telefono: "+52 331 987 6543", es_principal: false, activo: true },
  ],
  loyalty: {
    nivel: "ORO",
    puntos: 4200,
    reservas_completadas_count: 8,
    reservas_completadas_monto: 96000,
  },
}

const loyaltyColors: Record<string, string> = {
  BRONCE: "border-amber-200 bg-amber-500/10 text-amber-700",
  PLATA: "border-slate-200 bg-slate-400/10 text-slate-600",
  ORO: "border-yellow-200 bg-yellow-500/10 text-yellow-700",
  PLATINO: "border-indigo-200 bg-indigo-500/10 text-indigo-600",
}

export default function ClientDetailPage() {
  const c = demoClient

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/clientes">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">
              {c.nombre}
            </h1>
            <p className="text-sm text-muted-foreground">Cliente #{c.cliente_id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              "text-xs font-semibold",
              c.activo
                ? "border-emerald-200 bg-emerald-500/10 text-emerald-700"
                : "border-border bg-muted text-muted-foreground"
            )}
          >
            {c.activo ? "Activo" : "Inactivo"}
          </Badge>
          <Link href={`/clientes/${c.cliente_id}/editar`}>
            <Button variant="outline" size="sm">Editar Info</Button>
          </Link>
          <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10">
            Desactivar
          </Button>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Client info */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Informacion
          </h3>
          <Separator className="my-3" />
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Nombre</p>
                <p className="text-sm font-medium text-card-foreground">{c.nombre}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Mail className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Correo</p>
                <p className="text-sm font-medium text-card-foreground">{c.correo ?? "---"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Phones */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Telefonos
            </h3>
            <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs">
              <Plus className="h-3 w-3" />
              Agregar
            </Button>
          </div>
          <Separator className="my-3" />
          <div className="space-y-2">
            {c.phones.map((phone) => (
              <div
                key={phone.id}
                className="flex items-center justify-between rounded-lg border border-border p-3"
              >
                <div className="flex items-center gap-2.5">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-card-foreground">{phone.telefono}</span>
                  {phone.es_principal && (
                    <Star className="h-3.5 w-3.5 fill-secondary text-secondary" />
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                  {!phone.es_principal && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-secondary">
                      <StarOff className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Loyalty card */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-base font-semibold text-card-foreground">
            <Trophy className="h-5 w-5 text-secondary" />
            Programa de Lealtad
          </h3>
          <Badge
            variant="outline"
            className={cn("text-sm font-bold", loyaltyColors[c.loyalty.nivel])}
          >
            {c.loyalty.nivel}
          </Badge>
        </div>
        <Separator className="my-4" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
            <p className="text-3xl font-bold text-card-foreground">
              {c.loyalty.puntos.toLocaleString()}
            </p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Puntos
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
            <p className="text-3xl font-bold text-card-foreground">
              {c.loyalty.reservas_completadas_count}
            </p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Reservas Completadas
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
            <p className="text-3xl font-bold text-card-foreground">
              ${c.loyalty.reservas_completadas_monto.toLocaleString()}
            </p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Monto Acumulado
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
