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
                // Warm cream background — logo contrasts cleanly against the card
                background: 'linear-gradient(150deg, #E8E4DA 0%, #F5F2EC 40%, #F8F6F1 70%, #EDE9E0 100%)',
                p: 2,
            }}
        >
            <Card
                sx={{
                    maxWidth: 440,
                    width: '100%',
                    borderTop: '4px solid #C9A84C',
                    borderRadius: '0 0 16px 16px',
                    // Softer shadow — suits the light background
                    boxShadow: '0 8px 40px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)',
                    overflow: 'visible',
                }}
            >
                <CardContent sx={{ p: { xs: 3, sm: 4 }, pt: { xs: 4, sm: 4.5 } }}>

                    {/* Logo & brand */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3.5 }}>

                        {logoError ? (
                            <HomeIcon sx={{ color: '#C9A84C', fontSize: 52, mb: 3 }} />
                        ) : (
                            <img
                                src="/brand/cielito-logo.png"
                                alt="Cielito Home"
                                style={{
                                    width: '200px',
                                    maxWidth: '70%',
                                    height: 'auto',
                                    objectFit: 'contain',
                                    display: 'block',
                                    margin: '0 auto 24px auto',
                                }}
                                onError={() => setLogoError(true)}
                            />
                        )}

                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >
                            Gestión de Reservas
                        </Typography>
                    </Box>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2.5 }}>
                            {error}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                                py: 1.4,
                                fontSize: '0.95rem',
                                fontWeight: 600,
                                bgcolor: 'primary.dark',
                                '&:hover': {
                                    bgcolor: 'primary.main',
                                    boxShadow: '0 4px 16px rgba(46,125,50,0.35)',
                                },
                                '&:disabled': {
                                    bgcolor: 'action.disabledBackground',
                                },
                            }}
                        >
                            {loading ? (
                                <CircularProgress size={22} color="inherit" />
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
