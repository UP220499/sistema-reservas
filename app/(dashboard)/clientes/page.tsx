"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus, Eye, Search, ChevronLeft, ChevronRight, ExternalLink, Award } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

const loyaltyConfig: Record<string, { className: string }> = {
  BRONCE: { className: "bg-amber-600/10 text-amber-700 border-amber-200" },
  PLATA: { className: "bg-slate-400/10 text-slate-600 border-slate-200" },
  ORO: { className: "bg-yellow-500/10 text-yellow-700 border-yellow-200" },
  PLATINO: { className: "bg-indigo-500/10 text-indigo-600 border-indigo-200" },
}

const demoClients = [
  {
    cliente_id: "C-001",
    nombre: "Maria Garcia Lopez",
    correo: "maria@email.com",
    telefono: "+52 331 123 4567",
    reservas: 8,
    loyalty: { nivel: "ORO", puntos: 4200, reservas_count: 8 },
    activo: true,
    frecuente: true,
  },
  {
    cliente_id: "C-002",
    nombre: "Carlos Rodriguez Perez",
    correo: "carlos.rdz@email.com",
    telefono: "+52 552 987 6543",
    reservas: 3,
    loyalty: { nivel: "PLATA", puntos: 1500, reservas_count: 3 },
    activo: true,
    frecuente: true,
  },
  {
    cliente_id: "C-003",
    nombre: "Ana Martinez Ruiz",
    correo: "ana.mtz@email.com",
    telefono: "+52 449 456 7890",
    reservas: 1,
    loyalty: { nivel: "BRONCE", puntos: 500, reservas_count: 1 },
    activo: true,
    frecuente: false,
  },
  {
    cliente_id: "C-004",
    nombre: "Roberto Sanchez Diaz",
    correo: "roberto.s@email.com",
    telefono: "+52 818 321 6549",
    reservas: 15,
    loyalty: { nivel: "PLATINO", puntos: 8750, reservas_count: 15 },
    activo: true,
    frecuente: true,
  },
  {
    cliente_id: "C-005",
    nombre: "Laura Fernandez Torres",
    correo: null,
    telefono: "+52 667 789 0123",
    reservas: 2,
    loyalty: { nivel: "BRONCE", puntos: 800, reservas_count: 2 },
    activo: false,
    frecuente: false,
  },
  {
    cliente_id: "C-006",
    nombre: "Diego Morales Vega",
    correo: "diego.morales@email.com",
    telefono: "+52 477 654 3210",
    reservas: 5,
    loyalty: { nivel: "PLATA", puntos: 2600, reservas_count: 5 },
    activo: true,
    frecuente: true,
  },
]

export default function ClientesPage() {
  const [search, setSearch] = useState("")

  const filtered = demoClients.filter(
    (c) =>
      c.nombre.toLowerCase().includes(search.toLowerCase()) ||
      c.correo?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">
            Clientes
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Directorio de clientes y programa de lealtad.
          </p>
        </div>
        <Link href="/clientes/nuevo">
          <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            Nuevo Cliente
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o correo..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-border bg-muted/50 hover:bg-muted/50">
              <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nombre</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Correo</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Telefono</TableHead>
              <TableHead className="text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">Reservas</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Lealtad</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Estado</TableHead>
              <TableHead className="text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((client) => {
              const lc = loyaltyConfig[client.loyalty.nivel] ?? loyaltyConfig.BRONCE
              return (
                <TableRow key={client.cliente_id} className="group cursor-pointer border-border transition-colors hover:bg-muted/30">
                  <TableCell className="text-sm font-medium text-card-foreground">
                    {client.nombre}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {client.correo ?? "---"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {client.telefono}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Link
                        href={`/reservaciones?cliente_id=${client.cliente_id}`}
                        className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                      >
                        {client.reservas}
                        <ExternalLink className="h-3 w-3 opacity-60" />
                      </Link>
                      {client.frecuente && (
                        <Badge variant="outline" className="ml-1 border-secondary/30 bg-secondary/10 px-1.5 py-0 text-[0.6rem] font-semibold text-secondary">
                          Frecuente
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <Badge variant="outline" className={cn("w-fit text-[0.65rem] font-semibold", lc.className)}>
                        {client.loyalty.nivel}
                      </Badge>
                      <span className="text-[0.65rem] text-muted-foreground">
                        {client.loyalty.puntos} pts
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[0.65rem] font-semibold",
                        client.activo
                          ? "border-emerald-200 bg-emerald-500/10 text-emerald-700"
                          : "border-border bg-muted text-muted-foreground"
                      )}
                    >
                      {client.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Link href={`/clientes/${client.cliente_id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <p className="text-xs text-muted-foreground">1-{filtered.length} de {filtered.length} clientes</p>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 min-w-[32px] bg-primary/10 text-primary font-semibold text-xs">
              1
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
