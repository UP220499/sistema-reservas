import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Box,
    Typography,
    Button,
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
    TextField,
    MenuItem,
    InputAdornment,
    Skeleton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import dayjs from 'dayjs';
import {
    reservationsApi,
    type ReservationFilters,
} from '../../api/reservations';

const statusColors: Record<string, 'warning' | 'success' | 'error' | 'info'> = {
    PENDIENTE: 'warning',
    CONFIRMADA: 'success',
    CANCELADA: 'error',
    COMPLETADA: 'info',
};

export default function ReservationsListPage() {
    const navigate = useNavigate();
    const [filters, setFilters] = useState<ReservationFilters>({
        page: 1,
        page_size: 10,
    });

    const { data, isLoading } = useQuery({
        queryKey: ['reservations', filters],
        queryFn: () => reservationsApi.findAll(filters),
    });

    const handlePageChange = (_: unknown, newPage: number) => {
        setFilters((prev) => ({ ...prev, page: newPage + 1 }));
    };

    const handleRowsPerPageChange = (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        setFilters((prev) => ({
            ...prev,
            page_size: parseInt(event.target.value, 10),
            page: 1,
        }));
    };

    return (
        <Box>
            {/* Header */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 3,
                    flexWrap: 'wrap',
                    gap: 2,
                }}
            >
                <Typography variant="h5" fontWeight={700}>
                    Reservaciones
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/reservaciones/nueva')}
                >
                    Nueva Reservación
                </Button>
            </Box>

            {/* Filters */}
            <Card sx={{ p: 2, mb: 3 }}>
                <Box
                    sx={{
                        display: 'flex',
                        gap: 2,
                        flexWrap: 'wrap',
                        alignItems: 'center',
                    }}
                >
                    <TextField
                        select
                        label="Estatus"
                        size="small"
                        value={filters.estatus_reserva_code || ''}
                        onChange={(e) =>
                            setFilters((prev) => ({
                                ...prev,
                                estatus_reserva_code: e.target.value || undefined,
                                page: 1,
                            }))
                        }
                        sx={{ minWidth: 160 }}
                    >
                        <MenuItem value="">Todos</MenuItem>
                        <MenuItem value="PENDIENTE">Pendiente</MenuItem>
                        <MenuItem value="CONFIRMADA">Confirmada</MenuItem>
                        <MenuItem value="CANCELADA">Cancelada</MenuItem>
                        <MenuItem value="COMPLETADA">Completada</MenuItem>
                    </TextField>

                    <TextField
                        type="date"
                        label="Desde"
                        size="small"
                        value={
                            filters.from ? dayjs(filters.from).format('YYYY-MM-DD') : ''
                        }
                        onChange={(e) =>
                            setFilters((prev) => ({
                                ...prev,
                                from: e.target.value
                                    ? new Date(e.target.value).toISOString()
                                    : undefined,
                                page: 1,
                            }))
                        }
                        slotProps={{ inputLabel: { shrink: true } }}
                        sx={{ minWidth: 160 }}
                    />

                    <TextField
                        type="date"
                        label="Hasta"
                        size="small"
                        value={filters.to ? dayjs(filters.to).format('YYYY-MM-DD') : ''}
                        onChange={(e) =>
                            setFilters((prev) => ({
                                ...prev,
                                to: e.target.value
                                    ? new Date(e.target.value).toISOString()
                                    : undefined,
                                page: 1,
                            }))
                        }
                        slotProps={{ inputLabel: { shrink: true } }}
                        sx={{ minWidth: 160 }}
                    />

                    <TextField
                        placeholder="Buscar por ubicación..."
                        size="small"
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" />
                                    </InputAdornment>
                                ),
                            },
                        }}
                        sx={{ minWidth: 200 }}
                    />
                </Box>
            </Card>

            {/* Table */}
            <Card>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Ubicación</TableCell>
                                <TableCell>Cliente</TableCell>
                                <TableCell>Check-in</TableCell>
                                <TableCell>Check-out</TableCell>
                                <TableCell>Total</TableCell>
                                <TableCell>Estatus</TableCell>
                                <TableCell align="center">Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading
                                ? Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        {Array.from({ length: 8 }).map((__, j) => (
                                            <TableCell key={j}>
                                                <Skeleton />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                                : data?.items?.map((reserva) => (
                                    <TableRow
                                        key={reserva.reserva_id}
                                        hover
                                        sx={{ cursor: 'pointer' }}
                                        onClick={() =>
                                            navigate(`/reservaciones/${reserva.reserva_id}`)
                                        }
                                    >
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={600}>
                                                #{reserva.reserva_id}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            {reserva.ubicacion?.nombre || '—'}
                                        </TableCell>
                                        <TableCell>
                                            {reserva.cliente?.nombre || '—'}
                                        </TableCell>
                                        <TableCell>
                                            {dayjs(reserva.fecha_entrada).format('DD/MM/YYYY')}
                                        </TableCell>
                                        <TableCell>
                                            {dayjs(reserva.fecha_salida).format('DD/MM/YYYY')}
                                        </TableCell>
                                        <TableCell>
                                            ${Number(reserva.precio_total).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={reserva.estatus_reserva?.nombre || reserva.estatus_reserva_code}
                                                color={
                                                    statusColors[reserva.estatus_reserva_code] ||
                                                    'default'
                                                }
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(
                                                        `/reservaciones/${reserva.reserva_id}`,
                                                    );
                                                }}
                                            >
                                                <VisibilityIcon fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}

                            {!isLoading && (!data?.items || data.items.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                                        <Typography color="text.secondary">
                                            No se encontraron reservaciones
                                        </Typography>
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
                        rowsPerPageOptions={[5, 10, 20, 50]}
                        labelRowsPerPage="Filas por página"
                        labelDisplayedRows={({ from, to, count }) =>
                            `${from}–${to} de ${count}`
                        }
                    />
                )}
            </Card>
        </Box>
    );
}
