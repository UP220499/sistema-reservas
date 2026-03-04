"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus, Eye, Search, Filter, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ReservationStatusBadge } from "@/components/reservation-status-badge"

const demoReservations = [
  {
    reserva_id: "R-001",
    ubicacion: "Cabana Pino",
    cliente: "Maria Garcia Lopez",
    checkin: "15/03/2026",
    checkout: "18/03/2026",
    total: "$12,500",
    estatus: "CONFIRMADA",
  },
  {
    reserva_id: "R-002",
    ubicacion: "Suite Bosque",
    cliente: "Carlos Rodriguez",
    checkin: "16/03/2026",
    checkout: "20/03/2026",
    total: "$18,000",
    estatus: "PENDIENTE",
  },
  {
    reserva_id: "R-003",
    ubicacion: "Villa Lago",
    cliente: "Ana Martinez Ruiz",
    checkin: "14/03/2026",
    checkout: "16/03/2026",
    total: "$9,800",
    estatus: "COMPLETADA",
  },
  {
    reserva_id: "R-004",
    ubicacion: "Cabana Roble",
    cliente: "Roberto Sanchez",
    checkin: "17/03/2026",
    checkout: "22/03/2026",
    total: "$25,000",
    estatus: "CONFIRMADA",
  },
  {
    reserva_id: "R-005",
    ubicacion: "Suite Montana",
    cliente: "Laura Fernandez",
    checkin: "10/03/2026",
    checkout: "12/03/2026",
    total: "$7,200",
    estatus: "CANCELADA",
  },
  {
    reserva_id: "R-006",
    ubicacion: "Cabana Cedro",
    cliente: "Diego Morales",
    checkin: "20/03/2026",
    checkout: "25/03/2026",
    total: "$22,500",
    estatus: "PENDIENTE",
  },
  {
    reserva_id: "R-007",
    ubicacion: "Cabana Pino",
    cliente: "Sofia Herrera",
    checkin: "22/03/2026",
    checkout: "24/03/2026",
    total: "$8,400",
    estatus: "CONFIRMADA",
  },
]

export default function ReservacionesPage() {
  const [statusFilter, setStatusFilter] = useState("all")

  const filtered = statusFilter === "all"
    ? demoReservations
    : demoReservations.filter((r) => r.estatus === statusFilter)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">
            Reservaciones
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Gestiona todas las reservaciones del sistema.
          </p>
        </div>
        <Link href="/reservaciones/nueva">
          <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            Nueva Reservacion
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente o ubicacion..."
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="Estatus" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="PENDIENTE">Pendiente</SelectItem>
            <SelectItem value="CONFIRMADA">Confirmada</SelectItem>
            <SelectItem value="CANCELADA">Cancelada</SelectItem>
            <SelectItem value="COMPLETADA">Completada</SelectItem>
          </SelectContent>
        </Select>
        <Input type="date" className="w-full sm:w-40" />
        <Input type="date" className="w-full sm:w-40" />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-border bg-muted/50 hover:bg-muted/50">
              <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ubicacion</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cliente</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Check-in</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Check-out</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Estatus</TableHead>
              <TableHead className="text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((reserva) => (
              <TableRow key={reserva.reserva_id} className="group cursor-pointer border-border transition-colors hover:bg-muted/30">
                <TableCell className="text-sm font-medium text-card-foreground">{reserva.ubicacion}</TableCell>
                <TableCell className="text-sm text-card-foreground">{reserva.cliente}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{reserva.checkin}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{reserva.checkout}</TableCell>
                <TableCell className="text-sm font-semibold text-card-foreground">{reserva.total}</TableCell>
                <TableCell>
                  <ReservationStatusBadge status={reserva.estatus} />
                </TableCell>
                <TableCell className="text-center">
                  <Link href={`/reservaciones/${reserva.reserva_id}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <p className="text-xs text-muted-foreground">1-7 de 7 reservaciones</p>
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
