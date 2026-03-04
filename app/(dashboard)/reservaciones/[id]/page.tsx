"use client"

import Link from "next/link"
import { ArrowLeft, Plus, CreditCard, MapPin, User, Calendar, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ReservationStatusBadge } from "@/components/reservation-status-badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const demoReservation = {
  reserva_id: "R-001",
  ubicacion: "Cabana Pino",
  cliente: "Maria Garcia Lopez",
  checkin: "15/03/2026 15:00",
  checkout: "18/03/2026 11:00",
  origen: "DIRECTA",
  estatus: "CONFIRMADA",
  notas: "Solicita cuna extra para bebe de 2 anos.",
  total: 12500,
  pagado: 7500,
  saldo: 5000,
}

const demoPayments = [
  {
    id: "P-001",
    fecha: "10/03/2026 14:30",
    tipo: "ANTICIPO",
    metodo: "TRANSFERENCIA",
    monto: 5000,
    referencia: "TRF-28374",
    notas: "Deposito inicial",
  },
  {
    id: "P-002",
    fecha: "14/03/2026 10:15",
    tipo: "ANTICIPO",
    metodo: "EFECTIVO",
    monto: 2500,
    referencia: null,
    notas: null,
  },
]

function InfoRow({ icon, label, value, valueClassName }: {
  icon: React.ReactNode
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div className="flex-1">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className={valueClassName ?? "text-sm font-medium text-card-foreground"}>{value}</p>
      </div>
    </div>
  )
}

export default function ReservationDetailPage() {
  const r = demoReservation
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/reservaciones">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">
              Reservacion #{r.reserva_id}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ReservationStatusBadge status={r.estatus} />
          <Button variant="outline" size="sm">
            Cambiar Estatus
          </Button>
          <Link href={`/reservaciones/${r.reserva_id}/editar`}>
            <Button variant="outline" size="sm">
              Editar
            </Button>
          </Link>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* General Info */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Informacion General
          </h3>
          <Separator className="my-3" />
          <div className="space-y-1">
            <InfoRow icon={<MapPin className="h-4 w-4" />} label="Ubicacion" value={r.ubicacion} />
            <InfoRow icon={<User className="h-4 w-4" />} label="Cliente" value={r.cliente} />
            <InfoRow icon={<Calendar className="h-4 w-4" />} label="Check-in" value={r.checkin} />
            <InfoRow icon={<Calendar className="h-4 w-4" />} label="Check-out" value={r.checkout} />
            <InfoRow icon={<FileText className="h-4 w-4" />} label="Origen" value={r.origen} />
            {r.notas && (
              <InfoRow icon={<FileText className="h-4 w-4" />} label="Notas" value={r.notas} />
            )}
          </div>
        </div>

        {/* Financial Summary */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Resumen Financiero
          </h3>
          <Separator className="my-3" />
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Reserva</span>
              <span className="text-lg font-bold text-card-foreground">${r.total.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Pagado</span>
              <span className="text-lg font-bold text-emerald-600">${r.pagado.toLocaleString()}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-card-foreground">Saldo Pendiente</span>
              <span className="text-lg font-bold text-destructive">${r.saldo.toLocaleString()}</span>
            </div>
            {/* Progress bar */}
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${(r.pagado / r.total) * 100}%` }}
              />
            </div>
            <p className="text-center text-xs text-muted-foreground">
              {Math.round((r.pagado / r.total) * 100)}% pagado
            </p>
          </div>
        </div>
      </div>

      {/* Payments table */}
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pagos</h3>
          <Button size="sm" variant="outline" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Registrar Pago
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-border bg-muted/30 hover:bg-muted/30">
              <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Fecha</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tipo</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Metodo</TableHead>
              <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">Monto</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Referencia</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Notas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {demoPayments.map((pago) => (
              <TableRow key={pago.id} className="border-border">
                <TableCell className="text-sm text-muted-foreground">{pago.fecha}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[0.65rem] font-semibold ${
                    pago.tipo === "ANTICIPO"
                      ? "border-amber-200 bg-amber-500/10 text-amber-700"
                      : "border-emerald-200 bg-emerald-500/10 text-emerald-700"
                  }`}>
                    {pago.tipo}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-card-foreground">{pago.metodo}</TableCell>
                <TableCell className="text-right text-sm font-semibold text-card-foreground">
                  ${pago.monto.toLocaleString()}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{pago.referencia ?? "---"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{pago.notas ?? "---"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
