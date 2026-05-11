import { Box, Card, CardContent, Typography, List, ListItem, Chip, Divider, Skeleton, Button } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useQuery } from '@tanstack/react-query';
import { reservationsApi } from '../../api/reservations';
import { qk } from '../../utils/queryKeys';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

export default function PaymentRemindersWidget() {
    const navigate = useNavigate();
    
    const { data: reminders, isLoading } = useQuery({
        queryKey: qk.reservations.reminders(3),
        queryFn: () => reservationsApi.getPendingBalancesReminders(3),
    });

    if (isLoading) {
        return <Skeleton variant="rectangular" height={250} sx={{ borderRadius: 2 }} />;
    }

    if (!reminders || reminders.length === 0) {
        return null; // Don't show the widget if there are no pending reminders to save space
    }

    return (
        <Card sx={{ borderLeft: '4px solid', borderColor: 'warning.main', height: '100%' }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                    <WarningAmberIcon color="warning" />
                    <Typography variant="h6" fontWeight={600}>
                        Avisos de Pagos Pendientes
                    </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Reservas con Check-in en los próximos 3 días que aún tienen saldo pendiente.
                </Typography>
                
                <List disablePadding>
                    {reminders.map((reserva, index) => {
                        const checkinDate = dayjs(reserva.checkin_datetime);
                        const daysUntil = checkinDate.diff(dayjs().startOf('day'), 'day');
                        
                        let timeText = '';
                        if (daysUntil === 0) timeText = 'Check-in hoy';
                        else if (daysUntil === 1) timeText = 'Check-in mañana';
                        else timeText = `Check-in en ${daysUntil} días`;

                        // We can parse the any extra fields sent from the backend if available
                        // The backend might be injecting "saldo_pendiente" directly as a property
                        const saldo = (reserva as any).saldo_pendiente;

                        return (
                            <Box key={reserva.reserva_id}>
                                {index > 0 && <Divider component="li" />}
                                <ListItem
                                    alignItems="flex-start"
                                    sx={{ px: 0, py: 1.5, display: 'flex', justifyContent: 'space-between' }}
                                >
                                    <Box>
                                        <Typography variant="subtitle2" sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline', color: 'primary.main' } }} onClick={() => navigate(`/reservaciones/${reserva.reserva_id}`)}>
                                            Reserva #{reserva.reserva_id}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {reserva.cliente_nombre || 'Cliente sin nombre'}
                                        </Typography>
                                        <Typography variant="caption" color="error.main" fontWeight={600}>
                                            {timeText}
                                        </Typography>
                                    </Box>
                                    
                                    <Box sx={{ textAlign: 'right' }}>
                                        {saldo !== undefined ? (
                                            <Typography variant="body2" fontWeight="bold" color="error.main">
                                                Saldo: ${Number(saldo).toLocaleString()}
                                            </Typography>
                                        ) : (
                                            <Chip size="small" label="Saldo Pendiente" color="warning" />
                                        )}
                                        <Button size="small" sx={{ mt: 0.5, p: 0, minWidth: 'auto', fontSize: '0.75rem' }} onClick={() => navigate(`/reservaciones/${reserva.reserva_id}`)}>
                                            Ver detalle
                                        </Button>
                                    </Box>
                                </ListItem>
                            </Box>
                        );
                    })}
                </List>
            </CardContent>
        </Card>
    );
}
