"use client"

import { useState } from "react"
import { Eye, EyeOff, Home, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Simulate login
    setTimeout(() => {
      setLoading(false)
      window.location.href = "/"
    }, 1500)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#E8E4DA] via-[#F5F2EC] to-[#EDE9E0] px-4">
      <div className="w-full max-w-[420px]">
        {/* Card */}
        <div className="overflow-hidden rounded-2xl border-t-4 border-t-secondary bg-card shadow-xl shadow-black/8">
          <div className="px-7 pb-8 pt-10 sm:px-9">
            {/* Logo & Brand */}
            <div className="mb-8 flex flex-col items-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20">
                <Home className="h-7 w-7 text-primary-foreground" />
              </div>
              <h1 className="mt-4 font-serif text-2xl font-bold tracking-tight text-card-foreground">
                Cielito Home
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Gestion de Reservas
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-card-foreground">
                  Usuario
                </Label>
                <Input
                  id="username"
                  placeholder="Ingresa tu usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  autoFocus
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-card-foreground">
                  Contrasena
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Ingresa tu contrasena"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-card-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                    <span className="sr-only">
                      {showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
                    </span>
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || !username || !password}
                className="mt-2 h-11 w-full bg-primary text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Iniciar Sesion"
                )}
              </Button>
            </form>
          </div>
        </div>

        {/* Footer text */}
        <p className="mt-6 text-center text-xs text-muted-foreground/60">
          Cielito Home v2.0 - Sistema de Reservas
        </p>
      </div>
    </div>
  )
}
