import { useState } from 'react';
import { getErrorMessage } from '../../utils/error';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { qk } from '../../utils/queryKeys';
import { catalogsApi } from '../../api/reservations';
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
    TextField,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    Skeleton,
    IconButton,
    Tooltip,
    Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import dayjs from 'dayjs';
import {
    blocksApi,
    type BlockFilters,
    type CreateBlockPayload,
} from '../../api/blocks';

const statusColors: Record<string, 'success' | 'error' | 'default'> = {
    ACTIVO: 'success',
    INACTIVO: 'default',
    CANCELADO: 'error', // Kept for backwards compatibility if needed
};

export default function BlocksListPage() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [filters, setFilters] = useState<BlockFilters>({
        page: 1,
        page_size: 10,
    });
    const [createOpen, setCreateOpen] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState<CreateBlockPayload>({
        ubicacion_id: '',
        origen_bloqueo_code: 'MANUAL',
        inicio_datetime: dayjs().add(1, 'day').hour(15).minute(0).format('YYYY-MM-DDTHH:mm'),
        fin_datetime: dayjs().add(3, 'day').hour(11).minute(0).format('YYYY-MM-DDTHH:mm'),
    });
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [blockToCancel, setBlockToCancel] = useState<string | null>(null);
    const [detailBlock, setDetailBlock] = useState<import('../../types').Bloqueo | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: qk.blocks.list(filters),
        queryFn: () => blocksApi.findAll(filters),
    });

    const filteredBlocks = data?.items ?? [];

    const { data: ubicaciones } = useQuery({
        queryKey: qk.ubicaciones(),
        queryFn: () => catalogsApi.getUbicaciones(),
    });

    const createMutation = useMutation({
        mutationFn: (payload: CreateBlockPayload) => blocksApi.create(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: qk.blocks.list() });
            queryClient.invalidateQueries({ queryKey: qk.calendar.events() });
            queryClient.invalidateQueries({ queryKey: qk.dashboard.todayAvailability() });
            queryClient.invalidateQueries({ queryKey: qk.dashboard.stats() });
            setCreateOpen(false);
            resetForm();
        },
        onError: (err) => setError(getErrorMessage(err)),
    });

    const invalidateBlockQueries = () => {
        queryClient.invalidateQueries({ queryKey: qk.blocks.list() });
        queryClient.invalidateQueries({ queryKey: qk.calendar.events() });
        queryClient.invalidateQueries({ queryKey: qk.dashboard.todayAvailability() });
        queryClient.invalidateQueries({ queryKey: qk.dashboard.stats() });
    };

    const cancelMutation = useMutation({
        mutationFn: (id: string) => blocksApi.changeStatus(id, 'INACTIVO'),
        onSuccess: () => {
            invalidateBlockQueries();
            setDetailBlock(null);
        },
        onError: (err) => setError(getErrorMessage(err)),
    });

    const reactivateMutation = useMutation({
        mutationFn: (id: string) => blocksApi.changeStatus(id, 'ACTIVO'),
        onSuccess: () => {
            invalidateBlockQueries();
            setDetailBlock(null);
        },
        onError: (err) => setError(getErrorMessage(err)),
    });

    const resetForm = () => {
        setForm({
            ubicacion_id: '',
            origen_bloqueo_code: 'MANUAL',
            inicio_datetime: dayjs().add(1, 'day').hour(15).minute(0).format('YYYY-MM-DDTHH:mm'),
            fin_datetime: dayjs().add(3, 'day').hour(11).minute(0).format('YYYY-MM-DDTHH:mm'),
        });
        setError('');
    };

    const handleCreate = () => {
        if (!form.ubicacion_id) {
            setError('Selecciona una ubicación');
            return;
        }
        createMutation.mutate({
            ...form,
            inicio_datetime: new Date(form.inicio_datetime).toISOString(),
            fin_datetime: new Date(form.fin_datetime).toISOString(),
        });
    };

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
                    Bloqueos
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                        resetForm();
                        setCreateOpen(true);
                    }}
                >
                    Nuevo Bloqueo
                </Button>
            </Box>

            {/* Filters */}
            <Card sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <TextField
                        select
                        label="Estatus"
                        size="small"
                        value={filters.estatus_bloqueo || ''}
                        onChange={(e) =>
                            setFilters((prev) => ({
                                ...prev,
                                estatus_bloqueo: e.target.value || undefined,
                                page: 1,
                            }))
                        }
                        sx={{ minWidth: 140 }}
                    >
                        <MenuItem value="">Todos</MenuItem>
                        <MenuItem value="ACTIVO">Activo</MenuItem>
                        <MenuItem value="INACTIVO">Inactivo</MenuItem>
                    </TextField>

                    <TextField
                        select
                        label="Origen"
                        size="small"
                        value={filters.origen_bloqueo_code || ''}
                        onChange={(e) =>
                            setFilters((prev) => ({
                                ...prev,
                                origen_bloqueo_code: e.target.value || undefined,
                                page: 1,
                            }))
                        }
                        sx={{ minWidth: 140 }}
                    >
                        <MenuItem value="">Todos</MenuItem>
                        <MenuItem value="MANUAL">Manual</MenuItem>
                        <MenuItem value="AIRBNB">Airbnb (iCal)</MenuItem>
                    </TextField>

                    <TextField
                        type="date"
                        label="Desde"
                        size="small"
                        value={filters.from || ''}
                        onChange={(e) =>
                            setFilters((prev) => ({
                                ...prev,
                                from: e.target.value || undefined,
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
                        value={filters.to || ''}
                        onChange={(e) =>
                            setFilters((prev) => ({
                                ...prev,
                                to: e.target.value || undefined,
                                page: 1,
                            }))
                        }
                        slotProps={{ inputLabel: { shrink: true } }}
                        sx={{ minWidth: 160 }}
                    />
                </Box>
            </Card>

            {/* Table */}
            <Card>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Ubicación</TableCell>
                                <TableCell>Inicio</TableCell>
                                <TableCell>Fin</TableCell>
                                <TableCell>Origen</TableCell>
                                <TableCell>Estatus</TableCell>
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
                                : filteredBlocks.map((block) => (
                                    <TableRow key={block.bloqueo_id} hover>
                                        <TableCell>
                                            {block.ubicacion_nombre || block.ubicacion?.nombre || ubicaciones?.find(u => String(u.ubicacion_id) === String(block.ubicacion_id))?.nombre || '—'}
                                        </TableCell>
                                        <TableCell>
                                            {dayjs(block.inicio_datetime).format('DD/MM/YYYY HH:mm')}
                                        </TableCell>
                                        <TableCell>
                                            {dayjs(block.fin_datetime).format('DD/MM/YYYY HH:mm')}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={block.origen_bloqueo_code}
                                                size="small"
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={block.estatus_bloqueo}
                                                color={
                                                    statusColors[block.estatus_bloqueo] || 'default'
                                                }
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                                <Tooltip title="Ver detalle">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => setDetailBlock(block)}
                                                    >
                                                        <VisibilityIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                {block.estatus_bloqueo === 'ACTIVO' && (
                                                    <Button
                                                        size="small"
                                                        color="error"
                                                        onClick={() => {
                                                            setBlockToCancel(block.bloqueo_id);
                                                            setCancelDialogOpen(true);
                                                        }}
                                                        disabled={cancelMutation.isPending}
                                                    >
                                                        Cancelar
                                                    </Button>
                                                )}
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))}

                            {!isLoading && filteredBlocks.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                                        <Typography color="text.secondary">
                                            No se encontraron bloqueos
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

            {/* Create Block Dialog */}
            <Dialog
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Nuevo Bloqueo</DialogTitle>
                <DialogContent>
                    {error && (
                        <Alert
                            severity="error"
                            sx={{ mb: 2 }}
                            onClose={() => setError('')}
                        >
                            {error}
                        </Alert>
                    )}
                    <Box
                        sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}
                    >
                        <TextField
                            select
                            label="Ubicación"
                            value={form.ubicacion_id}
                            onChange={(e) =>
                                setForm((prev) => ({ ...prev, ubicacion_id: e.target.value }))
                            }
                            fullWidth
                            required
                        >
                            {ubicaciones?.map((ub) => (
                                <MenuItem key={ub.ubicacion_id} value={ub.ubicacion_id}>
                                    {ub.nombre}
                                </MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            label="Origen"
                            value="MANUAL"
                            fullWidth
                            disabled
                            helperText="Los bloqueos iCal se crean automáticamente desde Airbnb"
                        />

                        <TextField
                            label="Inicio"
                            type="datetime-local"
                            value={form.inicio_datetime}
                            onChange={(e) =>
                                setForm((prev) => ({
                                    ...prev,
                                    inicio_datetime: e.target.value,
                                }))
                            }
                            fullWidth
                            required
                            slotProps={{ inputLabel: { shrink: true } }}
                        />

                        <TextField
                            label="Fin"
                            type="datetime-local"
                            value={form.fin_datetime}
                            onChange={(e) =>
                                setForm((prev) => ({
                                    ...prev,
                                    fin_datetime: e.target.value,
                                }))
                            }
                            fullWidth
                            required
                            slotProps={{ inputLabel: { shrink: true } }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateOpen(false)}>Cancelar</Button>
                    <Button
                        variant="contained"
                        onClick={handleCreate}
                        disabled={createMutation.isPending}
                    >
                        {createMutation.isPending ? 'Creando...' : 'Crear Bloqueo'}
                    </Button>
                </DialogActions>
            </Dialog>

            <ConfirmDialog
                open={cancelDialogOpen}
                title="Cancelar Bloqueo"
                content="¿Estás seguro de cancelar este bloqueo? Se liberarán las fechas y esta acción no se puede deshacer."
                confirmText="Sí, Cancelar"
                confirmColor="error"
                onClose={() => {
                    setCancelDialogOpen(false);
                    setBlockToCancel(null);
                }}
                onConfirm={() => {
                    if (blockToCancel) {
                        cancelMutation.mutate(blockToCancel);
                        setCancelDialogOpen(false);
                    }
                }}
            />

            {/* Block Detail Modal */}
            <Dialog
                open={detailBlock !== null}
                onClose={() => setDetailBlock(null)}
                maxWidth="sm"
                fullWidth
            >
                {detailBlock && (
                    <>
                        <DialogTitle>
                            Detalle del Bloqueo
                        </DialogTitle>
                        <DialogContent>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" color="text.secondary">Ubicación</Typography>
                                    <Typography variant="body2" fontWeight={600}>
                                        {detailBlock.ubicacion_nombre || detailBlock.ubicacion?.nombre || ubicaciones?.find(u => String(u.ubicacion_id) === String(detailBlock.ubicacion_id))?.nombre || '—'}
                                    </Typography>
                                </Box>
                                <Divider />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" color="text.secondary">Inicio</Typography>
                                    <Typography variant="body2" fontWeight={600}>
                                        {dayjs(detailBlock.inicio_datetime).format('DD/MM/YYYY HH:mm')}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" color="text.secondary">Fin</Typography>
                                    <Typography variant="body2" fontWeight={600}>
                                        {dayjs(detailBlock.fin_datetime).format('DD/MM/YYYY HH:mm')}
                                    </Typography>
                                </Box>
                                <Divider />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="body2" color="text.secondary">Origen</Typography>
                                    <Chip label={detailBlock.origen_bloqueo_code} size="small" variant="outlined" />
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="body2" color="text.secondary">Estatus</Typography>
                                    <Chip
                                        label={detailBlock.estatus_bloqueo}
                                        color={statusColors[detailBlock.estatus_bloqueo] || 'default'}
                                        size="small"
                                    />
                                </Box>
                                {detailBlock.external_uid && (
                                    <>
                                        <Divider />
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="body2" color="text.secondary">UID externo</Typography>
                                            <Typography variant="body2" sx={{ fontSize: '0.75rem', wordBreak: 'break-all', maxWidth: '60%', textAlign: 'right' }}>
                                                {detailBlock.external_uid}
                                            </Typography>
                                        </Box>
                                    </>
                                )}

                                {detailBlock.origen_bloqueo_code === 'ICAL' && (
                                    <Alert severity="info" sx={{ mt: 1 }}>
                                        Este bloqueo proviene de una sincronización iCal (Airbnb). Los cambios de estatus pueden revertirse en el próximo sync.
                                    </Alert>
                                )}
                            </Box>
                        </DialogContent>
                        <DialogActions sx={{ px: 3, pb: 2 }}>
                            {detailBlock.estatus_bloqueo === 'ACTIVO' && detailBlock.origen_bloqueo_code === 'ICAL' && (
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => {
                                        const params = new URLSearchParams({
                                            from: 'bloqueo',
                                            ubicacion_id: detailBlock.ubicacion_id,
                                            checkin: dayjs(detailBlock.inicio_datetime).format('YYYY-MM-DDTHH:mm'),
                                            checkout: dayjs(detailBlock.fin_datetime).format('YYYY-MM-DDTHH:mm'),
                                        });
                                        navigate(`/reservaciones/nueva?${params.toString()}`);
                                    }}
                                    sx={{ mr: 'auto' }}
                                >
                                    Crear Reservación
                                </Button>
                            )}
                            <Button onClick={() => setDetailBlock(null)}>
                                Cerrar
                            </Button>
                            {detailBlock.estatus_bloqueo === 'ACTIVO' && (
                                <Button
                                    variant="contained"
                                    color="error"
                                    onClick={() => {
                                        cancelMutation.mutate(detailBlock.bloqueo_id);
                                    }}
                                    disabled={cancelMutation.isPending}
                                >
                                    {cancelMutation.isPending ? 'Cancelando...' : 'Cancelar Bloqueo'}
                                </Button>
                            )}
                            {detailBlock.estatus_bloqueo === 'INACTIVO' && (
                                <Button
                                    variant="contained"
                                    color="success"
                                    onClick={() => {
                                        reactivateMutation.mutate(detailBlock.bloqueo_id);
                                    }}
                                    disabled={reactivateMutation.isPending}
                                >
                                    {reactivateMutation.isPending ? 'Reactivando...' : 'Reactivar Bloqueo'}
                                </Button>
                            )}
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </Box >
    );
}
