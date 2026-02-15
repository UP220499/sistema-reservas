import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Box,
    Typography,
    Card,
    CardContent,
    TextField,
    Button,
    MenuItem,
    Alert,
    IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import dayjs from 'dayjs';
import {
    reservationsApi,
    catalogsApi,
    type CreateReservationPayload,
} from '../../api/reservations';
import { clientsApi } from '../../api/clients';

export default function ReservationFormPage() {
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const isEditing = !!id;

    // Detect if coming from a block (pre-fill from query params)
    const fromBlock = searchParams.get('from') === 'bloqueo';
    const prefillUbicacion = searchParams.get('ubicacion_id') || '';
    const prefillCheckin = searchParams.get('checkin') || '';
    const prefillCheckout = searchParams.get('checkout') || '';

    const [form, setForm] = useState<CreateReservationPayload>({
        cliente_id: '',
        ubicacion_id: prefillUbicacion,
        origen_reserva_code: fromBlock ? 'EXTERNA' : 'DIRECTA',
        estatus_reserva_code: 'PENDIENTE',
        checkin_datetime: prefillCheckin || dayjs().add(1, 'day').hour(15).minute(0).format('YYYY-MM-DDTHH:mm'),
        checkout_datetime: prefillCheckout || dayjs().add(3, 'day').hour(11).minute(0).format('YYYY-MM-DDTHH:mm'),
        total_reserva: undefined,
        notas: '',
    });
    const [error, setError] = useState('');

    // Load clients for dropdown
    const { data: clientsData } = useQuery({
        queryKey: ['clients-all'],
        queryFn: () => clientsApi.findAll({ pageSize: 100 }),
    });

    // Load ubicaciones for dropdown
    const { data: ubicaciones } = useQuery({
        queryKey: ['ubicaciones'],
        queryFn: () => catalogsApi.getUbicaciones(),
    });

    // Load existing reservation if editing
    const { data: existing } = useQuery({
        queryKey: ['reservation', id],
        queryFn: () => reservationsApi.findOne(id!),
        enabled: isEditing,
    });

    useEffect(() => {
        if (existing) {
            setForm({
                cliente_id: existing.cliente_id,
                ubicacion_id: existing.ubicacion_id,
                origen_reserva_code: existing.origen_reserva_code,
                estatus_reserva_code: existing.estatus_reserva_code,
                checkin_datetime: dayjs(existing.fecha_entrada).format('YYYY-MM-DDTHH:mm'),
                checkout_datetime: dayjs(existing.fecha_salida).format('YYYY-MM-DDTHH:mm'),
                total_reserva: Number(existing.precio_total) || undefined,
                notas: existing.notas || '',
            });
        }
    }, [existing]);

    const mutation = useMutation({
        mutationFn: (payload: CreateReservationPayload) => {
            const data = {
                ...payload,
                checkin_datetime: new Date(payload.checkin_datetime).toISOString(),
                checkout_datetime: new Date(payload.checkout_datetime).toISOString(),
            };
            return isEditing
                ? reservationsApi.update(id!, data)
                : reservationsApi.create(data);
        },
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['reservations'] });
            navigate(`/reservaciones/${result.reserva_id}`);
        },
        onError: () => setError('Error al guardar la reservación'),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!form.cliente_id || !form.ubicacion_id) {
            setError('Selecciona un cliente y una ubicación');
            return;
        }
        mutation.mutate(form);
    };

    const updateField = <K extends keyof CreateReservationPayload>(
        key: K,
        value: CreateReservationPayload[K],
    ) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <IconButton onClick={() => navigate('/reservaciones')}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h5" fontWeight={700}>
                    {isEditing ? 'Editar Reservación' : 'Nueva Reservación'}
                </Typography>
            </Box>

            {fromBlock && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    Creando reservación desde bloqueo de Airbnb — las fechas y ubicación fueron pre-llenadas.
                    Solo falta seleccionar el <strong>cliente</strong> y registrar el <strong>monto total</strong>.
                </Alert>
            )}

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            <Card>
                <CardContent>
                    <Box
                        component="form"
                        onSubmit={handleSubmit}
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                            gap: 2.5,
                        }}
                    >
                        <TextField
                            select
                            label="Cliente"
                            value={form.cliente_id}
                            onChange={(e) => updateField('cliente_id', e.target.value)}
                            required
                            fullWidth
                        >
                            {clientsData?.items?.map((client) => (
                                <MenuItem key={client.cliente_id} value={client.cliente_id}>
                                    {client.nombre}
                                </MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            select
                            label="Ubicación"
                            value={form.ubicacion_id}
                            onChange={(e) => updateField('ubicacion_id', e.target.value)}
                            required
                            fullWidth
                        >
                            {ubicaciones?.map((ub) => (
                                <MenuItem key={ub.ubicacion_id} value={ub.ubicacion_id}>
                                    {ub.nombre}
                                </MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            select
                            label="Origen"
                            value={form.origen_reserva_code}
                            onChange={(e) =>
                                updateField('origen_reserva_code', e.target.value)
                            }
                            fullWidth
                        >
                            <MenuItem value="DIRECTA">Directa</MenuItem>
                            <MenuItem value="EXTERNA">Externa</MenuItem>
                        </TextField>

                        <TextField
                            select
                            label="Estatus"
                            value={form.estatus_reserva_code || 'PENDIENTE'}
                            onChange={(e) =>
                                updateField('estatus_reserva_code', e.target.value)
                            }
                            fullWidth
                        >
                            <MenuItem value="PENDIENTE">Pendiente</MenuItem>
                            <MenuItem value="CONFIRMADA">Confirmada</MenuItem>
                        </TextField>

                        <TextField
                            label="Check-in"
                            type="datetime-local"
                            value={form.checkin_datetime}
                            onChange={(e) =>
                                updateField('checkin_datetime', e.target.value)
                            }
                            fullWidth
                            required
                            slotProps={{ inputLabel: { shrink: true } }}
                        />

                        <TextField
                            label="Check-out"
                            type="datetime-local"
                            value={form.checkout_datetime}
                            onChange={(e) =>
                                updateField('checkout_datetime', e.target.value)
                            }
                            fullWidth
                            required
                            slotProps={{ inputLabel: { shrink: true } }}
                        />

                        <TextField
                            label="Total"
                            type="number"
                            value={form.total_reserva ?? ''}
                            onChange={(e) =>
                                updateField(
                                    'total_reserva',
                                    e.target.value ? parseFloat(e.target.value) : undefined,
                                )
                            }
                            fullWidth
                            slotProps={{ input: { startAdornment: <span>$&nbsp;</span> } }}
                        />

                        <TextField
                            label="Notas"
                            value={form.notas}
                            onChange={(e) => updateField('notas', e.target.value)}
                            fullWidth
                            multiline
                            rows={2}
                            sx={{ gridColumn: { sm: '1 / -1' } }}
                        />

                        <Box
                            sx={{
                                gridColumn: { sm: '1 / -1' },
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: 2,
                                mt: 1,
                            }}
                        >
                            <Button
                                variant="outlined"
                                onClick={() => navigate('/reservaciones')}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={mutation.isPending}
                            >
                                {mutation.isPending
                                    ? 'Guardando...'
                                    : isEditing
                                        ? 'Actualizar'
                                        : 'Crear Reservación'}
                            </Button>
                        </Box>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
}
