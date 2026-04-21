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
import { useIsAdmin } from '../../hooks/useIsAdmin';
import { allowedStatusTransitions, statusLabel } from '../../utils/reservationStatus';

interface ReservationFormProps {
    initialData?: Reserva;
    reservationId?: string;
    prefill?: {
        ubicacion_id: string;
        checkin: string;
        checkout: string;
        fromBlock: boolean;
        origenBloqueoCode?: string;
        blockId?: string;
    };
}

export default function ReservationForm({ initialData, reservationId, prefill }: ReservationFormProps) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const isEditing = !!reservationId;
    const isAdmin = useIsAdmin();

    const [form, setForm] = useState<CreateReservationPayload>({
        cliente_id: initialData?.cliente_id || '',
        ubicacion_id: initialData?.ubicacion_id || prefill?.ubicacion_id || '',
        origen_reserva_code: initialData?.origen_reserva_code || (prefill?.fromBlock && prefill.origenBloqueoCode === 'AIRBNB' ? 'EXTERNA' : 'DIRECTA'),
        estatus_reserva_code: initialData?.estatus_reserva_code || 'PENDIENTE',
        checkin_datetime: initialData?.checkin_datetime
            ? dayjs(initialData.checkin_datetime).format('YYYY-MM-DDTHH:mm')
            : prefill?.checkin || dayjs().add(1, 'day').hour(15).minute(0).format('YYYY-MM-DDTHH:mm'),
        checkout_datetime: initialData?.checkout_datetime
            ? dayjs(initialData.checkout_datetime).format('YYYY-MM-DDTHH:mm')
            : prefill?.checkout || dayjs().add(3, 'day').hour(11).minute(0).format('YYYY-MM-DDTHH:mm'),
        total_reserva: initialData?.total_reserva ? Number(initialData.total_reserva) : undefined,
        notas: initialData?.notas || '',
        source_block_id: prefill?.blockId || undefined,
    });
    const [error, setError] = useState('');
    const [totalError, setTotalError] = useState('');
    const [dateRangeError, setDateRangeError] = useState('');
    const [confirmHistoricOpen, setConfirmHistoricOpen] = useState(false);

    function validateDateRange(checkin: string, checkout: string): string {
        if (checkin && checkout && new Date(checkout) <= new Date(checkin)) {
            return 'La fecha y hora de salida debe ser posterior a la fecha y hora de entrada';
        }
        return '';
    }

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
        if (!isAdmin) return '';
        if (v === undefined || isNaN(v)) return 'El total es requerido';
        if (v <= 0) return 'El total debe ser mayor a $0';
        return '';
    }

    function friendlyReservationError(raw: string): string {
        if (/total_reserva.*required/i.test(raw)) return 'El total de la reservación es requerido';
        if (/total_reserva.*greater/i.test(raw)) return 'El total debe ser mayor a $0';
        if (/checkout_datetime.*greater.*checkin_datetime/i.test(raw)) return 'La fecha y hora de salida debe ser posterior a la fecha y hora de entrada';
        return raw;
    }

    const mutation = useMutation({
        mutationFn: (payload: CreateReservationPayload) => {
            const data = {
                ...payload,
                checkin_datetime: new Date(payload.checkin_datetime).toISOString(),
                checkout_datetime: new Date(payload.checkout_datetime).toISOString(),
            };

            if (isEditing && initialData) {
                const diff: Partial<CreateReservationPayload> = {};
                if (payload.cliente_id !== initialData.cliente_id) diff.cliente_id = payload.cliente_id;
                if (payload.ubicacion_id !== initialData.ubicacion_id) diff.ubicacion_id = payload.ubicacion_id;
                if (payload.origen_reserva_code !== initialData.origen_reserva_code) diff.origen_reserva_code = payload.origen_reserva_code;
                if (payload.estatus_reserva_code !== initialData.estatus_reserva_code) diff.estatus_reserva_code = payload.estatus_reserva_code;
                if (payload.notas !== (initialData.notas || '')) diff.notas = payload.notas;
                
                const currentTotal = payload.total_reserva !== undefined ? Number(payload.total_reserva) : undefined;
                const initialTotal = initialData.total_reserva !== null ? Number(initialData.total_reserva) : undefined;
                if (currentTotal !== initialTotal) diff.total_reserva = currentTotal;

                const initCheckin = new Date(initialData.checkin_datetime).toISOString();
                const initCheckout = new Date(initialData.checkout_datetime).toISOString();
                if (data.checkin_datetime !== initCheckin) diff.checkin_datetime = data.checkin_datetime;
                if (data.checkout_datetime !== initCheckout) diff.checkout_datetime = data.checkout_datetime;
                
                return reservationsApi.update(reservationId!, diff);
            }
            
            return reservationsApi.create(data);
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

        const dErr = validateDateRange(form.checkin_datetime, form.checkout_datetime);
        if (dErr) {
            setDateRangeError(dErr);
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

            {prefill?.fromBlock && prefill.origenBloqueoCode === 'AIRBNB' && (
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
                                        {(client.loyalty?.reservas_completadas_count ?? 0) >= 3 && (
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
                            {isEditing && initialData ? (
                                allowedStatusTransitions(initialData.estatus_reserva_code)
                                    .filter((code) => isAdmin || code !== 'CANCELADA')
                                    .map((code) => (
                                        <MenuItem key={code} value={code}>
                                            {statusLabel(code)}
                                        </MenuItem>
                                    ))
                            ) : (
                                [
                                    <MenuItem key="PENDIENTE" value="PENDIENTE">Pendiente</MenuItem>,
                                    <MenuItem key="CONFIRMADA" value="CONFIRMADA">Confirmada</MenuItem>,
                                ]
                            )}
                        </TextField>

                        <TextField
                            label="Check-in"
                            type="datetime-local"
                            value={form.checkin_datetime}
                            onChange={(e) => {
                                updateField('checkin_datetime', e.target.value);
                                setDateRangeError(validateDateRange(e.target.value, form.checkout_datetime));
                            }}
                            fullWidth
                            required
                            slotProps={{ inputLabel: { shrink: true } }}
                        />

                        <TextField
                            label="Check-out"
                            type="datetime-local"
                            value={form.checkout_datetime}
                            onChange={(e) => {
                                updateField('checkout_datetime', e.target.value);
                                setDateRangeError(validateDateRange(form.checkin_datetime, e.target.value));
                            }}
                            error={!!dateRangeError}
                            helperText={dateRangeError || undefined}
                            fullWidth
                            required
                            slotProps={{ inputLabel: { shrink: true } }}
                        />

                        {isAdmin && (
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
                        )}

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
                                disabled={mutation.isPending || !!totalError || !!dateRangeError}
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
