import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Card,
    CardContent,
    TextField,
    Button,
    Typography,
    Alert,
    InputAdornment,
    IconButton,
    CircularProgress,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { useAuth } from '../../hooks/useAuth';

export default function LoginPage() {
    const navigate = useNavigate();
    const { login, isAuthenticated } = useAuth();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // If already authenticated, redirect
    if (isAuthenticated) {
        navigate('/', { replace: true });
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(username, password);
            navigate('/', { replace: true });
        } catch {
            setError('Credenciales inválidas. Verifica tu usuario y contraseña.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 40%, #4CAF50 100%)',
                p: 2,
            }}
        >
            <Card
                sx={{
                    maxWidth: 420,
                    width: '100%',
                    borderRadius: 3,
                    boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
                    overflow: 'visible',
                }}
            >
                {/* Header */}
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        mt: -4,
                    }}
                >
                    <Box
                        sx={{
                            width: 72,
                            height: 72,
                            borderRadius: 3,
                            background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 20px rgba(46,125,50,0.4)',
                        }}
                    >
                        <CalendarMonthIcon sx={{ color: '#fff', fontSize: 36 }} />
                    </Box>
                </Box>

                <CardContent sx={{ p: 4, pt: 3 }}>
                    <Typography
                        variant="h5"
                        textAlign="center"
                        fontWeight={700}
                        gutterBottom
                    >
                        Sistema de Reservas
                    </Typography>
                    <Typography
                        variant="body2"
                        textAlign="center"
                        color="text.secondary"
                        sx={{ mb: 3 }}
                    >
                        Ingresa tus credenciales para continuar
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleSubmit}>
                        <TextField
                            id="username"
                            label="Usuario"
                            variant="outlined"
                            fullWidth
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            sx={{ mb: 2 }}
                            autoComplete="username"
                            autoFocus
                            required
                        />

                        <TextField
                            id="password"
                            label="Contraseña"
                            variant="outlined"
                            fullWidth
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            sx={{ mb: 3 }}
                            autoComplete="current-password"
                            required
                            slotProps={{
                                input: {
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => setShowPassword(!showPassword)}
                                                edge="end"
                                                size="small"
                                            >
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />

                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            size="large"
                            disabled={loading || !username || !password}
                            sx={{
                                py: 1.5,
                                fontSize: '1rem',
                                fontWeight: 600,
                                background:
                                    'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
                                boxShadow: '0 4px 12px rgba(46,125,50,0.3)',
                                '&:hover': {
                                    background:
                                        'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)',
                                    boxShadow: '0 6px 16px rgba(46,125,50,0.4)',
                                },
                            }}
                        >
                            {loading ? (
                                <CircularProgress size={24} color="inherit" />
                            ) : (
                                'Iniciar Sesión'
                            )}
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
}
