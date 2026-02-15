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
    useMediaQuery,
    useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import Sidebar, { DRAWER_WIDTH } from './Sidebar';
import { useAuth } from '../hooks/useAuth';

export default function Layout() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [mobileOpen, setMobileOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const { user, logout } = useAuth();

    const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) =>
        setAnchorEl(event.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);

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

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar
                mobileOpen={mobileOpen}
                onClose={handleDrawerToggle}
                isMobile={isMobile}
            />

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <AppBar
                    position="sticky"
                    color="inherit"
                    sx={{
                        width: { md: `calc(100% )` },
                        bgcolor: 'background.paper',
                    }}
                >
                    <Toolbar>
                        {isMobile && (
                            <IconButton
                                edge="start"
                                onClick={handleDrawerToggle}
                                sx={{ mr: 2 }}
                            >
                                <MenuIcon />
                            </IconButton>
                        )}

                        <Box sx={{ flexGrow: 1 }} />

                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                cursor: 'pointer',
                            }}
                            onClick={handleMenuOpen}
                        >
                            <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                                <Typography variant="body2" fontWeight={600}>
                                    {user?.nombre}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {user?.rol_code}
                                </Typography>
                            </Box>
                            <Avatar
                                sx={{
                                    bgcolor: 'primary.main',
                                    width: 36,
                                    height: 36,
                                    fontSize: 14,
                                    fontWeight: 700,
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
                        >
                            <MenuItem disabled>
                                <ListItemIcon>
                                    <PersonIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText
                                    primary={user?.nombre}
                                    secondary={user?.username}
                                />
                            </MenuItem>
                            <MenuItem onClick={handleLogout}>
                                <ListItemIcon>
                                    <LogoutIcon fontSize="small" color="error" />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Cerrar sesión"
                                    primaryTypographyProps={{ color: 'error' }}
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
