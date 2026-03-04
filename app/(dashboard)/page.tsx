"use client"

import { LogIn, LogOut, Hotel, DollarSign, TrendingUp } from "lucide-react"
import { StatsCard } from "@/components/dashboard/stats-card"
import { AvailabilityWidget } from "@/components/dashboard/availability-widget"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts"

// Demo data
const occupancyData = [
  { date: "01", occupancy: 72 },
  { date: "03", occupancy: 78 },
  { date: "05", occupancy: 85 },
  { date: "07", occupancy: 68 },
  { date: "09", occupancy: 90 },
  { date: "11", occupancy: 95 },
  { date: "13", occupancy: 88 },
  { date: "15", occupancy: 76 },
  { date: "17", occupancy: 82 },
  { date: "19", occupancy: 91 },
  { date: "21", occupancy: 87 },
  { date: "23", occupancy: 79 },
  { date: "25", occupancy: 93 },
  { date: "27", occupancy: 85 },
  { date: "29", occupancy: 88 },
]

const revenueData = [
  { month: "Ene", revenue: 45000 },
  { month: "Feb", revenue: 52000 },
  { month: "Mar", revenue: 48000 },
  { month: "Abr", revenue: 61000 },
  { month: "May", revenue: 58000 },
  { month: "Jun", revenue: 67000 },
]

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-md">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === "number" && entry.name === "Ingresos"
            ? `$${entry.value.toLocaleString()}`
            : `${entry.value}%`}
        </p>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Resumen general de operaciones y estadisticas.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Check-ins Hoy"
          value="3"
          icon={<LogIn className="h-5 w-5" />}
          variant="primary"
        />
        <StatsCard
          title="Check-outs Hoy"
          value="2"
          icon={<LogOut className="h-5 w-5" />}
          variant="warning"
        />
        <StatsCard
          title="Hospedados"
          value="8"
          icon={<Hotel className="h-5 w-5" />}
          variant="info"
        />
      </div>

      {/* Revenue stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatsCard
          title="Ingresos Esperados (Mes)"
          value="$127,500"
          icon={<DollarSign className="h-5 w-5" />}
          variant="info"
          description="Basado en el total de reservas activas del mes."
        />
        <StatsCard
          title="Ingresos Cobrados (Mes)"
          value="$98,300"
          icon={<TrendingUp className="h-5 w-5" />}
          variant="success"
          description="Basado en pagos registrados en el mes actual."
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Occupancy chart */}
        <div className="lg:col-span-3 rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-base font-semibold text-card-foreground">
            Ocupacion (Ultimos 30 dias)
          </h3>
          <div className="mt-4 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={occupancyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  unit="%"
                />
                <RechartsTooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="occupancy"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "hsl(var(--primary))", strokeWidth: 0 }}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: "hsl(var(--card))" }}
                  name="Ocupacion"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue chart */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-base font-semibold text-card-foreground">
            Ingresos Mensuales
          </h3>
          <div className="mt-4 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${v / 1000}k`}
                />
                <RechartsTooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="revenue"
                  fill="hsl(var(--secondary))"
                  radius={[6, 6, 0, 0]}
                  name="Ingresos"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Availability */}
      <AvailabilityWidget />
    </div>
  )
}
