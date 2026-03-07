import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { isValidDateRange, adjustToOnFromChange, adjustFromOnToChange } from '../../utils/dateRange';
import { useQuery } from '@tanstack/react-query';
import { qk } from '../../utils/queryKeys';
import {
    Alert,
    Autocomplete,
    Box,
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
    Skeleton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EventNoteIcon from '@mui/icons-material/EventNote';
import dayjs from 'dayjs';
import EmptyState from '../../components/common/EmptyState';
import {
    reservationsApi,
    catalogsApi,
    type ReservationFilters,
} from '../../api/reservations';
import { clientsApi } from '../../api/clients';
import { displayCurrency } from '../../utils/display';
import { statusLabel, statusChipColor } from '../../utils/reservationStatus';
import type { Cliente, Ubicacion } from '../../types';

export default function ReservationsListPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const clienteIdParam = searchParams.get('cliente_id') || undefined;

    const [filters, setFilters] = useState<ReservationFilters>({
        page: 1,
        page_size: 10,
        cliente_id: clienteIdParam,
    });

    // ISO strings start with YYYY-MM-DD so slicing is safe for comparison
    const fromDate = filters.from ? filters.from.slice(0, 10) : undefined;
    const toDate = filters.to ? filters.to.slice(0, 10) : undefined;

    // Reservations backend requires from strictly less than to (from >= to → 400).
    const dateRangeInvalid = !!(fromDate && toDate && fromDate >= toDate);

    const { data, isLoading } = useQuery({
        queryKey: qk.reservations.list(filters),
        queryFn: () => reservationsApi.findAll(filters),
        enabled: !dateRangeInvalid && isValidDateRange(fromDate, toDate),
    });

    const { data: clientesData, isLoading: clientesLoading } = useQuery({
        queryKey: qk.clients.all(),
        queryFn: () => clientsApi.findAll({ page: 1, pageSize: 200 }),
        staleTime: 5 * 60 * 1000,
    });

    const { data: ubicaciones, isLoading: ubicacionesLoading } = useQuery({
        queryKey: qk.ubicaciones(),
        queryFn: () => catalogsApi.getUbicaciones(),
        staleTime: 5 * 60 * 1000,
    });

    const clientesList: Cliente[] = clientesData?.items ?? [];
    const ubicacionesList: Ubicacion[] = ubicaciones ?? [];

    const selectedCliente = clientesList.find(
        (c) => c.cliente_id === filters.cliente_id,
    ) ?? null;

    const selectedUbicacion = ubicacionesList.find(
        (u) => u.ubicacion_id === filters.ubicacion_id,
    ) ?? null;

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
            {/* Actions */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
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
                {/* Active filter chips */}
                {(filters.cliente_id || filters.ubicacion_id) && (
                    <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        {filters.cliente_id && (
                            <Chip
                                label={`Cliente: ${selectedCliente?.nombre ?? 'Seleccionado'}`}
                                color="primary"
                                size="small"
                                onDelete={() => {
                                    setFilters((prev) => ({ ...prev, cliente_id: undefined, page: 1 }));
                                    setSearchParams((prev) => {
                                        prev.delete('cliente_id');
                                        return prev;
                                    });
                                }}
                            />
                        )}
                        {filters.ubicacion_id && (
                            <Chip
                                label={`Ubicación: ${selectedUbicacion?.nombre ?? 'Seleccionada'}`}
                                color="secondary"
                                size="small"
                                onDelete={() => {
                                    setFilters((prev) => ({ ...prev, ubicacion_id: undefined, page: 1 }));
                                }}
                            />
                        )}
                    </Box>
                )}
                <Box
                    sx={{
                        display: 'flex',
                        gap: 2,
                        flexWrap: 'wrap',
                        alignItems: 'center',
                    }}
                >
                    <Autocomplete<Cliente>
                        options={clientesList}
                        getOptionLabel={(opt) => opt.nombre}
                        value={selectedCliente}
                        onChange={(_e, val) => {
                            const id = val?.cliente_id ?? undefined;
                            setFilters((prev) => ({ ...prev, cliente_id: id, page: 1 }));
                            setSearchParams((prev) => {
                                if (id) prev.set('cliente_id', id);
                                else prev.delete('cliente_id');
                                return prev;
                            });
                        }}
                        isOptionEqualToValue={(opt, val) => opt.cliente_id === val.cliente_id}
                        loading={clientesLoading}
                        loadingText="Cargando clientes…"
                        renderInput={(params) => (
                            <TextField {...params} label="Cliente" size="small" />
                        )}
                        size="small"
                        sx={{ minWidth: 200 }}
                        noOptionsText="Sin resultados"
                    />

                    <Autocomplete<Ubicacion>
                        options={ubicacionesList}
                        getOptionLabel={(opt) => opt.nombre}
                        value={selectedUbicacion}
                        onChange={(_e, val) => {
                            setFilters((prev) => ({
                                ...prev,
                                ubicacion_id: val?.ubicacion_id ?? undefined,
                                page: 1,
                            }));
                        }}
                        isOptionEqualToValue={(opt, val) => opt.ubicacion_id === val.ubicacion_id}
                        loading={ubicacionesLoading}
                        loadingText="Cargando ubicaciones…"
                        renderInput={(params) => (
                            <TextField {...params} label="Ubicación" size="small" />
                        )}
                        size="small"
                        sx={{ minWidth: 200 }}
                        noOptionsText="Sin resultados"
                    />

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
                        value={filters.from ? dayjs(filters.from).format('YYYY-MM-DD') : ''}
                        onChange={(e) => {
                            const inputDate = e.target.value; // YYYY-MM-DD or ''
                            const newFrom = inputDate ? new Date(inputDate).toISOString() : undefined;
                            setFilters((prev) => {
                                const prevToDate = prev.to ? prev.to.slice(0, 10) : undefined;
                                const adjustedTo = adjustToOnFromChange(inputDate || undefined, prevToDate);
                                return {
                                    ...prev,
                                    from: newFrom,
                                    to: adjustedTo ? prev.to : undefined,
                                    page: 1,
                                };
                            });
                        }}
                        slotProps={{ inputLabel: { shrink: true } }}
                        sx={{ minWidth: 160 }}
                    />

                    <TextField
                        type="date"
                        label="Hasta"
                        size="small"
                        value={filters.to ? dayjs(filters.to).format('YYYY-MM-DD') : ''}
                        onChange={(e) => {
                            const inputDate = e.target.value; // YYYY-MM-DD or ''
                            const newTo = inputDate ? new Date(inputDate).toISOString() : undefined;
                            setFilters((prev) => {
                                const prevFromDate = prev.from ? prev.from.slice(0, 10) : undefined;
                                const adjustedFrom = adjustFromOnToChange(prevFromDate, inputDate || undefined);
                                return {
                                    ...prev,
                                    from: adjustedFrom ? prev.from : undefined,
                                    to: newTo,
                                    page: 1,
                                };
                            });
                        }}
                        slotProps={{ inputLabel: { shrink: true } }}
                        sx={{ minWidth: 160 }}
                    />
                </Box>
            </Card>

            {dateRangeInvalid && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    La fecha final debe ser posterior a la fecha inicial.
                </Alert>
            )}

            {/* Table */}
            <Card>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
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
                                        {Array.from({ length: 7 }).map((__, j) => (
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
                                            {reserva.ubicacion_nombre || reserva.ubicacion?.nombre || '—'}
                                        </TableCell>
                                        <TableCell>
                                            {reserva.cliente_nombre || reserva.cliente?.nombre || '—'}
                                        </TableCell>
                                        <TableCell>
                                            {dayjs(reserva.checkin_datetime).format('DD/MM/YYYY')}
                                        </TableCell>
                                        <TableCell>
                                            {dayjs(reserva.checkout_datetime).format('DD/MM/YYYY')}
                                        </TableCell>
                                        <TableCell>
                                            {displayCurrency(reserva.total_reserva)}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={reserva.estatus_reserva?.nombre || statusLabel(reserva.estatus_reserva_code)}
                                                color={statusChipColor(reserva.estatus_reserva_code)}
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
                                    <TableCell colSpan={7} sx={{ border: 0 }}>
                                        <EmptyState
                                            icon={<EventNoteIcon />}
                                            title="No hay reservaciones en este rango"
                                            subtitle="Ajusta los filtros o crea una nueva reservación"
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
