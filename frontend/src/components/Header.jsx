import { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Button,
  Box,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Tooltip,
  IconButton,
  useTheme,
} from '@mui/material';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import PublicRoundedIcon from '@mui/icons-material/PublicRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';

function stringToColor(string = '') {
  let hash = 0;
  for (let i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }
  const palette = ['#4f46e5', '#0ea5e9', '#16a34a', '#f59e0b', '#ec4899', '#8b5cf6'];
  return palette[Math.abs(hash) % palette.length];
}

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const open = Boolean(anchorEl);

  const closeMenuThen = (action) => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setAnchorEl(null);
    if (action) setTimeout(action, 0);
  };

  const handleLogout = () => {
    closeMenuThen(() => {
      logout();
      navigate('/login');
    });
  };

  const initial = (user?.name || user?.email || 'U').charAt(0).toUpperCase();

  const navItems = [
    { label: 'Dashboard', to: '/dashboard', icon: <DashboardRoundedIcon fontSize="small" /> },
    { label: 'Public', to: '/public', icon: <PublicRoundedIcon fontSize="small" /> },
  ];

  const isActive = (to) =>
    location.pathname === to ||
    (to !== '/dashboard' && location.pathname.startsWith(to));

  return (
    <AppBar position="sticky">
      <Toolbar sx={{ justifyContent: 'space-between', minHeight: { xs: 60, sm: 64 } }}>
        <Box
          component={RouterLink}
          to="/dashboard"
          sx={{ textDecoration: 'none', display: 'flex' }}
        >
          <Logo size="small" />
        </Box>

        {/* Desktop nav */}
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            gap: 0.5,
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          {navItems.map((item) => {
            const active = isActive(item.to);
            return (
              <Button
                key={item.to}
                component={RouterLink}
                to={item.to}
                startIcon={item.icon}
                color="inherit"
                sx={{
                  color: active ? 'primary.main' : 'text.secondary',
                  fontWeight: active ? 700 : 600,
                  borderRadius: 2,
                  px: 1.75,
                  bgcolor: active ? 'action.selected' : 'transparent',
                  '&:hover': { bgcolor: 'action.hover', color: 'text.primary' },
                }}
              >
                {item.label}
              </Button>
            );
          })}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <ThemeToggle />

          {/* Desktop account */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
            <Tooltip title="Account">
              <Avatar
                onClick={(e) => setAnchorEl(e.currentTarget)}
                sx={{
                  width: 38,
                  height: 38,
                  cursor: 'pointer',
                  bgcolor: stringToColor(user?.name || user?.email),
                  fontWeight: 700,
                  fontSize: '1rem',
                  border: '2px solid',
                  borderColor: 'background.paper',
                  boxShadow: 2,
                }}
              >
                {initial}
              </Avatar>
            </Tooltip>
          </Box>

          {/* Mobile menu button */}
          <IconButton
            sx={{ display: { md: 'none' } }}
            onClick={() => setMobileOpen((v) => !v)}
            color="inherit"
            aria-label="Menu"
          >
            {mobileOpen ? <CloseRoundedIcon /> : <MenuRoundedIcon />}
          </IconButton>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          slotProps={{ paper: { sx: { minWidth: 220 } } }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle2" noWrap fontWeight={700}>
              {user?.name || 'User'}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap component="div">
              {user?.email}
            </Typography>
          </Box>
          <Divider />
          <MenuItem onClick={() => closeMenuThen(() => navigate('/dashboard'))}>
            <ListItemIcon>
              <DashboardRoundedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Dashboard</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => closeMenuThen(() => navigate('/public'))}>
            <ListItemIcon>
              <PublicRoundedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Public Circuits</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <LogoutRoundedIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Logout</ListItemText>
          </MenuItem>
        </Menu>
      </Toolbar>

      {/* Mobile drawer */}
      {mobileOpen && (
        <Box
          sx={{
            display: { md: 'none' },
            borderTop: '1px solid',
            borderColor: 'divider',
            p: 1.5,
            bgcolor: 'background.paper',
          }}
        >
          {navItems.map((item) => {
            const active = isActive(item.to);
            return (
              <Button
                key={item.to}
                fullWidth
                component={RouterLink}
                to={item.to}
                startIcon={item.icon}
                onClick={() => setMobileOpen(false)}
                color="inherit"
                sx={{
                  justifyContent: 'flex-start',
                  color: active ? 'primary.main' : 'text.primary',
                  fontWeight: active ? 700 : 600,
                  borderRadius: 2,
                  py: 1,
                  bgcolor: active ? 'action.selected' : 'transparent',
                }}
              >
                {item.label}
              </Button>
            );
          })}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1, py: 1.5 }}>
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: stringToColor(user?.name || user?.email),
                fontWeight: 700,
              }}
            >
              {initial}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="subtitle2" noWrap fontWeight={700}>
                {user?.name || 'User'}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap display="block">
                {user?.email}
              </Typography>
            </Box>
            <Button
              color="error"
              startIcon={<LogoutRoundedIcon />}
              onClick={() => {
                setMobileOpen(false);
                handleLogout();
              }}
            >
              Logout
            </Button>
          </Box>
          <Box sx={{ height: 'env(safe-area-inset-bottom)' }} />
        </Box>
      )}
    </AppBar>
  );
}

export default Header;
