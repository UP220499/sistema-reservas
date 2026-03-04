"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

export default function NuevaReservacionPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/reservaciones">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">
            Nueva Reservacion
          </h1>
          <p className="text-sm text-muted-foreground">Completa los datos para crear una nueva reservacion.</p>
        </div>
      </div>

      {/* Form */}
      <div className="mx-auto max-w-2xl">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="space-y-5">
            {/* Client */}
            <div className="space-y-2">
              <Label htmlFor="cliente">Cliente</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Maria Garcia Lopez</SelectItem>
                  <SelectItem value="2">Carlos Rodriguez</SelectItem>
                  <SelectItem value="3">Ana Martinez Ruiz</SelectItem>
                  <SelectItem value="4">Roberto Sanchez</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="ubicacion">Ubicacion</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una ubicacion" />
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

            {/* Origin */}
            <div className="space-y-2">
              <Label>Origen</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona origen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DIRECTA">Directa</SelectItem>
                  <SelectItem value="EXTERNA">Externa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Dates */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="checkin">Check-in</Label>
                <Input id="checkin" type="datetime-local" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkout">Check-out</Label>
                <Input id="checkout" type="datetime-local" />
              </div>
            </div>

            {/* Total */}
            <div className="space-y-2">
              <Label htmlFor="total">Total ($)</Label>
              <Input id="total" type="number" placeholder="0.00" />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notas">Notas</Label>
              <Textarea id="notas" placeholder="Notas opcionales sobre la reservacion..." rows={3} />
            </div>

            <Separator />

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <Link href="/reservaciones">
                <Button variant="outline">Cancelar</Button>
              </Link>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                Crear Reservacion
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
