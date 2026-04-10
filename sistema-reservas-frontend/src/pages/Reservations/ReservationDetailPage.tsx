import { useState } from 'react';
import axios from 'axios';
import { getErrorMessage } from '../../utils/error';
import { useToast } from '../../hooks/useToast';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    Chip,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    IconButton,
    Alert,
    Skeleton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import dayjs from 'dayjs';
import {
    reservationsApi,
    type CreatePaymentPayload,
    type UpdateTimesPayload,
} from '../../api/reservations';
import InfoRow from '../../components/common/InfoRow';
import {
    statusLabel,
    statusChipColor,
    canPay,
    allowedStatusTransitions,
} from '../../utils/reservationStatus';
import { qk } from '../../utils/queryKeys';
import { useIsAdmin } from '../../hooks/useIsAdmin';

/** Returns an error message or '' if valid. */
function validateAmount(monto: number, saldo: number): string {
    if (!isFinite(monto) || monto <= 0) return 'El monto debe ser mayor a 0.';
    if (monto > saldo) return `El monto excede el saldo restante ($${saldo.toLocaleString()}).`;
    return '';
}

interface PaymentErrorDetail {
    message: string;
    remaining_balance?: number;
}

/** Extracts message and optional remaining_balance from a backend 400 payment error. */
function getPaymentErrorDetail(err: unknown): PaymentErrorDetail {
    if (axios.isAxiosError(err)) {
        const data: unknown = err.response?.data;
        let message = 'Error al registrar el pago.';
        let remaining_balance: number | undefined;
        if (typeof data === 'object' && data !== null) {
            const d = data as Record<string, unknown>;
            if (typeof d.message === 'string' && d.message.trim()) {
                message = d.message;
            }
            if (d.remaining_balance !== undefined && d.remaining_balance !== null) {
                const parsed = Number(d.remaining_balance);
                if (isFinite(parsed)) {
                    remaining_balance = parsed;
                }
            }
        }
        return { message, remaining_balance };
    }
    return { message: getErrorMessage(err) };
}

export default function ReservationDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [statusDialogOpen, setStatusDialogOpen] = useState(false);
    const [newStatus, setNewStatus] = useState('');
    const [paymentForm, setPaymentForm] = useState<CreatePaymentPayload>({
        tipo_pago_mov_code: 'ANTICIPO',
        metodo_pago_code: 'EFECTIVO',
        monto: 0,
        fecha_pago: dayjs().format('YYYY-MM-DDTHH:mm'),
        referencia: '',
        notas: '',
    });
    const [error, setError] = useState('');
    const [amountError, setAmountError] = useState('');
    const [backendPaymentError, setBackendPaymentError] = useState<PaymentErrorDetail | null>(null);
    const [timesDialogOpen, setTimesDialogOpen] = useState(false);
    const [timesForm, setTimesForm] = useState({ checkinTime: '', checkoutTime: '' });

    const isAdmin = useIsAdmin();

    const { data: reserva, isLoading } = useQuery({
        queryKey: qk.reservations.detail(id),
        queryFn: () => reservationsApi.findOne(id!),
        enabled: !!id,
    });

    const { data: payments, isLoading: paymentsLoading } = useQuery({
        queryKey: qk.reservations.payments(id),
        queryFn: () => reservationsApi.getPayments(id!),
        enabled: !!id,
    });

    const createPaymentMutation = useMutation({
        mutationFn: (payload: CreatePaymentPayload) =>
            reservationsApi.createPayment(id!, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: qk.reservations.payments(id) });
            queryClient.invalidateQueries({ queryKey: qk.reservations.detail(id) });
            queryClient.invalidateQueries({ queryKey: qk.reservations.list() });
            queryClient.invalidateQueries({ queryKey: qk.dashboard.stats() });
            setPaymentDialogOpen(false);
            resetPaymentForm();
            showToast('Pago registrado correctamente.');
        },
        onError: (err) => setBackendPaymentError(getPaymentErrorDetail(err)),
    });

    const updateTimesMutation = useMutation({
        mutationFn: (payload: UpdateTimesPayload) =>
            reservationsApi.updateTimes(id!, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: qk.reservations.detail(id) });
            queryClient.invalidateQueries({ queryKey: qk.reservations.list() });
            queryClient.invalidateQueries({ queryKey: qk.calendar.events() });
            setTimesDialogOpen(false);
            showToast('Horas actualizadas correctamente.');
        },
        onError: (err) => {
            const message =
                axios.isAxiosError(err) && err.response?.status === 409
                    ? 'Conflicto de horarios (traslape detectado)'
                    : getErrorMessage(err);
            showToast(message, 'error');
        },
    });

    const changeStatusMutation = useMutation({
        mutationFn: (status: string) =>
            reservationsApi.changeStatus(id!, status),
        onSuccess: (_, status) => {
            queryClient.invalidateQueries({ queryKey: qk.reservations.detail(id) });
            queryClient.invalidateQueries({ queryKey: qk.reservations.list() });
            queryClient.invalidateQueries({ queryKey: qk.dashboard.todayAvailability() });
            queryClient.refetchQueries({ queryKey: qk.dashboard.todayAvailability() });
            queryClient.invalidateQueries({ queryKey: qk.dashboard.stats() });
            queryClient.invalidateQueries({ queryKey: qk.calendar.events() });
            setStatusDialogOpen(false);
            const label = status === 'CANCELADA' ? 'cancelada' : status === 'CONFIRMADA' ? 'confirmada' : status === 'COMPLETADA' ? 'completada' : 'actualizada';
            showToast(`Reservación ${label} correctamente.`);
        },
        onError: (err) => setError(getErrorMessage(err)),
    });

    const resetPaymentForm = () => {
        setPaymentForm({
            tipo_pago_mov_code: 'ANTICIPO',
            metodo_pago_code: 'EFECTIVO',
            monto: 0,
            fecha_pago: dayjs().format('YYYY-MM-DDTHH:mm'),
            referencia: '',
            notas: '',
        });
        setError('');
        setAmountError('');
        setBackendPaymentError(null);
    };

    const handlePaymentSubmit = () => {
        if (createPaymentMutation.isPending) return;
        const err = validateAmount(paymentForm.monto, saldoPendiente);
        if (err) {
            setAmountError(err);
            return;
        }
        createPaymentMutation.mutate({
            ...paymentForm,
            fecha_pago: new Date(paymentForm.fecha_pago).toISOString(),
        });
    };

    const totalPagado = payments?.reduce(
        (sum, p) => sum + (Number(p.monto) || 0),
        0,
    ) || 0;
    const totalReserva = Number(reserva?.total_reserva ?? 0);
    const saldoPendiente = totalReserva - totalPagado;

    if (isLoading) {
        return (
            <Box>
                <Skeleton variant="text" width={200} height={40} />
                <Skeleton variant="rectangular" height={200} sx={{ mt: 2, borderRadius: 2 }} />
            </Box>
        );
    }

    if (!reserva) {
        return (
            <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography color="text.secondary">
                    Reservación no encontrada
                </Typography>
                <Button onClick={() => navigate('/reservaciones')} sx={{ mt: 2 }}>
                    Volver
                </Button>
            </Box>
        );
    }

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <IconButton onClick={() => navigate('/reservaciones')}>
                    <ArrowBackIcon />
                </IconButton>
                <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h5" fontWeight={700}>
                        Reservación #{reserva.reserva_id}
                    </Typography>
                </Box>
                <Chip
                    label={
                        reserva.estatus_reserva?.nombre || statusLabel(reserva.estatus_reserva_code)
                    }
                    color={statusChipColor(reserva.estatus_reserva_code)}
                    sx={{ fontSize: '0.9rem', px: 1 }}
                />
                {['PENDIENTE', 'CONFIRMADA'].includes(reserva.estatus_reserva_code) && (
                    <Button
                        variant="outlined"
                        size="small"
                        disabled={updateTimesMutation.isPending}
                        onClick={() => {
                            setTimesForm({
                                checkinTime: dayjs(reserva.checkin_datetime).format('HH:mm'),
                                checkoutTime: dayjs(reserva.checkout_datetime).format('HH:mm'),
                            });
                            setTimesDialogOpen(true);
                        }}
                    >
                        Editar horas
                    </Button>
                )}
                {(() => {
                    const transitions = allowedStatusTransitions(reserva.estatus_reserva_code)
                        .filter((code) => isAdmin || code !== 'CANCELADA');
                    return transitions.length > 0 && (
                        <Button
                            variant="outlined"
                            size="small"
                            disabled={changeStatusMutation.isPending}
                            onClick={() => {
                                setNewStatus(transitions[0] ?? '');
                                setStatusDialogOpen(true);
                            }}
                        >
                            Cambiar Estatus
                        </Button>
                    );
                })()}
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {/* Info Cards */}
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                    gap: 3,
                    mb: 3,
                }}
            >
                <Card>
                    <CardContent>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Información General
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        <InfoRow label="Ubicación" value={reserva.ubicacion?.nombre} />
                        <InfoRow label="Cliente" value={reserva.cliente?.nombre} />
                        <InfoRow
                            label="Check-in"
                            value={dayjs(reserva.checkin_datetime).format('DD/MM/YYYY hh:mm A')}
                        />
                        <InfoRow
                            label="Check-out"
                            value={dayjs(reserva.checkout_datetime).format('DD/MM/YYYY hh:mm A')}
                        />
                        <InfoRow label="Origen" value={reserva.origen_reserva_code} />
                        {reserva.notas && (
                            <InfoRow label="Notas" value={reserva.notas} />
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Resumen Financiero
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        <InfoRow
                            label="Total Reserva"
                            value={`$${totalReserva.toLocaleString()}`}
                        />
                        <InfoRow
                            label="Total Pagado"
                            value={`$${totalPagado.toLocaleString()}`}
                            valueColor="success.main"
                        />
                        <InfoRow
                            label="Saldo Pendiente"
                            value={`$${saldoPendiente.toLocaleString()}`}
                            valueColor={saldoPendiente > 0 ? 'error.main' : 'success.main'}
                        />
                    </CardContent>
                </Card>
            </Box>

            {/* Payments Section */}
            <Card>
                <CardContent>
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 2,
                        }}
                    >
                        <Typography variant="subtitle2" color="text.secondary">
                            Pagos
                        </Typography>
                        {canPay(reserva.estatus_reserva_code) && (
                            <Button
                                size="small"
                                startIcon={<AddIcon />}
                                onClick={() => {
                                    resetPaymentForm();
                                    setPaymentDialogOpen(true);
                                }}
                            >
                                Registrar Pago
                            </Button>
                        )}
                    </Box>
                    <Divider sx={{ mb: 2 }} />

                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Fecha</TableCell>
                                    <TableCell>Tipo</TableCell>
                                    <TableCell>Método</TableCell>
                                    <TableCell align="right">Monto</TableCell>
                                    <TableCell>Referencia</TableCell>
                                    <TableCell>Notas</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {paymentsLoading ? (
                                    Array.from({ length: 2 }).map((_, i) => (
                                        <TableRow key={i}>
                                            {Array.from({ length: 6 }).map((__, j) => (
                                                <TableCell key={j}>
                                                    <Skeleton />
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : payments && payments.length > 0 ? (
                                    payments.map((pago) => (
                                        <TableRow key={pago.pago_movimiento_id}>
                                            <TableCell>
                                                {dayjs(pago.fecha_pago).format('DD/MM/YYYY hh:mm A')}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={pago.tipo_pago_mov_code}
                                                    size="small"
                                                    color={
                                                        pago.tipo_pago_mov_code === 'ANTICIPO'
                                                            ? 'warning'
                                                            : pago.tipo_pago_mov_code === 'LIQUIDACION'
                                                                ? 'success'
                                                                : 'info'
                                                    }
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell>{pago.metodo_pago_code}</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600 }}>
                                                ${Number(pago.monto).toLocaleString()}
                                            </TableCell>
                                            <TableCell>{pago.referencia || '—'}</TableCell>
                                            <TableCell>{pago.notas || '—'}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                No hay pagos registrados
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>

            {/* Add Payment Dialog */}
            <Dialog
                open={paymentDialogOpen}
                onClose={() => { if (!createPaymentMutation.isPending) setPaymentDialogOpen(false); }}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Registrar Pago</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        {/* Mini financial summary */}
                        <Box
                            sx={{
                                bgcolor: 'action.hover',
                                borderRadius: 1,
                                px: 1.5,
                                py: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 0.5,
                            }}
                        >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2" color="text.secondary">
                                    Total reserva
                                </Typography>
                                <Typography variant="body2" fontWeight={600}>
                                    ${totalReserva.toLocaleString()}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2" color="text.secondary">
                                    Total pagado
                                </Typography>
                                <Typography variant="body2" fontWeight={600} color="success.main">
                                    ${totalPagado.toLocaleString()}
                                </Typography>
                            </Box>
                            <Divider sx={{ my: 0.25 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2" fontWeight={700}>
                                    Saldo restante
                                </Typography>
                                <Typography
                                    variant="body2"
                                    fontWeight={700}
                                    color={saldoPendiente > 0 ? 'error.main' : 'success.main'}
                                >
                                    ${saldoPendiente.toLocaleString()}
                                </Typography>
                            </Box>
                        </Box>

                        {/* Backend payment error */}
                        {backendPaymentError && (
                            <Alert
                                severity="error"
                                onClose={() => setBackendPaymentError(null)}
                            >
                                {backendPaymentError.message}
                                {backendPaymentError.remaining_balance !== undefined && (
                                    <>
                                        {' '}
                                        <strong>
                                            Saldo disponible: ${Number(backendPaymentError.remaining_balance).toLocaleString()}
                                        </strong>
                                    </>
                                )}
                            </Alert>
                        )}

                        <TextField
                            select
                            label="Tipo de Pago"
                            value={paymentForm.tipo_pago_mov_code}
                            onChange={(e) =>
                                setPaymentForm((prev) => ({
                                    ...prev,
                                    tipo_pago_mov_code: e.target.value,
                                }))
                            }
                            fullWidth
                        >
                            <MenuItem value="ANTICIPO">Anticipo</MenuItem>
                            <MenuItem value="LIQUIDACION">Liquidación</MenuItem>
                        </TextField>

                        <TextField
                            select
                            label="Método de Pago"
                            value={paymentForm.metodo_pago_code}
                            onChange={(e) =>
                                setPaymentForm((prev) => ({
                                    ...prev,
                                    metodo_pago_code: e.target.value,
                                }))
                            }
                            fullWidth
                        >
                            <MenuItem value="EFECTIVO">Efectivo</MenuItem>
                            <MenuItem value="TRANSFERENCIA">Transferencia</MenuItem>
                            <MenuItem value="TARJETA">Tarjeta</MenuItem>
                        </TextField>

                        <TextField
                            label="Monto"
                            type="number"
                            value={paymentForm.monto || ''}
                            onChange={(e) => {
                                const raw = parseFloat(e.target.value);
                                const monto = isFinite(raw) ? raw : 0;
                                setPaymentForm((prev) => ({ ...prev, monto }));
                                setAmountError(validateAmount(monto, saldoPendiente));
                            }}
                            onKeyDown={(e) => {
                                if (e.key === '-' || e.key === 'e') e.preventDefault();
                            }}
                            error={!!amountError}
                            helperText={amountError}
                            fullWidth
                            slotProps={{
                                input: { startAdornment: <span>$&nbsp;</span> },
                                htmlInput: { min: 0.01, step: 0.01 },
                            }}
                        />

                        <TextField
                            label="Fecha de Pago"
                            type="datetime-local"
                            value={paymentForm.fecha_pago}
                            onChange={(e) =>
                                setPaymentForm((prev) => ({
                                    ...prev,
                                    fecha_pago: e.target.value,
                                }))
                            }
                            fullWidth
                            slotProps={{ inputLabel: { shrink: true } }}
                        />

                        <TextField
                            label="Referencia"
                            value={paymentForm.referencia}
                            onChange={(e) =>
                                setPaymentForm((prev) => ({
                                    ...prev,
                                    referencia: e.target.value,
                                }))
                            }
                            fullWidth
                            placeholder="Número de transacción, recibo, etc."
                        />

                        <TextField
                            label="Notas"
                            value={paymentForm.notas}
                            onChange={(e) =>
                                setPaymentForm((prev) => ({
                                    ...prev,
                                    notas: e.target.value,
                                }))
                            }
                            fullWidth
                            multiline
                            rows={2}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setPaymentDialogOpen(false)}
                        disabled={createPaymentMutation.isPending}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handlePaymentSubmit}
                        disabled={
                            createPaymentMutation.isPending ||
                            !!amountError ||
                            paymentForm.monto <= 0 ||
                            saldoPendiente <= 0
                        }
                    >
                        {createPaymentMutation.isPending ? 'Guardando...' : 'Registrar'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit Times Dialog */}
            <Dialog
                open={timesDialogOpen}
                onClose={() => { if (!updateTimesMutation.isPending) setTimesDialogOpen(false); }}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle>Editar horas</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <Box>
                            <Typography variant="caption" color="text.secondary">
                                Fecha Check-in (fija)
                            </Typography>
                            <Typography variant="body2" fontWeight={600}>
                                {dayjs(reserva.checkin_datetime).format('DD/MM/YYYY')}
                            </Typography>
                            <TextField
                                label="Hora Check-in"
                                type="time"
                                value={timesForm.checkinTime}
                                onChange={(e) =>
                                    setTimesForm((prev) => ({ ...prev, checkinTime: e.target.value }))
                                }
                                fullWidth
                                sx={{ mt: 1 }}
                                slotProps={{ inputLabel: { shrink: true } }}
                            />
                        </Box>
                        <Box>
                            <Typography variant="caption" color="text.secondary">
                                Fecha Check-out (fija)
                            </Typography>
                            <Typography variant="body2" fontWeight={600}>
                                {dayjs(reserva.checkout_datetime).format('DD/MM/YYYY')}
                            </Typography>
                            <TextField
                                label="Hora Check-out"
                                type="time"
                                value={timesForm.checkoutTime}
                                onChange={(e) =>
                                    setTimesForm((prev) => ({ ...prev, checkoutTime: e.target.value }))
                                }
                                fullWidth
                                sx={{ mt: 1 }}
                                slotProps={{ inputLabel: { shrink: true } }}
                            />
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setTimesDialogOpen(false)}
                        disabled={updateTimesMutation.isPending}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        disabled={!timesForm.checkinTime || !timesForm.checkoutTime || updateTimesMutation.isPending}
                        onClick={() => {
                            if (updateTimesMutation.isPending) return;
                            const checkinDate = dayjs(reserva.checkin_datetime).format('YYYY-MM-DD');
                            const checkoutDate = dayjs(reserva.checkout_datetime).format('YYYY-MM-DD');
                            updateTimesMutation.mutate({
                                checkin_datetime: new Date(`${checkinDate}T${timesForm.checkinTime}`).toISOString(),
                                checkout_datetime: new Date(`${checkoutDate}T${timesForm.checkoutTime}`).toISOString(),
                            });
                        }}
                    >
                        {updateTimesMutation.isPending ? 'Guardando...' : 'Guardar'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Change Status Dialog */}
            <Dialog
                open={statusDialogOpen}
                onClose={() => { if (!changeStatusMutation.isPending) setStatusDialogOpen(false); }}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle>Cambiar Estatus</DialogTitle>
                <DialogContent>
                    <TextField
                        select
                        label="Nuevo Estatus"
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        fullWidth
                        sx={{ mt: 1 }}
                    >
                        {allowedStatusTransitions(reserva.estatus_reserva_code)
                            .filter((code) => isAdmin || code !== 'CANCELADA')
                            .map((code) => (
                            <MenuItem key={code} value={code}>
                                {statusLabel(code)}
                            </MenuItem>
                        ))}
                    </TextField>
                    {newStatus === 'CANCELADA' && (
                        <Alert severity="warning" sx={{ mt: 2 }}>
                            Al cancelar la reservación, se liberarán las fechas en el calendario. Esta acción no se puede deshacer fácilmente.
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setStatusDialogOpen(false)}
                        disabled={changeStatusMutation.isPending}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => {
                            if (changeStatusMutation.isPending) return;
                            changeStatusMutation.mutate(newStatus);
                        }}
                        disabled={changeStatusMutation.isPending}
                    >
                        {changeStatusMutation.isPending ? 'Confirmando...' : 'Confirmar'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

