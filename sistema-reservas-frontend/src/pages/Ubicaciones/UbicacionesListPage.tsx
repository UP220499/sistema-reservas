import { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Switch,
    FormControlLabel,
    Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ubicacionesApi, type CreateUbicacionPayload } from '../../api/ubicaciones';
import type { Ubicacion } from '../../types';
import { qk } from '../../utils/queryKeys';
import { useToast } from '../../hooks/useToast';
import axios from 'axios';
import { getErrorMessage } from '../../utils/error';

export default function UbicacionesListPage() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<CreateUbicacionPayload>({ nombre: '', activa: true, airbnb_ical_url: '' });
    const [error, setError] = useState('');

    const { data: ubicaciones, isLoading } = useQuery({
        queryKey: qk.ubicaciones(),
        queryFn: ubicacionesApi.getAll,
    });

    const createMutation = useMutation({
        mutationFn: ubicacionesApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: qk.ubicaciones() });
            showToast('Ubicación creada correctamente');
            handleClose();
        },
        onError: (err) => setError(getErrorMessage(err)),
    });

    const updateMutation = useMutation({
        mutationFn: (data: { id: string; payload: Partial<CreateUbicacionPayload> }) => 
            ubicacionesApi.update(data.id, data.payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: qk.ubicaciones() });
            showToast('Ubicación actualizada correctamente');
            handleClose();
        },
        onError: (err) => setError(getErrorMessage(err)),
    });

    const deleteMutation = useMutation({
        mutationFn: ubicacionesApi.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: qk.ubicaciones() });
            showToast('Ubicación eliminada correctamente');
        },
        onError: (err) => {
            if (axios.isAxiosError(err) && err.response?.status === 409) {
                showToast('No se puede eliminar la ubicación porque tiene reservaciones asociadas', 'error');
            } else {
                showToast(getErrorMessage(err), 'error');
            }
        },
    });

    const handleOpen = (ubicacion?: Ubicacion) => {
        if (ubicacion) {
            setEditingId(ubicacion.ubicacion_id);
            setForm({ nombre: ubicacion.nombre, activa: ubicacion.activa, airbnb_ical_url: ubicacion.airbnb_ical_url || '' });
        } else {
            setEditingId(null);
            setForm({ nombre: '', activa: true, airbnb_ical_url: '' });
        }
        setError('');
        setDialogOpen(true);
    };

    const handleClose = () => {
        setDialogOpen(false);
    };

    const handleSubmit = () => {
        if (!form.nombre.trim()) {
            setError('El nombre es requerido');
            return;
        }

        if (editingId) {
            updateMutation.mutate({ id: editingId, payload: form });
        } else {
            createMutation.mutate(form);
        }
    };

    const handleDelete = (id: string) => {
        if (window.confirm('¿Estás seguro de eliminar esta ubicación?')) {
            deleteMutation.mutate(id);
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5" fontWeight={700}>
                    Ubicaciones
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
                    Nueva Ubicación
                </Button>
            </Box>

            <Card>
                <CardContent>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Nombre</TableCell>
                                    <TableCell>Estado</TableCell>
                                    <TableCell align="right">Acciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={3} align="center">
                                            Cargando...
                                        </TableCell>
                                    </TableRow>
                                ) : ubicaciones?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} align="center">
                                            No hay ubicaciones registradas
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    ubicaciones?.map((ub) => (
                                        <TableRow key={ub.ubicacion_id}>
                                            <TableCell>{ub.nombre}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={ub.activa ? 'Activa' : 'Inactiva'}
                                                    color={ub.activa ? 'success' : 'default'}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <IconButton onClick={() => handleOpen(ub)} size="small" color="primary">
                                                    <EditIcon />
                                                </IconButton>
                                                <IconButton onClick={() => handleDelete(ub.ubicacion_id)} size="small" color="error">
                                                    <DeleteIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>

            <Dialog open={dialogOpen} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>{editingId ? 'Editar Ubicación' : 'Nueva Ubicación'}</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        {error && <Alert severity="error">{error}</Alert>}
                        <TextField
                            label="Nombre"
                            value={form.nombre}
                            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                            fullWidth
                            required
                        />
                        <TextField
                            label="URL de Calendario Airbnb (Opcional)"
                            value={form.airbnb_ical_url || ''}
                            onChange={(e) => setForm({ ...form, airbnb_ical_url: e.target.value })}
                            fullWidth
                            placeholder="https://www.airbnb.mx/calendar/ical/..."
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={form.activa}
                                    onChange={(e) => setForm({ ...form, activa: e.target.checked })}
                                />
                            }
                            label="Activa"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancelar</Button>
                    <Button 
                        onClick={handleSubmit} 
                        variant="contained"
                        disabled={createMutation.isPending || updateMutation.isPending}
                    >
                        {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : 'Guardar'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
