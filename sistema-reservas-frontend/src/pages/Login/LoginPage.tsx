import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
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
    Divider,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import HomeIcon from '@mui/icons-material/Home';
import { useAuth } from '../../hooks/useAuth';


export default function LoginPage() {
    const navigate = useNavigate();
    const { login, isAuthenticated } = useAuth();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [logoError, setLogoError] = useState(false);

    if (isAuthenticated) {
        return <Navigate to="/" replace />;
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
                background: 'linear-gradient(160deg, #EDE8DD 0%, #F6F3EE 100%)',
                p: 2,
            }}
        >
            <Box sx={{ width: '100%', maxWidth: 420 }}>

                {/* Gold accent bar — mirrors sidebar top bar */}
                <Box sx={{ height: 3, bgcolor: '#C9A84C', borderRadius: '6px 6px 0 0' }} />

                <Card
                    sx={{
                        borderRadius: '0 0 16px 16px',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.05)',
                        border: '1px solid rgba(0,0,0,0.07)',
                        borderTop: 'none',
                    }}
                >
                    <CardContent sx={{ p: { xs: 3.5, sm: 4.5 } }}>

                        {/* ── Branding block ── */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3.5 }}>
                            {logoError ? (
                                <HomeIcon sx={{ color: '#C9A84C', fontSize: 48, mb: 1.5 }} />
                            ) : (
                                <Box
                                    component="img"
                                    src="/brand/cielito-logo.png"
                                    alt="Cielito Home"
                                    sx={{
                                        width: 175,
                                        maxWidth: '65%',
                                        height: 'auto',
                                        objectFit: 'contain',
                                        display: 'block',
                                        mb: 1.5,
                                    }}
                                    onError={() => setLogoError(true)}
                                />
                            )}
                            <Typography
                                variant="caption"
                                sx={{
                                    color: 'text.secondary',
                                    letterSpacing: '0.1em',
                                    textTransform: 'uppercase',
                                    fontSize: '0.68rem',
                                }}
                            >
                                Gestión de Reservas
                            </Typography>
                        </Box>

                        <Divider sx={{ mb: 3 }} />

                        {/* ── Form heading ── */}
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, fontSize: '1rem' }}>
                            Iniciar sesión
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontSize: '0.825rem' }}>
                            Ingresa tus credenciales para continuar
                        </Typography>

                        {error && (
                            <Alert severity="error" sx={{ mb: 2.5 }}>
                                {error}
                            </Alert>
                        )}

                        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                            <TextField
                                id="username"
                                label="Usuario"
                                fullWidth
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                autoComplete="username"
                                autoFocus
                                required
                            />

                            <TextField
                                id="password"
                                label="Contraseña"
                                fullWidth
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
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
                                                    sx={{ color: 'text.secondary' }}
                                                >
                                                    {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
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
                                    mt: 0.5,
                                    py: 1.5,
                                    fontSize: '0.9375rem',
                                    fontWeight: 700,
                                    letterSpacing: '0.01em',
                                    bgcolor: '#1A3C2A',
                                    '&:hover': {
                                        bgcolor: '#2E7D32',
                                        boxShadow: '0 4px 16px rgba(26,60,42,0.30)',
                                    },
                                    '&:disabled': {
                                        bgcolor: 'action.disabledBackground',
                                    },
                                }}
                            >
                                {loading ? (
                                    <CircularProgress size={22} color="inherit" />
                                ) : (
                                    'Iniciar sesión'
                                )}
                            </Button>
                        </Box>

                        {/* ── Footer ── */}
                        <Typography
                            variant="caption"
                            sx={{
                                display: 'block',
                                textAlign: 'center',
                                mt: 3.5,
                                color: 'text.disabled',
                                fontSize: '0.7rem',
                                letterSpacing: '0.05em',
                            }}
                        >
                            Cielito Home · v1.0.0
                        </Typography>
                    </CardContent>
                </Card>
            </Box>
        </Box>
    );
}
