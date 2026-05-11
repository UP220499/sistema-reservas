import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Box,
    Card,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Chip,
    IconButton,
    Skeleton,
    Typography,
    Tooltip,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { paymentsApi, type GetPaymentsParams } from '../../api/payments';
import EmptyState from '../../components/common/EmptyState';
import type { PagoMovimiento } from '../../types';

import { qk } from '../../utils/queryKeys';

export default function PaymentsListPage() {
    const [filters, setFilters] = useState<GetPaymentsParams>({
        page: 1,
        page_size: 10,
    });

    const { data, isLoading } = useQuery({
        queryKey: qk.paymentsGlobal.list(filters),
        queryFn: () => paymentsApi.getAll(filters),
    });

    const handlePageChange = (_: unknown, newPage: number) => {
        setFilters((prev) => ({ ...prev, page: newPage + 1 }));
    };

    const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setFilters((prev) => ({
            ...prev,
            page_size: parseInt(event.target.value, 10),
            page: 1,
        }));
    };

    const handleDownloadPdf = async (paymentId: string) => {
        try {
            await paymentsApi.downloadPdf(paymentId);
        } catch (error) {
            console.error('Error downloading PDF', error);
            // Optionally add toast here
        }
    };

    const formatCurrency = (amount: string) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
        }).format(Number(amount));
    };

    const items = data?.items ?? [];

    return (
        <Box>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h5" fontWeight="bold">Historial de Pagos</Typography>
                <Typography variant="body2" color="text.secondary">
                    Consulta todos los movimientos de pago y descarga sus comprobantes.
                </Typography>
            </Box>

            <Card>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Folio</TableCell>
                                <TableCell>Fecha</TableCell>
                                <TableCell>Cliente</TableCell>
                                <TableCell>Monto</TableCell>
                                <TableCell>Tipo</TableCell>
                                <TableCell>Método</TableCell>
                                <TableCell align="center">Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading
                                ? Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        {Array.from({ length: 7 }).map((__, j) => (
                                            <TableCell key={j}>
                                                <Skeleton />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                                : items.map((payment: PagoMovimiento) => (
                                    <TableRow key={payment.pago_movimiento_id} hover>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="bold">
                                                PAG-{payment.pago_movimiento_id.padStart(6, '0')}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(payment.fecha_pago).toLocaleDateString('es-MX', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </TableCell>
                                        <TableCell>
                                            {payment.reserva?.cliente_id ? `Cliente #${payment.reserva.cliente_id}` : '—'}
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="bold" color="success.main">
                                                {formatCurrency(payment.monto)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={payment.tipo_pago_mov_code}
                                                size="small"
                                                color={payment.tipo_pago_mov_code === 'LIQUIDACION' ? 'success' : 'primary'}
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {payment.metodo_pago_code}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Tooltip title="Descargar PDF">
                                                <IconButton
                                                    color="primary"
                                                    onClick={() => handleDownloadPdf(payment.pago_movimiento_id)}
                                                >
                                                    <DownloadIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}

                            {!isLoading && items.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} sx={{ border: 0 }}>
                                        <EmptyState
                                            icon={<AttachMoneyIcon />}
                                            title="Sin pagos registrados"
                                            subtitle="No se encontraron movimientos de pago."
                                        />
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {data && (
                    <TablePagination
                        component="div"
                        count={data.total}
                        page={(data.page || 1) - 1}
                        rowsPerPage={data.page_size || 10}
                        onPageChange={handlePageChange}
                        onRowsPerPageChange={handleRowsPerPageChange}
                        rowsPerPageOptions={[10, 20, 50]}
                        labelRowsPerPage="Filas por página"
                        labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
                    />
                )}
            </Card>
        </Box>
    );
}
