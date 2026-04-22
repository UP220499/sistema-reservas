import { Box, Container, Grid, Typography, Paper, Skeleton, useTheme } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { reportsApi, type OccupancyPoint, type RevenuePoint, type ReservationCounts } from '../../api/reports';
import { qk } from '../../utils/queryKeys';
import StatsCard from '../../components/dashboard/StatsCard';
import EmptyState from '../../components/common/EmptyState';
import HotelIcon from '@mui/icons-material/Hotel';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import BarChartIcon from '@mui/icons-material/BarChart';
import EventNoteIcon from '@mui/icons-material/EventNote';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
} from 'recharts';

import AvailabilityWidget from '../../components/dashboard/AvailabilityWidget';
import { useIsAdmin } from '../../hooks/useIsAdmin';

function fmtCurrency(v: string | number | null | undefined): string {
    return v != null ? `$${Number(v).toLocaleString()}` : '—';
}

export default function DashboardPage() {
    const theme = useTheme();
    const isAdmin = useIsAdmin();

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: qk.dashboard.stats(),
        queryFn: reportsApi.getStats,
        refetchInterval: 30000,
    });

    const { data: occupancy = [], isLoading: occupancyLoading } = useQuery<OccupancyPoint[]>({
        queryKey: qk.dashboard.occupancy(),
        queryFn: reportsApi.getOccupancy,
        enabled: isAdmin,
    });

    const { data: revenue = [], isLoading: revenueLoading } = useQuery<RevenuePoint[]>({
        queryKey: qk.dashboard.revenue(),
        queryFn: reportsApi.getRevenue,
        enabled: isAdmin,
    });

    const { data: reservationCounts, isLoading: countsLoading } = useQuery<ReservationCounts>({
        queryKey: qk.dashboard.reservationCounts(),
        queryFn: reportsApi.getReservationCounts,
        refetchInterval: 30000,
    });

    return (
        <Container maxWidth="xl">
            {/* ── Stats cards ── */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    {statsLoading ? (
                        <Skeleton variant="rectangular" height={96} sx={{ borderRadius: 2 }} />
                    ) : (
                        <StatsCard
                            title="Check-ins Hoy"
                            value={stats?.checkins_hoy ?? '—'}
                            icon={<LoginIcon />}
                            color="primary"
                        />
                    )}
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    {statsLoading ? (
                        <Skeleton variant="rectangular" height={96} sx={{ borderRadius: 2 }} />
                    ) : (
                        <StatsCard
                            title="Check-outs Hoy"
                            value={stats?.checkouts_hoy ?? '—'}
                            icon={<LogoutIcon />}
                            color="warning"
                        />
                    )}
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    {statsLoading ? (
                        <Skeleton variant="rectangular" height={96} sx={{ borderRadius: 2 }} />
                    ) : (
                        <StatsCard
                            title="Hospedados"
                            value={stats?.active_reservations ?? '—'}
                            icon={<HotelIcon />}
                            color="info"
                        />
                    )}
                </Grid>
                {isAdmin && (
                    <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                        {statsLoading ? (
                            <Skeleton variant="rectangular" height={96} sx={{ borderRadius: 2 }} />
                        ) : (
                            <Box>
                                <StatsCard
                                    title="Ingresos esperados (mes)"
                                    value={fmtCurrency(stats?.expected_monthly_revenue)}
                                    icon={<AttachMoneyIcon />}
                                    color="info"
                                />
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, px: 0.5 }}>
                                    Basado en el total de reservas activas del mes.
                                </Typography>
                            </Box>
                        )}
                    </Grid>
                )}
                {isAdmin && (
                    <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                        {statsLoading ? (
                            <Skeleton variant="rectangular" height={96} sx={{ borderRadius: 2 }} />
                        ) : (
                            <Box>
                                <StatsCard
                                    title="Ingresos cobrados (mes)"
                                    value={fmtCurrency(stats?.collected_monthly_revenue)}
                                    icon={<AttachMoneyIcon />}
                                    color="success"
                                />
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, px: 0.5 }}>
                                    Basado en pagos registrados en el mes actual.
                                </Typography>
                            </Box>
                        )}
                    </Grid>
                )}
            </Grid>

            {/* ── Reservation counts ── */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle1" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>
                        Reservaciones
                    </Typography>
                </Grid>
                {(['esta_semana', 'este_mes', 'este_anio', 'total'] as const).map((key) => {
                    const labels: Record<typeof key, string> = {
                        esta_semana: 'Esta semana',
                        este_mes: 'Este mes',
                        este_anio: 'Este año',
                        total: 'Total histórico',
                    };
                    return (
                        <Grid key={key} size={{ xs: 6, sm: 3 }}>
                            {countsLoading ? (
                                <Skeleton variant="rectangular" height={96} sx={{ borderRadius: 2 }} />
                            ) : (
                                <StatsCard
                                    title={labels[key]}
                                    value={reservationCounts?.[key] ?? '—'}
                                    icon={<EventNoteIcon />}
                                    color="secondary"
                                />
                            )}
                        </Grid>
                    );
                })}
            </Grid>

            {/* ── Charts ── */}
            <Grid container spacing={3}>
                {isAdmin && (
                    <Grid size={{ xs: 12, md: 8 }}>
                        <Paper sx={{ p: 3, height: 400 }}>
                            <Typography variant="h6" gutterBottom>
                                Ocupación (Últimos 30 días)
                            </Typography>
                            {occupancyLoading ? (
                                <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 1, mt: 1 }} />
                            ) : occupancy.length === 0 ? (
                                <EmptyState
                                    icon={<ShowChartIcon />}
                                    title="Sin datos de ocupación"
                                    subtitle="No hay registros para el periodo"
                                />
                            ) : (
                                <ResponsiveContainer width="100%" height={280} minHeight={280}>
                                    <LineChart data={occupancy}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={(val) => val.slice(8)}
                                            stroke={theme.palette.text.secondary}
                                            fontSize={12}
                                        />
                                        <YAxis
                                            stroke={theme.palette.text.secondary}
                                            fontSize={12}
                                            unit="%"
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: theme.palette.background.paper,
                                                border: `1px solid ${theme.palette.divider}`,
                                                borderRadius: 8,
                                            }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="occupancy_pct"
                                            stroke={theme.palette.primary.main}
                                            strokeWidth={3}
                                            dot={{ r: 4, fill: theme.palette.primary.main }}
                                            activeDot={{ r: 6 }}
                                            name="Ocupación"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </Paper>
                    </Grid>
                )}
                {isAdmin && (
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Paper sx={{ p: 3, height: 400 }}>
                            <Typography variant="h6" gutterBottom>
                                Ingresos Mensuales
                            </Typography>
                            {revenueLoading ? (
                                <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 1, mt: 1 }} />
                            ) : revenue.length === 0 ? (
                                <EmptyState
                                    icon={<BarChartIcon />}
                                    title="Sin datos de ingresos"
                                    subtitle="No hay registros disponibles"
                                />
                            ) : (
                                <ResponsiveContainer width="100%" height={280} minHeight={280}>
                                    <BarChart data={revenue}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis
                                            dataKey="month"
                                            stroke={theme.palette.text.secondary}
                                            fontSize={12}
                                        />
                                        <YAxis
                                            stroke={theme.palette.text.secondary}
                                            fontSize={12}
                                            tickFormatter={(val) => `$${val / 1000}k`}
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'transparent' }}
                                            contentStyle={{
                                                backgroundColor: theme.palette.background.paper,
                                                border: `1px solid ${theme.palette.divider}`,
                                                borderRadius: 8,
                                            }}
                                            formatter={(value: number | undefined) => [`$${(value ?? 0).toLocaleString()}`, 'Ingresos']}
                                        />
                                        <Bar
                                            dataKey="revenue"
                                            fill={theme.palette.success.main}
                                            radius={[4, 4, 0, 0]}
                                            name="Ingresos"
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </Paper>
                    </Grid>
                )}

                {/* Availability Widget */}
                <Grid size={{ xs: 12 }}>
                    <AvailabilityWidget />
                </Grid>
            </Grid>
        </Container>
    );
}
