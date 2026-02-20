import { Card, CardContent, CardHeader, List, ListItem, ListItemText, Chip, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { reportsApi, type TodayAvailability } from '../../api/reports';

export default function AvailabilityWidget() {
    const { data: availability } = useQuery<TodayAvailability[]>({
        queryKey: ['today-availability'],
        queryFn: reportsApi.getTodayAvailability,
    });

    return (
        <Card>
            <CardHeader title="Disponibilidad Hoy" />
            <CardContent>
                <List>
                    {availability?.map((item) => (
                        <ListItem key={item.ubicacion_id} disablePadding sx={{ py: 1 }}>
                            <ListItemText
                                primary={item.nombre}
                                secondary={item.status === 'OCUPADO' ? `Ocupado por: ${item.cliente}` : null}
                            />
                            <Chip
                                label={item.status}
                                color={item.status === 'DISPONIBLE' ? 'success' : 'error'}
                                size="small"
                            />
                        </ListItem>
                    ))}
                    {(!availability || availability.length === 0) && (
                        <Typography variant="body2" color="text.secondary" align="center">
                            No hay información disponible.
                        </Typography>
                    )}
                </List>
            </CardContent>
        </Card>
    );
}
