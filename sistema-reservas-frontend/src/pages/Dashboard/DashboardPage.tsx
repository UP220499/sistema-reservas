import { useNavigate } from 'react-router-dom';
import { Box, Typography, Card, CardContent } from '@mui/material';
import EventNoteIcon from '@mui/icons-material/EventNote';
import PeopleIcon from '@mui/icons-material/People';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import BlockIcon from '@mui/icons-material/Block';
import { useAuth } from '../../hooks/useAuth';

const cards = [
    {
        title: 'Reservaciones',
        description: 'Gestiona reservas, estatus y pagos',
        icon: <EventNoteIcon sx={{ fontSize: 40 }} />,
        color: '#2E7D32',
        bgColor: '#E8F5E9',
        path: '/reservaciones',
    },
    {
        title: 'Clientes',
        description: 'Administra clientes y contactos',
        icon: <PeopleIcon sx={{ fontSize: 40 }} />,
        color: '#1976D2',
        bgColor: '#E3F2FD',
        path: '/clientes',
    },
    {
        title: 'Calendario',
        description: 'Vista general de disponibilidad',
        icon: <CalendarMonthIcon sx={{ fontSize: 40 }} />,
        color: '#F57C00',
        bgColor: '#FFF3E0',
        path: '/calendario',
    },
    {
        title: 'Bloqueos',
        description: 'Gestiona bloqueos de ubicaciones',
        icon: <BlockIcon sx={{ fontSize: 40 }} />,
        color: '#7B1FA2',
        bgColor: '#F3E5F5',
        path: '/bloqueos',
    },
];

export default function DashboardPage() {
    const { user } = useAuth();
    const navigate = useNavigate();

    return (
        <Box>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                    ¡Hola, {user?.nombre?.split(' ')[0]}! 👋
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Bienvenida al Sistema de Reservas. Aquí tienes un resumen rápido.
                </Typography>
            </Box>

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'repeat(2, 1fr)',
                        md: 'repeat(4, 1fr)',
                    },
                    gap: 3,
                }}
            >
                {cards.map((card) => (
                    <Card
                        key={card.title}
                        onClick={() => navigate(card.path)}
                        sx={{
                            cursor: 'pointer',
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                            },
                        }}
                    >
                        <CardContent sx={{ p: 3 }}>
                            <Box
                                sx={{
                                    width: 56,
                                    height: 56,
                                    borderRadius: 2,
                                    bgcolor: card.bgColor,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mb: 2,
                                    color: card.color,
                                }}
                            >
                                {card.icon}
                            </Box>
                            <Typography variant="h6" fontWeight={600} gutterBottom>
                                {card.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {card.description}
                            </Typography>
                        </CardContent>
                    </Card>
                ))}
            </Box>
        </Box>
    );
}
