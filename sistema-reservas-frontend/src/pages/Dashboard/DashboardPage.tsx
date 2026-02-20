import { Box, Container, Grid, Typography, Paper, useTheme } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../../api/reports';
import StatsCard from '../../components/dashboard/StatsCard';
import HotelIcon from '@mui/icons-material/Hotel';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
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

export default function DashboardPage() {
    const theme = useTheme();

    const { data: stats } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: reportsApi.getStats,
        refetchInterval: 30000, // Refresh every 30s
    });

    const { data: occupancy } = useQuery({
        queryKey: ['dashboard-occupancy'],
        queryFn: reportsApi.getOccupancy,
    });

    const { data: revenue } = useQuery({
        queryKey: ['dashboard-revenue'],
        queryFn: reportsApi.getRevenue,
    });

    return (
        <Container maxWidth="xl">
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" gutterBottom fontWeight={700}>
                    Dashboard
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Resumen general de operaciones y estadísticas.
                </Typography>
            </Box>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatsCard
                        title="Check-ins Hoy"
                        value={stats?.checkins ?? '—'}
                        icon={<LoginIcon />}
                        color="primary"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatsCard
                        title="Check-outs Hoy"
                        value={stats?.checkouts ?? '—'}
                        icon={<LogoutIcon />}
                        color="warning"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatsCard
                        title="Hospedados"
                        value={stats?.activeReservations ?? '—'}
                        icon={<HotelIcon />}
                        color="info"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatsCard
                        title="Ingresos (Mes)"
                        value={stats?.monthlyRevenue ? `$${Number(stats.monthlyRevenue).toLocaleString()}` : '—'}
                        icon={<AttachMoneyIcon />}
                        color="success"
                    />
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper sx={{ p: 3, height: 400 }}>
                        <Typography variant="h6" gutterBottom>
                            Ocupación (Últimos 30 días)
                        </Typography>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={occupancy}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(val) => val.slice(8)} // Show only DD
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
                                    dataKey="occupancyRate"
                                    stroke={theme.palette.primary.main}
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: theme.palette.primary.main }}
                                    activeDot={{ r: 6 }}
                                    name="Ocupación"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper sx={{ p: 3, height: 400 }}>
                        <Typography variant="h6" gutterBottom>
                            Ingresos Mensuales
                        </Typography>
                        <ResponsiveContainer width="100%" height="100%">
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
                    </Paper>
                </Grid>

                {/* Availability Widget */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Box sx={{ height: 400 }}>
                        <AvailabilityWidget />
                    </Box>
                </Grid>
            </Grid>
        </Container>
    );
}
