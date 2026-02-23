import { Box, Card, CardContent, CardHeader, Chip, IconButton, List, ListItem, ListItemText, Tooltip, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { reportsApi, type TodayAvailability } from '../../api/reports';

type TodayAvailabilityResponse =
  | TodayAvailability[]
  | { items: TodayAvailability[]; total: number };

export default function AvailabilityWidget() {
  const navigate = useNavigate();
  const { data } = useQuery<TodayAvailabilityResponse>({
    queryKey: ['today-availability'],
    queryFn: () => reportsApi.getTodayAvailability(),
  });

  const availability = Array.isArray(data) ? data : data?.items ?? [];

  return (
    <Card>
      <CardHeader title="Disponibilidad Hoy" />
      <CardContent>
        <List>
          {availability.map((item) => (
            <ListItem key={item.ubicacion_id} disablePadding sx={{ py: 1 }}>
              <ListItemText
                primary={item.nombre}
                secondary={
                  item.status === 'OCUPADO' ? `Ocupado por: ${item.cliente}` : null
                }
              />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {item.status === 'DISPONIBLE' && (
                  <Tooltip title="Agendar reservación">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() =>
                        navigate(`/reservaciones/nueva?ubicacion_id=${item.ubicacion_id}`)
                      }
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                <Chip
                  label={item.status}
                  color={item.status === 'DISPONIBLE' ? 'success' : 'error'}
                  size="small"
                />
              </Box>
            </ListItem>
          ))}

          {availability.length === 0 && (
            <Typography variant="body2" color="text.secondary" align="center">
              No hay información disponible.
            </Typography>
          )}
        </List>
      </CardContent>
    </Card>
  );
}