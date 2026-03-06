import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Box,
    Drawer,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Typography,
    Divider,
    Tooltip,
    IconButton,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import EventNoteIcon from '@mui/icons-material/EventNote';
import PeopleIcon from '@mui/icons-material/People';
import BlockIcon from '@mui/icons-material/Block';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import HomeIcon from '@mui/icons-material/Home';

export const DRAWER_WIDTH = 260;
export const DRAWER_WIDTH_MINI = 72;

const LOGO_PATH = '/brand/cielito-logo-blanco.png';

// Sidebar design tokens (dark forest theme)
const SB = {
    bg: '#1A3C2A',
    activeBg: 'rgba(201, 168, 76, 0.14)',
    hoverBg: 'rgba(255, 255, 255, 0.06)',
    divider: 'rgba(255, 255, 255, 0.08)',
    text: 'rgba(255, 255, 255, 0.68)',
    textActive: '#FFFFFF',
    iconActive: '#C9A84C',
    accent: '#C9A84C',
} as const;

interface SidebarProps {
    mobileOpen: boolean;
    onClose: () => void;
    isMobile: boolean;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
}

const menuItems = [
    { label: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { label: 'Reservaciones', icon: <EventNoteIcon />, path: '/reservaciones' },
    { label: 'Clientes', icon: <PeopleIcon />, path: '/clientes' },
    { label: 'Bloqueos', icon: <BlockIcon />, path: '/bloqueos' },
    { label: 'Calendario', icon: <CalendarMonthIcon />, path: '/calendario' },
];

export default function Sidebar({
    mobileOpen,
    onClose,
    isMobile,
    isCollapsed,
    onToggleCollapse,
}: SidebarProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const [logoError, setLogoError] = useState(false);

    const handleNavigation = (path: string) => {
        navigate(path);
        if (isMobile) onClose();
    };

    // Collapsed mode only applies on desktop
    const collapsed = !isMobile && isCollapsed;

    const drawerContent = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: SB.bg, overflow: 'hidden' }}>

            {/* ── Thin gold accent bar at top ── */}
            <Box sx={{ height: 3, bgcolor: SB.accent, flexShrink: 0 }} />

            {/* ── Logo header block — dark green, thin gold divider below ── */}
            <Box
                sx={{
                    bgcolor: SB.bg,
                    borderBottom: `1px solid ${SB.accent}`,
                    px: 2,
                    py: collapsed ? 1.75 : 2.5,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    gap: 0.5,
                    transition: 'padding 0.2s ease',
                }}
            >
                {/* Logo mark — on dark background */}
                {logoError ? (
                    <HomeIcon sx={{ color: SB.accent, fontSize: collapsed ? 26 : 36 }} />
                ) : (
                    <Box
                        component="img"
                        src={LOGO_PATH}
                        alt="Cielito Home"
                        sx={{
                            width: collapsed ? 44 : 160,
                            maxWidth: '75%',
                            height: 'auto',
                            objectFit: 'contain',
                            display: 'block',
                            mx: 'auto',
                            transition: 'width 0.2s ease',
                        }}
                        onError={() => setLogoError(true)}
                    />
                )}

                {/* Subtitle below logo — only when expanded */}
                {!collapsed && (
                    <Typography
                        variant="caption"
                        sx={{ color: SB.text, lineHeight: 1, display: 'block', textAlign: 'center' }}
                    >
                        Gestión de Reservas
                    </Typography>
                )}
            </Box>

            {/* Navigation section label — only when expanded */}
            {!collapsed && (
                <Box sx={{ px: 2.5, pt: 1.5, pb: 0 }}>
                    <Typography
                        variant="overline"
                        sx={{ color: 'rgba(255,255,255,0.28)', fontSize: '0.625rem', letterSpacing: '0.15em' }}
                    >
                        Navegación
                    </Typography>
                </Box>
            )}

            {/* Navigation */}
            <List sx={{ px: collapsed ? 0.75 : 1.5, py: 1, flexGrow: 1, overflow: 'hidden' }}>
                {menuItems.map((item) => {
                    const isActive =
                        item.path === '/'
                            ? location.pathname === '/'
                            : location.pathname.startsWith(item.path);

                    return (
                        <Tooltip
                            key={item.path}
                            title={collapsed ? item.label : ''}
                            placement="right"
                            arrow
                        >
                            <ListItemButton
                                onClick={() => handleNavigation(item.path)}
                                selected={isActive}
                                sx={{
                                    borderRadius: 1.5,
                                    mb: collapsed ? 0.75 : 0.5,
                                    px: collapsed ? 1 : 1.5,
                                    py: 1,
                                    minHeight: 44,
                                    justifyContent: collapsed ? 'center' : 'flex-start',
                                    color: isActive ? SB.textActive : SB.text,
                                    transition: 'all 0.15s ease',
                                    '&.Mui-selected': {
                                        bgcolor: collapsed
                                            ? 'rgba(201, 168, 76, 0.20)'
                                            : SB.activeBg,
                                        ...(collapsed
                                            ? {}
                                            : { borderLeft: `2px solid ${SB.accent}`, pl: '10px' }),
                                        color: SB.textActive,
                                        '&:hover': { bgcolor: 'rgba(201, 168, 76, 0.26)' },
                                        '& .MuiListItemIcon-root': { color: SB.iconActive },
                                    },
                                    '&:hover:not(.Mui-selected)': { bgcolor: SB.hoverBg },
                                    '& .MuiListItemIcon-root': {
                                        color: isActive ? SB.iconActive : SB.text,
                                        minWidth: collapsed ? 0 : 38,
                                        justifyContent: 'center',
                                        transition: 'color 0.15s ease',
                                    },
                                }}
                            >
                                <ListItemIcon>{item.icon}</ListItemIcon>
                                {!collapsed && (
                                    <ListItemText
                                        primary={item.label}
                                        primaryTypographyProps={{
                                            fontWeight: isActive ? 600 : 400,
                                            fontSize: '0.875rem',
                                            color: 'inherit',
                                        }}
                                    />
                                )}
                            </ListItemButton>
                        </Tooltip>
                    );
                })}
            </List>

            {/* Footer + collapse toggle */}
            <Divider sx={{ borderColor: SB.divider, mx: collapsed ? 1 : 2, flexShrink: 0 }} />
            <Box
                sx={{
                    px: collapsed ? 1 : 2.5,
                    py: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'space-between',
                    flexShrink: 0,
                }}
            >
                {!collapsed && (
                    <Typography
                        variant="caption"
                        sx={{ color: 'rgba(255,255,255,0.28)', fontSize: '0.7rem', letterSpacing: '0.05em' }}
                    >
                        Cielito Home · v1.0.0
                    </Typography>
                )}
                <Tooltip title={isCollapsed ? 'Expandir sidebar' : 'Contraer sidebar'} placement="right">
                    <IconButton
                        onClick={onToggleCollapse}
                        size="small"
                        sx={{
                            color: SB.text,
                            '&:hover': { bgcolor: SB.hoverBg, color: SB.textActive },
                        }}
                    >
                        {isCollapsed ? (
                            <ChevronRightIcon fontSize="small" />
                        ) : (
                            <ChevronLeftIcon fontSize="small" />
                        )}
                    </IconButton>
                </Tooltip>
            </Box>
        </Box>
    );

    const mobileSx = {
        width: DRAWER_WIDTH,
        '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            bgcolor: SB.bg,
            borderRight: 'none',
        },
    };

    const desktopWidth = collapsed ? DRAWER_WIDTH_MINI : DRAWER_WIDTH;
    const desktopSx = {
        width: desktopWidth,
        flexShrink: 0,
        transition: 'width 0.2s ease',
        '& .MuiDrawer-paper': {
            width: desktopWidth,
            bgcolor: SB.bg,
            borderRight: 'none',
            overflow: 'hidden',
            transition: 'width 0.2s ease',
        },
    };

    return (
        <>
            {/* Mobile — temporary overlay drawer */}
            {isMobile && (
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={onClose}
                    ModalProps={{ keepMounted: true }}
                    sx={mobileSx}
                >
                    {drawerContent}
                </Drawer>
            )}

            {/* Desktop — permanent drawer, collapsible */}
            {!isMobile && (
                <Drawer variant="permanent" sx={desktopSx}>
                    {drawerContent}
                </Drawer>
            )}
        </>
    );
}
