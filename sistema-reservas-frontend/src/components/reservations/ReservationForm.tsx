import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { qk } from '../../utils/queryKeys';
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
    Chip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import dayjs from 'dayjs';
import {
    reservationsApi,
    catalogsApi,
    type CreateReservationPayload,
    type Reserva,
} from '../../api/reservations';
import { clientsApi } from '../../api/clients';
import { getErrorMessage } from '../../utils/error';
import ConfirmDialog from '../common/ConfirmDialog';

interface ReservationFormProps {
    initialData?: Reserva;
    reservationId?: string;
    prefill?: {
        ubicacion_id: string;
        checkin: string;
        checkout: string;
        fromBlock: boolean;
    };
}

export default function ReservationForm({ initialData, reservationId, prefill }: ReservationFormProps) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const isEditing = !!reservationId;

    const [form, setForm] = useState<CreateReservationPayload>({
        cliente_id: initialData?.cliente_id || '',
        ubicacion_id: initialData?.ubicacion_id || prefill?.ubicacion_id || '',
        origen_reserva_code: initialData?.origen_reserva_code || (prefill?.fromBlock ? 'EXTERNA' : 'DIRECTA'),
        estatus_reserva_code: initialData?.estatus_reserva_code || 'PENDIENTE',
        checkin_datetime: initialData?.checkin_datetime
            ? dayjs(initialData.checkin_datetime).format('YYYY-MM-DDTHH:mm')
            : prefill?.checkin || dayjs().add(1, 'day').hour(15).minute(0).format('YYYY-MM-DDTHH:mm'),
        checkout_datetime: initialData?.checkout_datetime
            ? dayjs(initialData.checkout_datetime).format('YYYY-MM-DDTHH:mm')
            : prefill?.checkout || dayjs().add(3, 'day').hour(11).minute(0).format('YYYY-MM-DDTHH:mm'),
        total_reserva: initialData?.total_reserva ? Number(initialData.total_reserva) : undefined,
        notas: initialData?.notas || '',
    });
    const [error, setError] = useState('');
    const [totalError, setTotalError] = useState('');
    const [confirmHistoricOpen, setConfirmHistoricOpen] = useState(false);

    // Load clients for dropdown
    const { data: clientsData } = useQuery({
        queryKey: qk.clients.all(),
        queryFn: () => clientsApi.findAll({ pageSize: 100, active: true }),
    });

    // Load ubicaciones for dropdown
    const { data: ubicaciones } = useQuery({
        queryKey: qk.ubicaciones(),
        queryFn: () => catalogsApi.getUbicaciones(),
    });

    function validateTotal(v: number | undefined): string {
        if (v === undefined || isNaN(v)) return 'El total es requerido';
        if (v <= 0) return 'El total debe ser mayor a $0';
        return '';
    }

    function friendlyReservationError(raw: string): string {
        if (/total_reserva.*required/i.test(raw)) return 'El total de la reservación es requerido';
        if (/total_reserva.*greater/i.test(raw)) return 'El total debe ser mayor a $0';
        return raw;
    }

    const mutation = useMutation({
        mutationFn: (payload: CreateReservationPayload) => {
            const data = {
                ...payload,
                checkin_datetime: new Date(payload.checkin_datetime).toISOString(),
                checkout_datetime: new Date(payload.checkout_datetime).toISOString(),
            };
            return isEditing
                ? reservationsApi.update(reservationId!, data)
                : reservationsApi.create(data);
        },
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: qk.reservations.list() });
            queryClient.invalidateQueries({ queryKey: qk.calendar.events() });
            queryClient.invalidateQueries({ queryKey: qk.dashboard.todayAvailability() });
            queryClient.invalidateQueries({ queryKey: qk.dashboard.stats() });
            if (isEditing) {
                queryClient.invalidateQueries({ queryKey: qk.reservations.detail(reservationId) });
            }
            navigate(`/reservaciones/${result.reserva_id}`);
        },
        onError: (err) => setError(friendlyReservationError(getErrorMessage(err))),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!form.cliente_id || !form.ubicacion_id) {
            setError('Selecciona un cliente y una ubicación');
            return;
        }

        const tErr = validateTotal(form.total_reserva);
        if (tErr) {
            setTotalError(tErr);
            return;
        }

        if (dayjs(form.checkin_datetime).isBefore(dayjs(), 'day')) {
            setConfirmHistoricOpen(true);
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

            {prefill?.fromBlock && (
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
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {client.nombre}
                                        {(client.es_vip || (client.reservas_completadas || 0) >= 3) && (
                                            <Chip
                                                label="Frecuente"
                                                color="secondary"
                                                size="small"
                                                sx={{ height: 20, fontSize: '0.65rem' }}
                                            />
                                        )}
                                    </Box>
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
                            onChange={(e) => {
                                const parsed = e.target.value ? parseFloat(e.target.value) : undefined;
                                updateField('total_reserva', parsed);
                                setTotalError(validateTotal(parsed));
                            }}
                            required
                            error={!!totalError}
                            helperText={totalError || ' '}
                            fullWidth
                            slotProps={{
                                input: { startAdornment: <span>$&nbsp;</span> },
                                htmlInput: { min: 0.01, step: 0.01 },
                            }}
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
                                disabled={mutation.isPending || !!totalError}
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

            <ConfirmDialog
                open={confirmHistoricOpen}
                title="Reservación Histórica"
                content="La fecha de inicio es anterior a hoy. ¿Deseas registrar esta reservación histórica?"
                confirmText="Registrar"
                onClose={() => setConfirmHistoricOpen(false)}
                onConfirm={() => {
                    mutation.mutate(form);
                    setConfirmHistoricOpen(false);
                }}
            />
        </Box>
    );
}
