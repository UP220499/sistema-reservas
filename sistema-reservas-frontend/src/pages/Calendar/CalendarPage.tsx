import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { qk } from '../../utils/queryKeys';
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
    Popover,
    TextField,
    Button,
    Divider,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TodayIcon from '@mui/icons-material/Today';
import dayjs from 'dayjs';
import type { CalendarEvent } from '../../types';
import { calendarApi } from '../../api/calendar';
import { catalogsApi } from '../../api/reservations';
import { statusHexColor, CALENDAR_STATUS_COLORS } from '../../utils/reservationStatus';

const DAYS_ES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTHS_ES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const getEventColor = (
    event: CalendarEvent,
    defaultColor: string,
): string => {
    if (event.tipo === 'BLOQUEO') {
        if (event.origen_bloqueo_code === 'ICAL') {
            return '#FF5A5F'; // Airbnb Red
        }
        return '#78909c'; // Manual Block (Blue Grey)
    }
    return statusHexColor(event.estatus_reserva_code, defaultColor);
};

export default function CalendarPage() {
    const theme = useTheme();
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState(dayjs());
    const [filter, setFilter] = useState<'all' | 'reservas' | 'bloqueos'>('all');
    const [pickerAnchor, setPickerAnchor] = useState<HTMLElement | null>(null);

    const from = currentDate.startOf('month').subtract(7, 'day').toISOString();
    const to = currentDate.endOf('month').add(7, 'day').toISOString();

    const { data, isLoading } = useQuery({
        queryKey: qk.calendar.events(from, to, filter),
        queryFn: () =>
            calendarApi.findAll({
                from,
                to,
                include: filter,
                page_size: 100,
            }),
    });

    // Fetch active locations for the legend
    const { data: locations } = useQuery({
        queryKey: qk.calendar.locations(),
        queryFn: catalogsApi.getUbicaciones,
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

    const goPrev = () => setCurrentDate((d) => d.subtract(1, 'month'));
    const goNext = () => setCurrentDate((d) => d.add(1, 'month'));

    const today = dayjs().format('YYYY-MM-DD');

    const [moreEventsAnchor, setMoreEventsAnchor] = useState<HTMLElement | null>(null);
    const [moreEvents, setMoreEvents] = useState<CalendarEvent[]>([]);

    const handleEventClick = (event: CalendarEvent) => {
        if (event.tipo === 'RESERVA') {
            navigate(`/reservaciones/${event.id}`);
        } else {
            const params = new URLSearchParams({
                from: 'bloqueo',
                ubicacion_id: event.ubicacion_id ?? '',
                checkin: dayjs(event.inicio_datetime).format('YYYY-MM-DDTHH:mm'),
                checkout: dayjs(event.fin_datetime).format('YYYY-MM-DDTHH:mm'),
            });
            navigate(`/reservaciones/nueva?${params.toString()}`);
        }
    };

    const LOCATION_COLORS = [
        '#009688', // Teal
        '#9c27b0', // Purple
        '#3f51b5', // Indigo
        '#795548', // Brown
        '#e91e63', // Pink
        '#607d8b', // Blue Grey
        '#ff5722', // Deep Orange
        '#4caf50', // Green
        '#f44336', // Red
        '#2196f3', // Blue
        '#ff9800', // Orange
        '#00bcd4', // Cyan
        '#8bc34a', // Light Green
        '#ffc107', // Amber
        '#673ab7', // Deep Purple
        '#cddc39', // Lime
        '#9e9e9e', // Grey
        '#3f51b5', // Indigo
        '#009688', // Teal
        '#ffeb3b', // Yellow
    ];

    const getLocationColor = (id: string) => {
        let hash = 0;
        for (let i = 0; i < id.length; i++) {
            hash = id.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % LOCATION_COLORS.length;
        return LOCATION_COLORS[index];
    };

    const renderEventChip = (event: CalendarEvent, index: number) => (
        <Tooltip
            key={`${event.id}-${index}`}
            title={
                event.tipo === 'RESERVA'
                    ? `${event.cliente_nombre ?? '—'} — ${event.ubicacion_nombre ?? '—'}`
                    : `Bloqueo — ${event.ubicacion_nombre ?? '—'} (clic para crear reservación)`
            }
            arrow
        >
            <Chip
                label={
                    event.tipo === 'RESERVA'
                        ? (event.cliente_nombre?.split(' ')[0] ?? '?')
                        : 'Bloq.'
                }
                size="small"
                onClick={(e) => {
                    e.stopPropagation();
                    handleEventClick(event);
                    if (moreEventsAnchor) {
                        setMoreEventsAnchor(null);
                        setMoreEvents([]);
                    }
                }}
                sx={{
                    height: 18,
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    bgcolor: getEventColor(event, theme.palette.primary.main),
                    color: '#fff',
                    cursor: 'pointer',
                    '& .MuiChip-label': { px: 0.75 },
                    width: '100%',
                    justifyContent: 'flex-start',
                    borderLeft: `4px solid ${getLocationColor(event.ubicacion_id)}`,
                    borderRadius: '4px',
                }}
            />
        </Tooltip>
    );

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
                    <IconButton onClick={(e) => setPickerAnchor(e.currentTarget)} color="primary" title="Ir a fecha">
                        <TodayIcon />
                    </IconButton>

                    {/* Date picker popover */}
                    <Popover
                        open={!!pickerAnchor}
                        anchorEl={pickerAnchor}
                        onClose={() => setPickerAnchor(null)}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                    >
                        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5, minWidth: 220 }}>
                            <Typography variant="subtitle2" fontWeight={600}>Ir a fecha</Typography>
                            <TextField
                                type="month"
                                size="small"
                                value={currentDate.format('YYYY-MM')}
                                onChange={(e) => {
                                    const d = dayjs(e.target.value + '-01');
                                    if (d.isValid()) {
                                        setCurrentDate(d);
                                        setPickerAnchor(null);
                                    }
                                }}
                                fullWidth
                                slotProps={{ inputLabel: { shrink: true } }}
                            />
                            <Button
                                size="small"
                                variant="outlined"
                                onClick={() => {
                                    setCurrentDate(dayjs());
                                    setPickerAnchor(null);
                                }}
                            >
                                Hoy
                            </Button>
                        </Box>
                    </Popover>
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
                                            minHeight: 110, // Increased height for better visibility
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
                                            {events.slice(0, 3).map((event, ei) => renderEventChip(event, ei))}
                                            {events.length > 3 && (
                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                    sx={{
                                                        fontSize: '0.6rem',
                                                        pl: 0.5,
                                                        cursor: 'pointer',
                                                        '&:hover': {
                                                            textDecoration: 'underline',
                                                            color: 'primary.main',
                                                        },
                                                    }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setMoreEvents(events);
                                                        setMoreEventsAnchor(e.currentTarget);
                                                    }}
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

            {/* Legends Container */}
            <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Status Legend */}
                <Box
                    sx={{
                        display: 'flex',
                        gap: 2,
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <Typography variant="subtitle2" color="text.secondary">Estatus:</Typography>
                    {[
                        { label: 'Confirmada', color: theme.palette.primary.main },
                        { label: 'Pendiente', color: CALENDAR_STATUS_COLORS.PENDIENTE },
                        { label: 'Cancelada', color: CALENDAR_STATUS_COLORS.CANCELADA },
                        { label: 'Completada', color: CALENDAR_STATUS_COLORS.COMPLETADA },
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

                <Divider />

                {/* Locations Legend */}
                <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Ubicaciones:</Typography>
                    <Box
                        sx={{
                            display: 'flex',
                            gap: 1.5,
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                        }}
                    >
                        {locations?.filter(l => l.activa).map((loc) => (
                            <Tooltip key={loc.ubicacion_id} title={loc.nombre}>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        borderRadius: 1,
                                        px: 1,
                                        py: 0.5,
                                        bgcolor: 'background.paper',
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 4,
                                            height: 14,
                                            borderRadius: 1,
                                            bgcolor: getLocationColor(loc.ubicacion_id),
                                        }}
                                    />
                                    <Typography variant="caption" color="text.primary">
                                        {loc.nombre}
                                    </Typography>
                                </Box>
                            </Tooltip>
                        ))}
                    </Box>
                </Box>
            </Box>

            {/* Hidden Events Popover */}
            <Popover
                open={!!moreEventsAnchor}
                anchorEl={moreEventsAnchor}
                onClose={() => {
                    setMoreEventsAnchor(null);
                    setMoreEvents([]);
                }}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
                slotProps={{
                    paper: { sx: { mt: 0.5 } }
                }}
            >
                <Box
                    sx={{
                        p: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0.5,
                        minWidth: 150,
                        maxHeight: 300,
                        overflowY: 'auto'
                    }}
                >
                    <Typography variant="subtitle2" sx={{ px: 0.5, mb: 0.5, fontSize: '0.75rem', color: 'text.secondary' }}>
                        Eventos del día
                    </Typography>
                    {moreEvents.map((event, index) => renderEventChip(event, index))}
                </Box>
            </Popover>
        </Box>
    );
}
