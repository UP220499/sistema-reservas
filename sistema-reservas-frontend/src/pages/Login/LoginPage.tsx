import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import {
    Box,
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
import HomeIcon from '@mui/icons-material/Home';
import { useAuth } from '../../hooks/useAuth';

// Design tokens — aligned with sidebar palette
const BRAND_BG = '#1A3C2A';
const GOLD = '#C9A84C';
const FORM_BG = '#F6F3EE';

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
                flexDirection: { xs: 'column', md: 'row' },
            }}
        >
            {/* ── Left: Branding panel ── */}
            <Box
                sx={{
                    width: { xs: '100%', md: '40%' },
                    minHeight: { xs: 210, md: 'auto' },
                    bgcolor: BRAND_BG,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: { xs: 4, md: 6 },
                    position: 'relative',
                    overflow: 'hidden',
                    flexShrink: 0,
                }}
            >
                {/* Gold accent bar at top — mirrors sidebar */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 3,
                        bgcolor: GOLD,
                    }}
                />

                {/* Brand content */}
                <Box sx={{ textAlign: 'center', maxWidth: 300 }}>
                    {logoError ? (
                        <HomeIcon sx={{ color: GOLD, fontSize: { xs: 44, md: 56 }, mb: 2 }} />
                    ) : (
                        <Box
                            component="img"
                            src="/brand/cielito-logo-blanco.png"
                            alt="Cielito Home"
                            sx={{
                                width: { xs: 140, md: 190 },
                                maxWidth: '80%',
                                height: 'auto',
                                objectFit: 'contain',
                                display: 'block',
                                mx: 'auto',
                                mb: { xs: 1.5, md: 2.5 },
                            }}
                            onError={() => setLogoError(true)}
                        />
                    )}

                    {/* Thin gold separator */}
                    <Box
                        sx={{
                            width: 28,
                            height: 1.5,
                            bgcolor: GOLD,
                            opacity: 0.6,
                            mx: 'auto',
                            mb: { xs: 1.5, md: 2 },
                        }}
                    />

                    <Typography
                        variant="caption"
                        sx={{
                            color: 'rgba(255,255,255,0.48)',
                            letterSpacing: '0.14em',
                            textTransform: 'uppercase',
                            fontSize: '0.67rem',
                            display: 'block',
                        }}
                    >
                        Gestión de Reservas
                    </Typography>

                    {/* Description — desktop only */}
                    <Typography
                        variant="body2"
                        sx={{
                            mt: 2.5,
                            color: 'rgba(255,255,255,0.30)',
                            fontSize: '0.8rem',
                            lineHeight: 1.75,
                            display: { xs: 'none', md: 'block' },
                        }}
                    >
                        Control centralizado de reservas,
                        <br />
                        clientes y disponibilidad.
                    </Typography>
                </Box>

                {/* Version — desktop only */}
                <Typography
                    variant="caption"
                    sx={{
                        position: 'absolute',
                        bottom: 20,
                        color: 'rgba(255,255,255,0.18)',
                        fontSize: '0.67rem',
                        letterSpacing: '0.05em',
                        display: { xs: 'none', md: 'block' },
                    }}
                >
                    Cielito Home · v1.0.0
                </Typography>
            </Box>

            {/* ── Right: Form panel ── */}
            <Box
                sx={{
                    flex: 1,
                    bgcolor: FORM_BG,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: { xs: 3, sm: 4, md: 6 },
                }}
            >
                <Box sx={{ width: '100%', maxWidth: 380 }}>

                    {/* Form heading */}
                    <Typography
                        variant="h5"
                        sx={{ fontWeight: 700, mb: 0.75, color: 'text.primary' }}
                    >
                        Bienvenida
                    </Typography>
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 3.5 }}
                    >
                        Ingresa tus credenciales para continuar
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {error}
                        </Alert>
                    )}

                    <Box
                        component="form"
                        onSubmit={handleSubmit}
                        sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
                    >
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
                                                {showPassword
                                                    ? <VisibilityOff fontSize="small" />
                                                    : <Visibility fontSize="small" />}
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
                                bgcolor: BRAND_BG,
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
                </Box>
            </Box>
        </Box>
    );
}
