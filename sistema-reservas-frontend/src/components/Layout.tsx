import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import {
    Box,
    AppBar,
    Toolbar,
    IconButton,
    Typography,
    Avatar,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Divider,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import Sidebar, { DRAWER_WIDTH, DRAWER_WIDTH_MINI } from './Sidebar';
import { useAuth } from '../hooks/useAuth';

export default function Layout() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [mobileOpen, setMobileOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [isNavCollapsed, setIsNavCollapsed] = useState<boolean>(
        () => localStorage.getItem('nav_collapsed') === 'true',
    );
    const { user, logout } = useAuth();

    const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) =>
        setAnchorEl(event.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);

    const handleToggleCollapse = () => {
        setIsNavCollapsed((prev) => {
            const next = !prev;
            localStorage.setItem('nav_collapsed', String(next));
            return next;
        });
    };

    const handleLogout = () => {
        handleMenuClose();
        logout();
    };

    const initials = user?.nombre
        ? user.nombre
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)
        : '??';

    // Desktop drawer width changes when collapsed; mobile uses overlay (no reserved space)
    const desktopDrawerWidth = isNavCollapsed ? DRAWER_WIDTH_MINI : DRAWER_WIDTH;

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar
                mobileOpen={mobileOpen}
                onClose={handleDrawerToggle}
                isMobile={isMobile}
                isCollapsed={isNavCollapsed}
                onToggleCollapse={handleToggleCollapse}
            />

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    width: { md: `calc(100% - ${desktopDrawerWidth}px)` },
                    display: 'flex',
                    flexDirection: 'column',
                    minWidth: 0,
                    transition: 'width 0.2s ease',
                }}
            >
                <AppBar position="sticky" color="inherit">
                    <Toolbar sx={{ minHeight: { xs: 56, sm: 60 }, px: { xs: 2, sm: 3 } }}>
                        {isMobile && (
                            <IconButton
                                edge="start"
                                onClick={handleDrawerToggle}
                                sx={{ mr: 2, color: 'text.secondary' }}
                            >
                                <MenuIcon />
                            </IconButton>
                        )}

                        <Box sx={{ flexGrow: 1 }} />

                        {/* User profile area */}
                        <Box
                            onClick={handleMenuOpen}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.25,
                                cursor: 'pointer',
                                borderRadius: 2,
                                px: 1,
                                py: 0.5,
                                transition: 'background 0.15s',
                                '&:hover': { bgcolor: 'action.hover' },
                            }}
                        >
                            <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                                <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.3 }}>
                                    {user?.nombre}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1 }}>
                                    {user?.rol_code}
                                </Typography>
                            </Box>
                            <Avatar
                                sx={{
                                    bgcolor: 'primary.main',
                                    width: 34,
                                    height: 34,
                                    fontSize: 13,
                                    fontWeight: 700,
                                    border: '2px solid',
                                    borderColor: 'primary.light',
                                }}
                            >
                                {initials}
                            </Avatar>
                        </Box>

                        <Menu
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl)}
                            onClose={handleMenuClose}
                            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                            slotProps={{
                                paper: { sx: { mt: 0.5, minWidth: 200 } },
                            }}
                        >
                            <MenuItem disabled sx={{ opacity: '1 !important', py: 1.5 }}>
                                <ListItemIcon>
                                    <PersonIcon fontSize="small" color="primary" />
                                </ListItemIcon>
                                <ListItemText
                                    primary={user?.nombre}
                                    secondary={user?.username}
                                    primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
                                    secondaryTypographyProps={{ fontSize: '0.78rem' }}
                                />
                            </MenuItem>
                            <Divider />
                            <MenuItem onClick={handleLogout} sx={{ py: 1.25 }}>
                                <ListItemIcon>
                                    <LogoutIcon fontSize="small" color="error" />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Cerrar sesión"
                                    primaryTypographyProps={{ color: 'error', fontWeight: 500, fontSize: '0.875rem' }}
                                />
                            </MenuItem>
                        </Menu>
                    </Toolbar>
                </AppBar>

                <Box sx={{ p: { xs: 2, sm: 3 }, flexGrow: 1 }}>
                    <Outlet />
                </Box>
            </Box>
        </Box>
    );
}
