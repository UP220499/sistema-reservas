import { useState } from 'react';
import { getErrorMessage } from '../../utils/error';
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
    IconButton,
    Alert,
    Skeleton,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import AddIcon from '@mui/icons-material/Add';
import PhoneIcon from '@mui/icons-material/Phone';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { clientsApi, type AddPhonePayload } from '../../api/clients';
import { type ClienteTelefono, type LoyaltyInfo } from '../../types';

const LOYALTY_COLOR: Record<string, 'default' | 'warning' | 'success' | 'secondary'> = {
    BRONCE: 'warning',
    PLATA: 'default',
    ORO: 'success',
    PLATINO: 'secondary',
};

function LoyaltyCard({ loyalty }: { loyalty: LoyaltyInfo }) {
    return (
        <Card sx={{ mt: 3 }}>
            <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Programa de Lealtad
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Chip
                        label={loyalty.nivel_loyalty}
                        color={LOYALTY_COLOR[loyalty.nivel_loyalty] ?? 'default'}
                        sx={{ fontWeight: 700, px: 0.5 }}
                    />
                    <Box sx={{ display: 'flex', gap: 3 }}>
                        <Box>
                            <Typography variant="caption" color="text.secondary" display="block">
                                Puntos
                            </Typography>
                            <Typography variant="body2" fontWeight={600}>
                                {loyalty.puntos.toLocaleString()}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" color="text.secondary" display="block">
                                Reservas completadas
                            </Typography>
                            <Typography variant="body2" fontWeight={600}>
                                {loyalty.total_reservas.toLocaleString()}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
}
import ConfirmDialog from '../../components/common/ConfirmDialog';

export default function ClientDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [phoneDialogOpen, setPhoneDialogOpen] = useState(false);
    const [newPhone, setNewPhone] = useState('');
    const [editingPhone, setEditingPhone] = useState<ClienteTelefono | null>(null);
    const [error, setError] = useState('');
    const [confirmStatusOpen, setConfirmStatusOpen] = useState(false);
    const [deletePhoneOpen, setDeletePhoneOpen] = useState(false);
    const [phoneToDelete, setPhoneToDelete] = useState<string | null>(null);



    const { data: client, isLoading } = useQuery({
        queryKey: ['client', id],
        queryFn: () => clientsApi.findOne(id!),
        enabled: !!id,
    });

    const toggleStatusMutation = useMutation({
        mutationFn: () => clientsApi.changeStatus(id!, !client?.activo),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['client', id] });
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            queryClient.invalidateQueries({ queryKey: ['clients-all'] });
            setConfirmStatusOpen(false);
        },
        onError: (err) => setError(getErrorMessage(err)),
    });

    const addPhoneMutation = useMutation({
        mutationFn: (payload: AddPhonePayload) =>
            clientsApi.addPhone(id!, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['client', id] });
            setPhoneDialogOpen(false);
            setNewPhone('');
        },
        onError: (err) => setError(getErrorMessage(err)),
    });

    const editPhoneMutation = useMutation({
        mutationFn: ({ id: phoneId, telefono }: { id: string; telefono: string }) =>
            clientsApi.updatePhone(id!, phoneId, { telefono }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['client', id] });
            setPhoneDialogOpen(false);
            setEditingPhone(null);
            setNewPhone('');
        },
        onError: (err) => setError(getErrorMessage(err)),
    });

    const deletePhoneMutation = useMutation({
        mutationFn: (phoneId: string) =>
            clientsApi.updatePhone(id!, phoneId, { activo: false }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['client', id] });
        },
        onError: (err) => setError(getErrorMessage(err)),
    });

    const setPrimaryMutation = useMutation({
        mutationFn: (phoneId: string) => clientsApi.setPrimaryPhone(id!, phoneId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['client', id] });
        },
    });

    if (isLoading) {
        return (
            <Box>
                <Skeleton variant="text" width={200} height={40} />
                <Skeleton
                    variant="rectangular"
                    height={200}
                    sx={{ mt: 2, borderRadius: 2 }}
                />
            </Box>
        );
    }

    if (!client) {
        return (
            <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography color="text.secondary">Cliente no encontrado</Typography>
                <Button onClick={() => navigate('/clientes')} sx={{ mt: 2 }}>
                    Volver
                </Button>
            </Box>
        );
    }

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <IconButton onClick={() => navigate('/clientes')}>
                    <ArrowBackIcon />
                </IconButton>
                <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h5" fontWeight={700}>
                        {client.nombre}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Cliente #{client.cliente_id}
                    </Typography>
                </Box>
                <Chip
                    label={client.activo ? 'Activo' : 'Inactivo'}
                    color={client.activo ? 'success' : 'default'}
                />
                <Button
                    variant="outlined"
                    size="small"
                    onClick={() => navigate(`/clientes/${id}/editar`)}
                >
                    Editar Info
                </Button>
                <Button
                    variant="outlined"
                    size="small"
                    color={client.activo ? 'error' : 'success'}
                    onClick={() => setConfirmStatusOpen(true)}
                >
                    {client.activo ? 'Desactivar' : 'Activar'}
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                    gap: 3,
                }}
            >
                {/* Info */}
                <Card>
                    <CardContent>
                        <Typography
                            variant="subtitle2"
                            color="text.secondary"
                            gutterBottom
                        >
                            Información
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        <InfoRow label="Nombre" value={client.nombre} />
                        <InfoRow label="Correo" value={client.correo} />
                    </CardContent>
                </Card>

                {/* Phones */}
                <Card>
                    <CardContent>
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <Typography
                                variant="subtitle2"
                                color="text.secondary"
                                gutterBottom
                            >
                                Teléfonos
                            </Typography>
                            <Button
                                size="small"
                                startIcon={<AddIcon />}
                                onClick={() => setPhoneDialogOpen(true)}
                            >
                                Agregar
                            </Button>
                        </Box>
                        <Divider sx={{ mb: 1 }} />
                        <List dense>
                            {client.phones && client.phones.length > 0 ? (
                                client.phones.map((phone) => (
                                    <ListItem key={phone.cliente_telefono_id}>
                                        <PhoneIcon
                                            sx={{ mr: 1.5, color: 'text.secondary', fontSize: 20 }}
                                        />
                                        <ListItemText
                                            primary={phone.telefono}
                                            secondary={
                                                !phone.activo ? 'Inactivo' : undefined
                                            }
                                        />
                                        <ListItemSecondaryAction>
                                            <IconButton
                                                size="small"
                                                onClick={() => {
                                                    setEditingPhone(phone);
                                                    setNewPhone(phone.telefono);
                                                    setPhoneDialogOpen(true);
                                                }}
                                                title="Editar"
                                            >
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => {
                                                    setPhoneToDelete(phone.cliente_telefono_id);
                                                    setDeletePhoneOpen(true);
                                                }}
                                                title="Eliminar"
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() =>
                                                    setPrimaryMutation.mutate(phone.cliente_telefono_id)
                                                }
                                                color={phone.es_principal ? 'primary' : 'default'}
                                                title={
                                                    phone.es_principal
                                                        ? 'Teléfono principal'
                                                        : 'Marcar como principal'
                                                }
                                            >
                                                {phone.es_principal ? (
                                                    <StarIcon fontSize="small" />
                                                ) : (
                                                    <StarBorderIcon fontSize="small" />
                                                )}
                                            </IconButton>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                ))
                            ) : (
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ py: 2, textAlign: 'center' }}
                                >
                                    Sin teléfonos registrados
                                </Typography>
                            )}
                        </List>
                    </CardContent>
                </Card>
            </Box>

            {/* Loyalty */}
            {client.loyalty && <LoyaltyCard loyalty={client.loyalty} />}

            {/* Add/Edit Phone Dialog */}
            <Dialog
                open={phoneDialogOpen}
                onClose={() => {
                    setPhoneDialogOpen(false);
                    setEditingPhone(null);
                    setNewPhone('');
                }}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle>{editingPhone ? 'Editar Teléfono' : 'Agregar Teléfono'}</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Número de teléfono"
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        fullWidth
                        sx={{ mt: 1 }}
                        placeholder="Ej: +52 1234567890"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {
                        setPhoneDialogOpen(false);
                        setEditingPhone(null);
                        setNewPhone('');
                    }}>
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => {
                            if (editingPhone) {
                                editPhoneMutation.mutate({
                                    id: editingPhone.cliente_telefono_id,
                                    telefono: newPhone
                                });
                            } else {
                                addPhoneMutation.mutate({
                                    telefono: newPhone,
                                    es_principal: false,
                                });
                            }
                        }}
                        disabled={!newPhone || (editingPhone ? editPhoneMutation.isPending : addPhoneMutation.isPending)}
                    >
                        {editingPhone ? 'Guardar' : 'Agregar'}
                    </Button>
                </DialogActions>
            </Dialog>

            <ConfirmDialog
                open={deletePhoneOpen}
                title="Eliminar Teléfono"
                content="¿Estás seguro de eliminar este teléfono? Esta acción no se puede deshacer."
                confirmText="Eliminar"
                confirmColor="error"
                onClose={() => {
                    setDeletePhoneOpen(false);
                    setPhoneToDelete(null);
                }}
                onConfirm={() => {
                    if (phoneToDelete) {
                        deletePhoneMutation.mutate(phoneToDelete);
                        setDeletePhoneOpen(false);
                    }
                }}
            />

            <ConfirmDialog
                open={confirmStatusOpen}
                title="Confirmar cambio de estatus"
                content={`¿Estás seguro de querer ${client.activo ? 'desactivar' : 'activar'} a este cliente? ${client.activo ? 'No podrá ser seleccionado para nuevas reservaciones.' : ''}`}
                confirmText={client.activo ? 'Desactivar' : 'Activar'}
                confirmColor={client.activo ? 'error' : 'primary'}
                onClose={() => setConfirmStatusOpen(false)}
                onConfirm={() => {
                    toggleStatusMutation.mutate();
                    setConfirmStatusOpen(false);
                }}
            />
        </Box>
    );
}

function InfoRow({
    label,
    value,
}: {
    label: string;
    value?: string | null;
}) {
    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'space-between',
                py: 0.75,
                '&:not(:last-child)': {
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                },
            }}
        >
            <Typography variant="body2" color="text.secondary">
                {label}
            </Typography>
            <Typography variant="body2" fontWeight={600}>
                {value || '—'}
            </Typography>
        </Box>
    );
}
