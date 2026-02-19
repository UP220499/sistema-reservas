import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { clientsApi, type CreateClientPayload } from '../../api/clients';
import { getErrorMessage } from '../../utils/error';

export default function ClientFormPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [form, setForm] = useState<CreateClientPayload>({
        nombre: '',
        correo: '',
        phones: [{ telefono: '', es_principal: true }],
    });
    const [error, setError] = useState('');

    const mutation = useMutation({
        mutationFn: (payload: CreateClientPayload) => clientsApi.create(payload),
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            navigate(`/clientes/${result.cliente_id}`);
        },
        onError: (err: unknown) =>
            setError(getErrorMessage(err, 'Error al crear el cliente')),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!form.nombre.trim()) {
            setError('El nombre es obligatorio');
            return;
        }
        if (form.phones.length === 0 || !form.phones[0].telefono.trim()) {
            setError('Debes agregar al menos un teléfono');
            return;
        }
        mutation.mutate(form);
    };

    const addPhone = () => {
        setForm((prev) => ({
            ...prev,
            phones: [...prev.phones, { telefono: '', es_principal: false }],
        }));
    };

    const removePhone = (index: number) => {
        setForm((prev) => ({
            ...prev,
            phones: prev.phones.filter((_, i) => i !== index),
        }));
    };

    const updatePhone = (index: number, value: string) => {
        setForm((prev) => ({
            ...prev,
            phones: prev.phones.map((p, i) =>
                i === index ? { ...p, telefono: value } : p,
            ),
        }));
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <IconButton onClick={() => navigate('/clientes')}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h5" fontWeight={700}>
                    Nuevo Cliente
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
                                        required={index === 0}
                                        placeholder="Ej: +52 1234567890"
                                    />
                                    {index > 0 && (
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => removePhone(index)}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    )}
                                </Box>
                            ))}
                        </Box>

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
                                onClick={() => navigate('/clientes')}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={mutation.isPending}
                            >
                                {mutation.isPending ? 'Guardando...' : 'Crear Cliente'}
                            </Button>
                        </Box>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
}
