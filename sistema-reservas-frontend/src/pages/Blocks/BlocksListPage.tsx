import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import dayjs from 'dayjs';
import {
    blocksApi,
    type BlockFilters,
    type CreateBlockPayload,
} from '../../api/blocks';

const statusColors: Record<string, 'success' | 'error' | 'default'> = {
    ACTIVO: 'success',
    CANCELADO: 'error',
};

export default function BlocksListPage() {
    const queryClient = useQueryClient();
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

    const { data, isLoading } = useQuery({
        queryKey: ['blocks', filters],
        queryFn: () => blocksApi.findAll(filters),
    });

    const createMutation = useMutation({
        mutationFn: (payload: CreateBlockPayload) => blocksApi.create(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['blocks'] });
            queryClient.invalidateQueries({ queryKey: ['calendar'] });
            setCreateOpen(false);
            resetForm();
        },
        onError: () => setError('Error al crear el bloqueo'),
    });

    const cancelMutation = useMutation({
        mutationFn: (id: string) => blocksApi.changeStatus(id, 'CANCELADO'),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['blocks'] });
            queryClient.invalidateQueries({ queryKey: ['calendar'] });
        },
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
                        <MenuItem value="CANCELADO">Cancelado</MenuItem>
                    </TextField>
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
                                        {Array.from({ length: 7 }).map((__, j) => (
                                            <TableCell key={j}>
                                                <Skeleton />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                                : data?.data?.map((block) => (
                                    <TableRow key={block.bloqueo_id} hover>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={600}>
                                                #{block.bloqueo_id}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            {block.ubicacion?.nombre || `Ubicación ${block.ubicacion_id}`}
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
                                            {block.estatus_bloqueo === 'ACTIVO' && (
                                                <Button
                                                    size="small"
                                                    color="error"
                                                    onClick={() =>
                                                        cancelMutation.mutate(block.bloqueo_id)
                                                    }
                                                    disabled={cancelMutation.isPending}
                                                >
                                                    Cancelar
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}

                            {!isLoading && (!data?.data || data.data.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                                        <Typography color="text.secondary">
                                            No se encontraron bloqueos
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {data?.meta && (
                    <TablePagination
                        component="div"
                        count={data.meta.total}
                        page={(data.meta.page || 1) - 1}
                        rowsPerPage={data.meta.page_size || 10}
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
                            label="ID Ubicación"
                            value={form.ubicacion_id}
                            onChange={(e) =>
                                setForm((prev) => ({ ...prev, ubicacion_id: e.target.value }))
                            }
                            fullWidth
                            required
                            placeholder="Ej: 1, 2, 3..."
                        />

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
        </Box>
    );
}
