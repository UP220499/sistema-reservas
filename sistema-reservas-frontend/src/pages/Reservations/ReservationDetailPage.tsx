import { useState } from 'react';
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
} from '../../api/reservations';

const statusColors: Record<string, 'warning' | 'success' | 'error' | 'info'> = {
    PENDIENTE: 'warning',
    CONFIRMADA: 'success',
    CANCELADA: 'error',
    COMPLETADA: 'info',
};

export default function ReservationDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
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

    const { data: reserva, isLoading } = useQuery({
        queryKey: ['reservation', id],
        queryFn: () => reservationsApi.findOne(id!),
        enabled: !!id,
    });

    const { data: payments, isLoading: paymentsLoading } = useQuery({
        queryKey: ['payments', id],
        queryFn: () => reservationsApi.getPayments(id!),
        enabled: !!id,
    });

    const createPaymentMutation = useMutation({
        mutationFn: (payload: CreatePaymentPayload) =>
            reservationsApi.createPayment(id!, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payments', id] });
            queryClient.invalidateQueries({ queryKey: ['reservation', id] });
            setPaymentDialogOpen(false);
            resetPaymentForm();
        },
        onError: () => setError('Error al registrar el pago'),
    });

    const changeStatusMutation = useMutation({
        mutationFn: (status: string) =>
            reservationsApi.changeStatus(id!, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reservation', id] });
            queryClient.invalidateQueries({ queryKey: ['reservations'] });
            setStatusDialogOpen(false);
        },
        onError: () => setError('Error al cambiar el estatus'),
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
    };

    const handlePaymentSubmit = () => {
        if (paymentForm.monto <= 0) {
            setError('El monto debe ser mayor a 0');
            return;
        }
        createPaymentMutation.mutate({
            ...paymentForm,
            fecha_pago: new Date(paymentForm.fecha_pago).toISOString(),
        });
    };

    const totalPagado = payments?.reduce(
        (sum, p) => sum + Number(p.monto),
        0,
    ) || 0;
    const totalReserva = Number(reserva?.precio_total || 0);
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
                        reserva.estatus_reserva?.nombre || reserva.estatus_reserva_code
                    }
                    color={statusColors[reserva.estatus_reserva_code] || 'default'}
                    sx={{ fontSize: '0.9rem', px: 1 }}
                />
                <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                        setNewStatus(reserva.estatus_reserva_code);
                        setStatusDialogOpen(true);
                    }}
                >
                    Cambiar Estatus
                </Button>
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
                            value={dayjs(reserva.fecha_entrada).format('DD/MM/YYYY HH:mm')}
                        />
                        <InfoRow
                            label="Check-out"
                            value={dayjs(reserva.fecha_salida).format('DD/MM/YYYY HH:mm')}
                        />
                        <InfoRow label="Huéspedes" value={String(reserva.num_huespedes)} />
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
                                                {dayjs(pago.fecha_pago).format('DD/MM/YYYY HH:mm')}
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
                onClose={() => setPaymentDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Registrar Pago</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
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
                            <MenuItem value="AJUSTE">Ajuste</MenuItem>
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
                            onChange={(e) =>
                                setPaymentForm((prev) => ({
                                    ...prev,
                                    monto: parseFloat(e.target.value) || 0,
                                }))
                            }
                            fullWidth
                            slotProps={{ input: { startAdornment: <span>$&nbsp;</span> } }}
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
                    <Button onClick={() => setPaymentDialogOpen(false)}>Cancelar</Button>
                    <Button
                        variant="contained"
                        onClick={handlePaymentSubmit}
                        disabled={createPaymentMutation.isPending}
                    >
                        {createPaymentMutation.isPending ? 'Guardando...' : 'Registrar'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Change Status Dialog */}
            <Dialog
                open={statusDialogOpen}
                onClose={() => setStatusDialogOpen(false)}
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
                        <MenuItem value="PENDIENTE">Pendiente</MenuItem>
                        <MenuItem value="CONFIRMADA">Confirmada</MenuItem>
                        <MenuItem value="CANCELADA">Cancelada</MenuItem>
                        <MenuItem value="COMPLETADA">Completada</MenuItem>
                    </TextField>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setStatusDialogOpen(false)}>Cancelar</Button>
                    <Button
                        variant="contained"
                        onClick={() => changeStatusMutation.mutate(newStatus)}
                        disabled={changeStatusMutation.isPending}
                    >
                        Confirmar
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

// Helper component for info rows
function InfoRow({
    label,
    value,
    valueColor,
}: {
    label: string;
    value?: string | null;
    valueColor?: string;
}) {
    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'space-between',
                py: 0.75,
                '&:not(:last-child)': { borderBottom: '1px solid', borderColor: 'divider' },
            }}
        >
            <Typography variant="body2" color="text.secondary">
                {label}
            </Typography>
            <Typography
                variant="body2"
                fontWeight={600}
                color={valueColor || 'text.primary'}
            >
                {value || '—'}
            </Typography>
        </Box>
    );
}
