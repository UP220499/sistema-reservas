"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

export default function NuevoClientePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/clientes">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">
            Nuevo Cliente
          </h1>
          <p className="text-sm text-muted-foreground">Registra un nuevo cliente en el sistema.</p>
        </div>
      </div>

      {/* Form */}
      <div className="mx-auto max-w-lg">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre completo</Label>
              <Input id="nombre" placeholder="Ej: Maria Garcia Lopez" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="correo">Correo electronico</Label>
              <Input id="correo" type="email" placeholder="Ej: maria@email.com" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono">Telefono (Mexico)</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">+52</span>
                <Input id="telefono" placeholder="10 digitos" maxLength={10} />
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-end gap-3">
              <Link href="/clientes">
                <Button variant="outline">Cancelar</Button>
              </Link>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                Crear Cliente
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
