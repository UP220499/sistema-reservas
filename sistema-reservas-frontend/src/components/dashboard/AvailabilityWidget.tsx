import {
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Chip,
    Paper,
    Stack,
    Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { reportsApi, type TodayAvailability } from '../../api/reports';
import { qk } from '../../utils/queryKeys';

type TodayAvailabilityResponse =
  | TodayAvailability[]
  | { items: TodayAvailability[]; total: number };

function statusColor(
    status: TodayAvailability['status'],
): 'success' | 'error' | 'warning' {
    if (status === 'OCUPADO') return 'error';
    if (status === 'MANTENIMIENTO') return 'warning';
    return 'success';
}

function statusLabel(status: TodayAvailability['status']): string {
    if (status === 'OCUPADO') return 'Ocupado';
    if (status === 'MANTENIMIENTO') return 'Mantenimiento';
    return 'Disponible';
}

function borderColor(status: TodayAvailability['status']): string {
    if (status === 'OCUPADO') return 'error.light';
    if (status === 'MANTENIMIENTO') return 'warning.light';
    return 'success.light';
}

export default function AvailabilityWidget() {
    const navigate = useNavigate();
    const { data } = useQuery<TodayAvailabilityResponse>({
        queryKey: qk.dashboard.todayAvailability(),
        queryFn: () => reportsApi.getTodayAvailability(),
    });

    const availability = Array.isArray(data) ? data : (data?.items ?? []);

    return (
        <Card sx={{ display: 'flex', flexDirection: 'column' }}>
            <CardHeader
                title="Disponibilidad Hoy"
                titleTypographyProps={{ variant: 'h6' }}
                sx={{ pb: 1 }}
            />
            <CardContent sx={{ flex: 1, overflow: 'hidden', pt: 0, px: 2 }}>
                {availability.length === 0 ? (
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        align="center"
                        sx={{ mt: 2 }}
                    >
                        No hay información disponible.
                    </Typography>
                ) : (
                    <Box
                        sx={{
                            maxHeight: 320,
                            overflowY: 'auto',
                            overflowX: 'hidden',
                            width: '100%',
                        }}
                    >
                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                                gap: 1.5,
                                width: '100%',
                            }}
                        >
                            {availability.map((item) => (
                                <Paper
                                    key={item.ubicacion_id}
                                    variant="outlined"
                                    sx={{
                                        p: 2,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 1,
                                        borderColor: borderColor(item.status),
                                        borderRadius: 2,
                                        minWidth: 0,
                                        minHeight: 80,
                                    }}
                                >
                                    <Stack
                                        direction="row"
                                        justifyContent="space-between"
                                        alignItems="flex-start"
                                        spacing={1}
                                    >
                                        <Typography
                                            variant="body2"
                                            fontWeight={600}
                                            sx={{ lineHeight: 1.3, minWidth: 0, wordBreak: 'break-word' }}
                                        >
                                            {item.nombre}
                                        </Typography>
                                        <Chip
                                            label={statusLabel(item.status)}
                                            color={statusColor(item.status)}
                                            size="small"
                                            sx={{ flexShrink: 0 }}
                                        />
                                    </Stack>

                                    {/* OCUPADO: show tipo and client without the "— · por:" pattern */}
                                    {item.status === 'OCUPADO' && (
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                                            {item.tipo && (
                                                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                                                    {item.tipo}
                                                </Typography>
                                            )}
                                            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                                                {item.cliente ? (
                                                    <>
                                                        <Box component="span" sx={{ fontWeight: 600 }}>Cliente: </Box>
                                                        {item.cliente}
                                                    </>
                                                ) : 'Ocupado'}
                                            </Typography>
                                        </Box>
                                    )}

                                    {item.status === 'DISPONIBLE' && (
                                        <Box>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                color="success"
                                                startIcon={<AddIcon fontSize="inherit" />}
                                                onClick={() =>
                                                    navigate(
                                                        `/reservaciones/nueva?ubicacion_id=${item.ubicacion_id}`,
                                                    )
                                                }
                                                sx={{ fontSize: '0.72rem', py: 0.3 }}
                                            >
                                                Agendar
                                            </Button>
                                        </Box>
                                    )}
                                </Paper>
                            ))}
                        </Box>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
}
