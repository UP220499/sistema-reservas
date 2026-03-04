"use client"

import { useState } from "react"
import { Plus, Eye, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

const statusConfig: Record<string, { label: string; className: string }> = {
  ACTIVO: { label: "Activo", className: "bg-emerald-500/10 text-emerald-700 border-emerald-200" },
  INACTIVO: { label: "Inactivo", className: "bg-muted text-muted-foreground border-border" },
}

const demoBlocks = [
  {
    bloqueo_id: "B-001",
    ubicacion: "Villa Lago",
    inicio: "08/03/2026 15:00",
    fin: "11/03/2026 11:00",
    origen: "MANUAL",
    estatus: "ACTIVO",
  },
  {
    bloqueo_id: "B-002",
    ubicacion: "Suite Montana",
    inicio: "18/03/2026 15:00",
    fin: "22/03/2026 11:00",
    origen: "ICAL",
    estatus: "ACTIVO",
  },
  {
    bloqueo_id: "B-003",
    ubicacion: "Cabana Pino",
    inicio: "01/03/2026 15:00",
    fin: "03/03/2026 11:00",
    origen: "MANUAL",
    estatus: "INACTIVO",
  },
  {
    bloqueo_id: "B-004",
    ubicacion: "Cabana Roble",
    inicio: "25/03/2026 15:00",
    fin: "28/03/2026 11:00",
    origen: "ICAL",
    estatus: "ACTIVO",
  },
  {
    bloqueo_id: "B-005",
    ubicacion: "Cabana Cedro",
    inicio: "15/03/2026 15:00",
    fin: "17/03/2026 11:00",
    origen: "MANUAL",
    estatus: "ACTIVO",
  },
]

export default function BloqueosPage() {
  const [statusFilter, setStatusFilter] = useState("all")
  const [dialogOpen, setDialogOpen] = useState(false)

  const filtered = statusFilter === "all"
    ? demoBlocks
    : demoBlocks.filter((b) => b.estatus === statusFilter)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">
            Bloqueos
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Gestiona los bloqueos de disponibilidad.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4" />
              Nuevo Bloqueo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Nuevo Bloqueo</DialogTitle>
              <DialogDescription>
                Crea un bloqueo de disponibilidad para una ubicacion.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Ubicacion</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona ubicacion" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Cabana Pino</SelectItem>
                    <SelectItem value="2">Cabana Roble</SelectItem>
                    <SelectItem value="3">Suite Bosque</SelectItem>
                    <SelectItem value="4">Villa Lago</SelectItem>
                    <SelectItem value="5">Cabana Cedro</SelectItem>
                    <SelectItem value="6">Suite Montana</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Origen</Label>
                <Input value="MANUAL" disabled />
                <p className="text-xs text-muted-foreground">Los bloqueos iCal se crean automaticamente desde Airbnb.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Inicio</Label>
                  <Input type="datetime-local" />
                </div>
                <div className="space-y-2">
                  <Label>Fin</Label>
                  <Input type="datetime-local" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                Crear Bloqueo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Estatus" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="ACTIVO">Activo</SelectItem>
            <SelectItem value="INACTIVO">Inactivo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-border bg-muted/50 hover:bg-muted/50">
              <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ubicacion</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Inicio</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Fin</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Origen</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Estatus</TableHead>
              <TableHead className="text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((block) => {
              const sc = statusConfig[block.estatus] ?? statusConfig.INACTIVO
              return (
                <TableRow key={block.bloqueo_id} className="border-border transition-colors hover:bg-muted/30">
                  <TableCell className="text-sm font-medium text-card-foreground">{block.ubicacion}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{block.inicio}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{block.fin}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[0.65rem] font-semibold">
                      {block.origen}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("text-[0.65rem] font-semibold", sc.className)}>
                      {sc.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {block.estatus === "ACTIVO" && (
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:bg-destructive/10">
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <p className="text-xs text-muted-foreground">1-{filtered.length} de {filtered.length} bloqueos</p>
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
