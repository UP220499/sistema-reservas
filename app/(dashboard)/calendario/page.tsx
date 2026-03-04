"use client"

import { useState, useMemo } from "react"
import { ChevronLeft, ChevronRight, CalendarSearch } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"

const DAYS_ES = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"]
const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

interface CalendarEvent {
  id: string
  tipo: "RESERVA" | "BLOQUEO"
  ubicacion: string
  label: string
  start: string // YYYY-MM-DD
  end: string
  status?: string
  color: string
}

// Demo events spanning current month
function getDemoEvents(): CalendarEvent[] {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const d = (day: number) => `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`

  return [
    { id: "1", tipo: "RESERVA", ubicacion: "Cabana Pino", label: "Maria G.", start: d(3), end: d(6), status: "CONFIRMADA", color: "hsl(var(--primary))" },
    { id: "2", tipo: "RESERVA", ubicacion: "Suite Bosque", label: "Carlos R.", start: d(5), end: d(9), status: "PENDIENTE", color: "#f59e0b" },
    { id: "3", tipo: "BLOQUEO", ubicacion: "Villa Lago", label: "Bloq.", start: d(8), end: d(11), color: "#78909c" },
    { id: "4", tipo: "RESERVA", ubicacion: "Cabana Roble", label: "Ana M.", start: d(12), end: d(15), status: "CONFIRMADA", color: "hsl(var(--primary))" },
    { id: "5", tipo: "RESERVA", ubicacion: "Cabana Cedro", label: "Roberto S.", start: d(15), end: d(20), status: "COMPLETADA", color: "#3b82f6" },
    { id: "6", tipo: "BLOQUEO", ubicacion: "Suite Montana", label: "Airbnb", start: d(18), end: d(22), color: "#ef4444" },
    { id: "7", tipo: "RESERVA", ubicacion: "Cabana Pino", label: "Laura F.", start: d(22), end: d(25), status: "PENDIENTE", color: "#f59e0b" },
    { id: "8", tipo: "RESERVA", ubicacion: "Villa Lago", label: "Diego M.", start: d(25), end: d(28), status: "CONFIRMADA", color: "hsl(var(--primary))" },
  ]
}

function getCalendarGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const rawDay = firstDay.getDay()
  const startDay = rawDay === 0 ? 6 : rawDay - 1

  const weeks: { date: Date; isCurrentMonth: boolean }[][] = []
  let currentWeek: { date: Date; isCurrentMonth: boolean }[] = []

  for (let i = startDay - 1; i >= 0; i--) {
    const d = new Date(year, month, -i)
    currentWeek.push({ date: d, isCurrentMonth: false })
  }

  for (let day = 1; day <= lastDay.getDate(); day++) {
    currentWeek.push({ date: new Date(year, month, day), isCurrentMonth: true })
    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  }

  if (currentWeek.length > 0) {
    let nextDay = 1
    while (currentWeek.length < 7) {
      currentWeek.push({
        date: new Date(year, month + 1, nextDay),
        isCurrentMonth: false,
      })
      nextDay++
    }
    weeks.push(currentWeek)
  }

  return weeks
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export default function CalendarioPage() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth())
  const [filter, setFilter] = useState<"all" | "reservas" | "bloqueos">("all")

  const events = useMemo(() => getDemoEvents(), [])

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    const filtered = filter === "all" ? events : events.filter((e) =>
      filter === "reservas" ? e.tipo === "RESERVA" : e.tipo === "BLOQUEO"
    )
    filtered.forEach((event) => {
      const start = new Date(event.start)
      const end = new Date(event.end)
      const current = new Date(start)
      while (current <= end) {
        const key = formatDate(current)
        if (!map.has(key)) map.set(key, [])
        map.get(key)!.push(event)
        current.setDate(current.getDate() + 1)
      }
    })
    return map
  }, [events, filter])

  const grid = useMemo(() => getCalendarGrid(year, month), [year, month])
  const today = formatDate(new Date())

  const goPrev = () => {
    if (month === 0) { setYear(year - 1); setMonth(11) }
    else setMonth(month - 1)
  }
  const goNext = () => {
    if (month === 11) { setYear(year + 1); setMonth(0) }
    else setMonth(month + 1)
  }

  return (
    <TooltipProvider delayDuration={100}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={goPrev} className="h-9 w-9">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h1 className="min-w-[200px] text-center font-serif text-2xl font-bold tracking-tight text-foreground">
              {MONTHS_ES[month]} {year}
            </h1>
            <Button variant="ghost" size="icon" onClick={goNext} className="h-9 w-9">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setYear(new Date().getFullYear()); setMonth(new Date().getMonth()) }}
              className="ml-2 text-xs"
            >
              Hoy
            </Button>
          </div>

          <div className="flex gap-1 rounded-lg border border-border bg-muted/50 p-0.5">
            {(["all", "reservas", "bloqueos"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  filter === f
                    ? "bg-card text-card-foreground shadow-sm"
                    : "text-muted-foreground hover:text-card-foreground"
                )}
              >
                {f === "all" ? "Todo" : f === "reservas" ? "Reservas" : "Bloqueos"}
              </button>
            ))}
          </div>
        </div>

        {/* Calendar grid */}
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          {/* Day headers */}
          <div className="grid grid-cols-7 bg-primary">
            {DAYS_ES.map((day) => (
              <div
                key={day}
                className="py-2.5 text-center text-xs font-semibold tracking-wider text-primary-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Weeks */}
          {grid.map((week, wi) => (
            <div
              key={wi}
              className="grid grid-cols-7 border-t border-border"
            >
              {week.map((cell) => {
                const key = formatDate(cell.date)
                const dayEvents = eventsByDate.get(key) || []
                const isToday = key === today

                return (
                  <div
                    key={key}
                    className={cn(
                      "min-h-[100px] border-r border-border p-1 last:border-r-0",
                      !cell.isCurrentMonth && "bg-muted/30",
                      isToday && "bg-primary/5"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs",
                        !cell.isCurrentMonth && "text-muted-foreground/50",
                        isToday && "bg-primary font-bold text-primary-foreground",
                        cell.isCurrentMonth && !isToday && "font-medium text-card-foreground"
                      )}
                    >
                      {cell.date.getDate()}
                    </span>
                    <div className="mt-0.5 flex flex-col gap-[2px]">
                      {dayEvents.slice(0, 3).map((event, ei) => (
                        <Tooltip key={`${event.id}-${ei}`}>
                          <TooltipTrigger asChild>
                            <div
                              className="cursor-pointer truncate rounded px-1 py-[1px] text-[0.6rem] font-semibold text-white"
                              style={{ backgroundColor: event.color }}
                            >
                              {event.label}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            <p className="font-semibold">{event.label}</p>
                            <p className="text-muted-foreground">{event.ubicacion}</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="pl-1 text-[0.6rem] text-muted-foreground">
                          +{dayEvents.length - 3} mas
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <span className="text-xs font-semibold text-muted-foreground">Estatus:</span>
          {[
            { label: "Confirmada", color: "hsl(var(--primary))" },
            { label: "Pendiente", color: "#f59e0b" },
            { label: "Completada", color: "#3b82f6" },
            { label: "Cancelada", color: "#ef4444" },
            { label: "Bloqueo", color: "#78909c" },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </TooltipProvider>
  )
}
