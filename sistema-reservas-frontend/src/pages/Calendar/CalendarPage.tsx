import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Box,
    Typography,
    Card,
    IconButton,
    Chip,
    Tooltip,
    ToggleButtonGroup,
    ToggleButton,
    Skeleton,
    useTheme,
    alpha,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TodayIcon from '@mui/icons-material/Today';
import dayjs from 'dayjs';
import type { CalendarEvent } from '../../types';
import { calendarApi } from '../../api/calendar';

const DAYS_ES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTHS_ES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function getEventColor(event: CalendarEvent, themeColor: string): string {
    if (event.tipo === 'BLOQUEO') return '#78909c'; // blue-grey
    switch (event.estatus_reserva_code) {
        case 'CONFIRMADA': return themeColor;
        case 'PENDIENTE': return '#ff9800';
        case 'CANCELADA': return '#ef5350';
        case 'COMPLETADA': return '#42a5f5';
        default: return '#9e9e9e';
    }
}

export default function CalendarPage() {
    const theme = useTheme();
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState(dayjs());
    const [filter, setFilter] = useState<'all' | 'reservas' | 'bloqueos'>('all');

    const from = currentDate.startOf('month').subtract(7, 'day').toISOString();
    const to = currentDate.endOf('month').add(7, 'day').toISOString();

    const { data, isLoading } = useQuery({
        queryKey: ['calendar', from, to, filter],
        queryFn: () =>
            calendarApi.findAll({
                from,
                to,
                include: filter,
                page_size: 100,
            }),
    });

    // Build the calendar grid
    const calendarGrid = useMemo(() => {
        const startOfMonth = currentDate.startOf('month');
        const endOfMonth = currentDate.endOf('month');

        // Monday = 0. Convert JS day (0=Sun) to Mon-based index.
        const rawDay = startOfMonth.day();
        const startDay = rawDay === 0 ? 6 : rawDay - 1;

        const totalDays = endOfMonth.date();
        const weeks: { date: dayjs.Dayjs; isCurrentMonth: boolean }[][] = [];
        let currentWeek: { date: dayjs.Dayjs; isCurrentMonth: boolean }[] = [];

        // Fill days before month start
        for (let i = startDay - 1; i >= 0; i--) {
            currentWeek.push({
                date: startOfMonth.subtract(i + 1, 'day'),
                isCurrentMonth: false,
            });
        }

        // Fill month days
        for (let day = 1; day <= totalDays; day++) {
            currentWeek.push({
                date: startOfMonth.date(day),
                isCurrentMonth: true,
            });
            if (currentWeek.length === 7) {
                weeks.push(currentWeek);
                currentWeek = [];
            }
        }

        // Fill remaining days
        if (currentWeek.length > 0) {
            let nextDay = 1;
            while (currentWeek.length < 7) {
                currentWeek.push({
                    date: endOfMonth.add(nextDay, 'day'),
                    isCurrentMonth: false,
                });
                nextDay++;
            }
            weeks.push(currentWeek);
        }

        return weeks;
    }, [currentDate]);

    // Map events to dates
    const eventsByDate = useMemo(() => {
        const map = new Map<string, CalendarEvent[]>();
        if (!data?.items) return map;

        data.items.forEach((event) => {
            const start = dayjs(event.inicio_datetime);
            const end = dayjs(event.fin_datetime);
            let current = start;

            while (
                current.isBefore(end, 'day') ||
                current.isSame(end, 'day')
            ) {
                const key = current.format('YYYY-MM-DD');
                if (!map.has(key)) map.set(key, []);
                map.get(key)!.push(event);
                current = current.add(1, 'day');
            }
        });

        return map;
    }, [data]);

    const goToToday = () => setCurrentDate(dayjs());
    const goPrev = () => setCurrentDate((d) => d.subtract(1, 'month'));
    const goNext = () => setCurrentDate((d) => d.add(1, 'month'));

    const today = dayjs().format('YYYY-MM-DD');

    return (
        <Box>
            {/* Header */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 3,
                    flexWrap: 'wrap',
                    gap: 2,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton onClick={goPrev}>
                        <ChevronLeftIcon />
                    </IconButton>
                    <Typography variant="h5" fontWeight={700} sx={{ minWidth: 220, textAlign: 'center' }}>
                        {MONTHS_ES[currentDate.month()]} {currentDate.year()}
                    </Typography>
                    <IconButton onClick={goNext}>
                        <ChevronRightIcon />
                    </IconButton>
                    <IconButton onClick={goToToday} color="primary" title="Hoy">
                        <TodayIcon />
                    </IconButton>
                </Box>

                <ToggleButtonGroup
                    value={filter}
                    exclusive
                    onChange={(_, v) => v && setFilter(v)}
                    size="small"
                >
                    <ToggleButton value="all">Todo</ToggleButton>
                    <ToggleButton value="reservas">Reservas</ToggleButton>
                    <ToggleButton value="bloqueos">Bloqueos</ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {/* Calendar Grid */}
            <Card sx={{ overflow: 'hidden' }}>
                {/* Day headers */}
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(7, 1fr)',
                        bgcolor: 'primary.main',
                    }}
                >
                    {DAYS_ES.map((day) => (
                        <Box
                            key={day}
                            sx={{
                                py: 1,
                                textAlign: 'center',
                                color: 'primary.contrastText',
                                fontWeight: 600,
                                fontSize: '0.85rem',
                            }}
                        >
                            {day}
                        </Box>
                    ))}
                </Box>

                {/* Weeks */}
                {isLoading ? (
                    <Box sx={{ p: 2 }}>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton
                                key={i}
                                variant="rectangular"
                                height={80}
                                sx={{ mb: 0.5, borderRadius: 1 }}
                            />
                        ))}
                    </Box>
                ) : (
                    calendarGrid.map((week, wi) => (
                        <Box
                            key={wi}
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(7, 1fr)',
                                borderTop: '1px solid',
                                borderColor: 'divider',
                            }}
                        >
                            {week.map((cell) => {
                                const key = cell.date.format('YYYY-MM-DD');
                                const events = eventsByDate.get(key) || [];
                                const isToday = key === today;

                                return (
                                    <Box
                                        key={key}
                                        sx={{
                                            minHeight: 90,
                                            p: 0.5,
                                            borderRight: '1px solid',
                                            borderColor: 'divider',
                                            bgcolor: !cell.isCurrentMonth
                                                ? 'action.hover'
                                                : isToday
                                                    ? alpha(theme.palette.primary.main, 0.06)
                                                    : 'background.paper',
                                            '&:last-child': { borderRight: 'none' },
                                            cursor: events.length > 0 ? 'pointer' : 'default',
                                        }}
                                    >
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                width: 24,
                                                height: 24,
                                                borderRadius: '50%',
                                                fontWeight: isToday ? 700 : cell.isCurrentMonth ? 500 : 400,
                                                color: !cell.isCurrentMonth
                                                    ? 'text.disabled'
                                                    : isToday
                                                        ? 'primary.contrastText'
                                                        : 'text.primary',
                                                bgcolor: isToday ? 'primary.main' : 'transparent',
                                                mb: 0.5,
                                            }}
                                        >
                                            {cell.date.date()}
                                        </Typography>

                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                                            {events.slice(0, 3).map((event, ei) => (
                                                <Tooltip
                                                    key={`${event.id}-${ei}`}
                                                    title={
                                                        event.tipo === 'RESERVA'
                                                            ? `${event.cliente_nombre} — ${event.ubicacion_nombre}`
                                                            : `Bloqueo — ${event.ubicacion_nombre}`
                                                    }
                                                    arrow
                                                >
                                                    <Chip
                                                        label={
                                                            event.tipo === 'RESERVA'
                                                                ? event.cliente_nombre?.split(' ')[0]
                                                                : 'Bloq.'
                                                        }
                                                        size="small"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (event.tipo === 'RESERVA') {
                                                                navigate(`/reservaciones/${event.id}`);
                                                            }
                                                        }}
                                                        sx={{
                                                            height: 18,
                                                            fontSize: '0.65rem',
                                                            fontWeight: 600,
                                                            bgcolor: getEventColor(event, theme.palette.primary.main),
                                                            color: '#fff',
                                                            cursor: event.tipo === 'RESERVA' ? 'pointer' : 'default',
                                                            '& .MuiChip-label': { px: 0.75 },
                                                        }}
                                                    />
                                                </Tooltip>
                                            ))}
                                            {events.length > 3 && (
                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                    sx={{ fontSize: '0.6rem', pl: 0.5 }}
                                                >
                                                    +{events.length - 3} más
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Box>
                    ))
                )}
            </Card>

            {/* Legend */}
            <Box
                sx={{
                    display: 'flex',
                    gap: 2,
                    mt: 2,
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                }}
            >
                {[
                    { label: 'Confirmada', color: theme.palette.primary.main },
                    { label: 'Pendiente', color: '#ff9800' },
                    { label: 'Cancelada', color: '#ef5350' },
                    { label: 'Completada', color: '#42a5f5' },
                    { label: 'Bloqueo', color: '#78909c' },
                ].map(({ label, color }) => (
                    <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box
                            sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                bgcolor: color,
                            }}
                        />
                        <Typography variant="caption" color="text.secondary">
                            {label}
                        </Typography>
                    </Box>
                ))}
            </Box>
        </Box>
    );
}
