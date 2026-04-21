import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { qk } from '../../utils/queryKeys';
import {
    Box,
    Typography,
    Card,
    CardContent,
    TextField,
    Button,
    Alert,
    IconButton,
    Divider,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { clientsApi, type CreateClientPayload, type Client } from '../../api/clients';
import { validatePhone } from '../../utils/phone';

interface ClientFormProps {
    initialData?: Client;
    clientId?: string;
}

export default function ClientForm({ initialData, clientId }: ClientFormProps) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const isEditing = !!clientId;

    const [form, setForm] = useState<CreateClientPayload>({
        nombre: initialData?.nombre || '',
        correo: initialData?.correo ?? null,
        phones: [],
    });
    const [error, setError] = useState('');
    const [phoneErrors, setPhoneErrors] = useState<string[]>([]);

    const mutation = useMutation({
        mutationFn: (payload: CreateClientPayload) => {
            if (isEditing) {
                return clientsApi.update(clientId!, {
                    nombre: payload.nombre,
                    correo: payload.correo,
                });
            }
            return clientsApi.create(payload);
        },
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: qk.clients.list(), exact: false });
            queryClient.refetchQueries({ queryKey: qk.clients.list(), exact: false, type: 'active' });
            queryClient.invalidateQueries({ queryKey: qk.clients.all() });
            if (isEditing) {
                queryClient.invalidateQueries({ queryKey: qk.clients.detail(clientId) });
                queryClient.refetchQueries({ queryKey: qk.clients.detail(clientId) });
            }
            navigate(`/clientes/${result.cliente_id}`);
        },
        onError: () => setError('Error al guardar el cliente'),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!form.nombre.trim()) {
            setError('El nombre es obligatorio');
            return;
        }
        if (!isEditing && form.phones.length > 0) {
            const errs = form.phones.map((p) => validatePhone(p.telefono));
            if (errs.some((e) => e !== '')) {
                setPhoneErrors(errs);
                setError('Corrige los errores en los teléfonos');
                return;
            }
        }
        mutation.mutate(form);
    };

    const addPhone = () => {
        setForm((prev) => ({
            ...prev,
            phones: [...prev.phones, { telefono: '', es_principal: false }],
        }));
        setPhoneErrors((prev) => [...prev, '']);
    };

    const removePhone = (index: number) => {
        setForm((prev) => ({
            ...prev,
            phones: prev.phones.filter((_, i) => i !== index),
        }));
        setPhoneErrors((prev) => prev.filter((_, i) => i !== index));
    };

    const updatePhone = (index: number, value: string) => {
        const stripped = value.replace(/\D/g, '');
        const digits = stripped.length === 12 && stripped.startsWith('52')
            ? stripped.slice(2)
            : stripped.slice(0, 10);
        setForm((prev) => ({
            ...prev,
            phones: prev.phones.map((p, i) =>
                i === index ? { ...p, telefono: digits } : p,
            ),
        }));
        setPhoneErrors((prev) => {
            const next = [...prev];
            next[index] = validatePhone(digits);
            return next;
        });
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <IconButton onClick={() => navigate('/clientes')}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h5" fontWeight={700}>
                    {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
                </Typography>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            <Card>
                <CardContent>
                    <Box
                        component="form"
                        onSubmit={handleSubmit}
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2.5,
                        }}
                    >
                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                                gap: 2.5,
                            }}
                        >
                            <TextField
                                label="Nombre completo"
                                value={form.nombre}
                                onChange={(e) =>
                                    setForm((prev) => ({ ...prev, nombre: e.target.value }))
                                }
                                required
                                fullWidth
                            />
                            <TextField
                                label="Correo electrónico"
                                type="email"
                                value={form.correo || ''}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        correo: e.target.value || null,
                                    }))
                                }
                                fullWidth
                            />
                        </Box>

                        <Divider />

                        {!isEditing && (
                            <Box>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        mb: 1,
                                    }}
                                >
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Teléfonos
                                    </Typography>
                                    <Button
                                        size="small"
                                        startIcon={<AddIcon />}
                                        onClick={addPhone}
                                    >
                                        Agregar
                                    </Button>
                                </Box>
                                {form.phones.length === 0 && (
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                        Puedes agregar teléfonos ahora o después desde el detalle del cliente.
                                    </Typography>
                                )}
                                {form.phones.map((phone, index) => (
                                    <Box
                                        key={index}
                                        sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}
                                    >
                                        <TextField
                                            label={index === 0 ? 'Teléfono principal' : `Teléfono ${index + 1}`}
                                            value={phone.telefono}
                                            onChange={(e) => updatePhone(index, e.target.value)}
                                            fullWidth
                                            size="small"
                                            error={!!phoneErrors[index]}
                                            helperText={phoneErrors[index] || 'Ingresa 10 dígitos (México)'}
                                            slotProps={{
                                                input: { startAdornment: <span>+52&nbsp;</span> },
                                                htmlInput: { inputMode: 'numeric', pattern: '\\d*', maxLength: 12 },
                                            }}
                                        />
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => removePhone(index)}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                ))}
                            </Box>
                        )}

                        {isEditing && (
                            <Alert severity="info">
                                Los teléfonos se administran desde la vista de detalle del cliente.
                            </Alert>
                        )}

                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: 2,
                                mt: 1,
                            }}
                        >
                            <Button
                                variant="outlined"
                                onClick={() => navigate(isEditing ? `/clientes/${clientId}` : '/clientes')}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={mutation.isPending || phoneErrors.some((e) => e !== '')}
                            >
                                {mutation.isPending ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Crear Cliente')}
                            </Button>
                        </Box>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
}
