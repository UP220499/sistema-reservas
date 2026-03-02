import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { qk } from '../../utils/queryKeys';
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
    Skeleton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import { clientsApi, type ClientFilters } from '../../api/clients';
import type { LoyaltyInfo } from '../../types';

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
    const [filters, setFilters] = useState<ClientFilters>({
        page: 1,
        pageSize: 10,
        search: '',
    });

    const { data, isLoading } = useQuery({
        queryKey: qk.clients.list(filters),
        queryFn: () => clientsApi.findAll(filters),
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
                    Clientes
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/clientes/nuevo')}
                >
                    Nuevo Cliente
                </Button>
            </Box>

            {/* Search */}
            <Card sx={{ p: 2, mb: 3 }}>
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
                                        {Array.from({ length: 6 }).map((__, j) => (
                                            <TableCell key={j}>
                                                <Skeleton />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                                : data?.items?.map((client) => {
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
                                                {client.reservas_completadas}
                                                {(client.es_vip || (client.reservas_completadas || 0) >= 3) && (
                                                    <Chip
                                                        label="Frecuente"
                                                        color="secondary"
                                                        size="small"
                                                        sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                                                    />
                                                )}
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
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/clientes/${client.cliente_id}`);
                                                    }}
                                                >
                                                    <VisibilityIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}

                            {!isLoading && (!data?.items || data.items.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
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
        </Box>
    );
}
