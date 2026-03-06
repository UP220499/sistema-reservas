import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { qk } from '../../utils/queryKeys';
import axios from 'axios';
import { getErrorMessage } from '../../utils/error';
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
    InputAdornment,
    MenuItem,
    Skeleton,
    Snackbar,
    Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { clientsApi, type ClientFilters } from '../../api/clients';
import type { Cliente, LoyaltyInfo } from '../../types';

const LOYALTY_COLOR: Record<string, 'default' | 'warning' | 'success' | 'secondary'> = {
    BRONCE: 'warning',
    PLATA: 'default',
    ORO: 'success',
    PLATINO: 'secondary',
};

function LoyaltyChip({ loyalty }: { loyalty: LoyaltyInfo | undefined }) {
    if (!loyalty) return <>—</>;
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.25 }}>
            <Chip
                label={loyalty.nivel_loyalty}
                color={LOYALTY_COLOR[loyalty.nivel_loyalty] ?? 'default'}
                size="small"
            />
            <Typography variant="caption" color="text.secondary">
                {loyalty.puntos} pts · {loyalty.reservas_completadas_count} res.
            </Typography>
        </Box>
    );
}

export default function ClientsListPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });
    const [filters, setFilters] = useState<ClientFilters>({
        page: 1,
        pageSize: 10,
        search: '',
    });
    // Client-side filters (applied on current page since pagination is server-side)
    const [loyaltyFilter, setLoyaltyFilter] = useState('');
    const [estadoFilter, setEstadoFilter] = useState('');

    const { data, isLoading } = useQuery({
        queryKey: qk.clients.list(filters),
        queryFn: () => clientsApi.findAll(filters),
    });

    // Filter items on the current page client-side.
    // Pagination remains server-side; these filters narrow displayed rows within the page.
    const filteredItems: Cliente[] = useMemo(() => {
        const items = data?.items ?? [];
        return items.filter((c) => {
            if (loyaltyFilter && (c.loyalty?.nivel_loyalty ?? '') !== loyaltyFilter) return false;
            if (estadoFilter === 'activo' && !c.activo) return false;
            if (estadoFilter === 'inactivo' && c.activo) return false;
            return true;
        });
    }, [data?.items, loyaltyFilter, estadoFilter]);

    const deactivateMutation = useMutation({
        mutationFn: (id: string) => clientsApi.changeStatus(id, false),
        onSuccess: (_, clientId) => {
            queryClient.invalidateQueries({ queryKey: qk.clients.list() });
            queryClient.invalidateQueries({ queryKey: qk.clients.detail(clientId) });
            queryClient.invalidateQueries({ queryKey: qk.clients.all() });
            setSnackbar({ open: true, message: 'Cliente desactivado correctamente.', severity: 'success' });
        },
        onError: (err) => {
            let message = getErrorMessage(err);
            if (axios.isAxiosError(err) && err.response?.status === 409) {
                const d = err.response.data as Record<string, unknown>;
                const count =
                    typeof d?.count === 'number' ? d.count :
                    typeof d?.reservaciones_activas_count === 'number' ? d.reservaciones_activas_count :
                    null;
                if (count !== null) {
                    message = `${message} (${count} reservación${count !== 1 ? 'es' : ''} activa${count !== 1 ? 's' : ''})`;
                }
            }
            setSnackbar({ open: true, message, severity: 'error' });
        },
    });

    const handleSearch = (value: string) => {
        setFilters((prev) => ({ ...prev, search: value, page: 1 }));
    };

    const handlePageChange = (_: unknown, newPage: number) => {
        setFilters((prev) => ({ ...prev, page: newPage + 1 }));
    };

    const handleRowsPerPageChange = (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        setFilters((prev) => ({
            ...prev,
            pageSize: parseInt(event.target.value, 10),
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
                    onClick={() => navigate('/clientes/nuevo')}
                >
                    Nuevo Cliente
                </Button>
            </Box>

            {/* Filters */}
            <Card sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                    <TextField
                        placeholder="Buscar por nombre o correo..."
                        size="small"
                        value={filters.search || ''}
                        onChange={(e) => handleSearch(e.target.value)}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" />
                                    </InputAdornment>
                                ),
                            },
                        }}
                        sx={{ minWidth: 300 }}
                    />

                    <TextField
                        select
                        label="Loyalty"
                        size="small"
                        value={loyaltyFilter}
                        onChange={(e) => setLoyaltyFilter(e.target.value)}
                        sx={{ minWidth: 140 }}
                    >
                        <MenuItem value="">Todos</MenuItem>
                        <MenuItem value="BRONCE">Bronce</MenuItem>
                        <MenuItem value="PLATA">Plata</MenuItem>
                        <MenuItem value="ORO">Oro</MenuItem>
                        <MenuItem value="PLATINO">Platino</MenuItem>
                    </TextField>

                    <TextField
                        select
                        label="Estado"
                        size="small"
                        value={estadoFilter}
                        onChange={(e) => setEstadoFilter(e.target.value)}
                        sx={{ minWidth: 140 }}
                    >
                        <MenuItem value="">Todos</MenuItem>
                        <MenuItem value="activo">Activo</MenuItem>
                        <MenuItem value="inactivo">Inactivo</MenuItem>
                    </TextField>
                </Box>
            </Card>

            {/* Table */}
            <Card>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Nombre</TableCell>
                                <TableCell>Correo</TableCell>
                                <TableCell>Teléfono Principal</TableCell>
                                <TableCell align="center">Reservas</TableCell>
                                <TableCell>Loyalty</TableCell>
                                <TableCell>Estado</TableCell>
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
                                : filteredItems.map((client) => {
                                    const primaryPhone = client.phones?.find(
                                        (p) => p.es_principal,
                                    );
                                    return (
                                        <TableRow
                                            key={client.cliente_id}
                                            hover
                                            sx={{ cursor: 'pointer' }}
                                            onClick={() =>
                                                navigate(`/clientes/${client.cliente_id}`)
                                            }
                                        >
                                            <TableCell>{client.nombre}</TableCell>
                                            <TableCell>{client.correo || '—'}</TableCell>
                                            <TableCell>
                                                {client.primary_phone || primaryPhone?.telefono || '—'}
                                            </TableCell>
                                            <TableCell align="center">
                                                {(() => {
                                                    const reservas = client.loyalty?.reservas_completadas_count ?? client.reservas_completadas ?? 0;
                                                    return (
                                                        <>
                                                            <Box
                                                                component="span"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    navigate(`/reservaciones?cliente_id=${client.cliente_id}`);
                                                                }}
                                                                sx={{
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: 0.5,
                                                                    cursor: 'pointer',
                                                                    color: 'primary.main',
                                                                    fontWeight: 600,
                                                                    '&:hover': { textDecoration: 'underline' },
                                                                }}
                                                            >
                                                                {reservas}
                                                                <OpenInNewIcon sx={{ fontSize: 14, opacity: 0.6 }} />
                                                            </Box>
                                                            {(client.es_vip || reservas >= 3) && (
                                                    <Chip
                                                        label="Frecuente"
                                                        color="secondary"
                                                        size="small"
                                                        sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                                                    />
                                                )}
                                                        </>
                                                    );
                                                })()}
                                            </TableCell>
                                            <TableCell>
                                                <LoyaltyChip loyalty={client.loyalty} />
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={client.activo ? 'Activo' : 'Inactivo'}
                                                    color={client.activo ? 'success' : 'default'}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/clientes/${client.cliente_id}`);
                                                        }}
                                                    >
                                                        <VisibilityIcon fontSize="small" />
                                                    </IconButton>
                                                    {client.activo && (
                                                        <Button
                                                            size="small"
                                                            color="error"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                deactivateMutation.mutate(client.cliente_id);
                                                            }}
                                                            disabled={deactivateMutation.isPending}
                                                        >
                                                            Desactivar
                                                        </Button>
                                                    )}
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}

                            {!isLoading && filteredItems.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                                        <Typography color="text.secondary">
                                            No se encontraron clientes
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
                        rowsPerPage={data.pageSize || 10}
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

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    severity={snackbar.severity}
                    onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
                    variant="filled"
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
