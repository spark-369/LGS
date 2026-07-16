import { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Typography,
  Button,
  Grid,
  Box,
  TextField,
  Chip,
  InputAdornment,
  Stack,
  Snackbar,
  Alert,
  Paper,
  Tooltip,
  useTheme,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/SearchRounded';
import MemoryRoundedIcon from '@mui/icons-material/MemoryRounded';
import HubRoundedIcon from '@mui/icons-material/HubRounded';
import PublicRoundedIcon from '@mui/icons-material/PublicRounded';
import AccountTreeRoundedIcon from '@mui/icons-material/AccountTreeRounded';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import LoginIcon from '@mui/icons-material/LoginRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import ViewModuleRoundedIcon from '@mui/icons-material/ViewModuleRounded';
import ViewListRoundedIcon from '@mui/icons-material/ViewListRounded';
import { useNavigate, Link } from 'react-router-dom';
import { circuitAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import CircuitCard from '../components/circuit/CircuitCard';
import { SkeletonGrid } from '../components/circuit/SkeletonCard';
import EmptyState from '../components/circuit/EmptyState';

function StatCard({ icon, label, value, color }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.25,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        flex: 1,
        minWidth: 160,
        transition: 'transform .2s ease, box-shadow .2s ease',
        '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 },
      }}
    >
      <Box
        sx={{
          width: 46,
          height: 46,
          borderRadius: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: (t) => `linear-gradient(135deg, ${color}22, ${color}0a)`,
          color,
          border: '1px solid',
          borderColor: (t) => `${color}33`,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="h5" fontWeight={800} lineHeight={1.1}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      </Box>
    </Paper>
  );
}

function PublicCircuits() {
  const [circuits, setCircuits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [view, setView] = useState('grid');
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuCircuit, setMenuCircuit] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const theme = useTheme();

  const showMessage = (message, severity = 'success') =>
    setSnackbar({ open: true, message, severity });

  const fetchCircuits = async () => {
    setLoading(true);
    try {
      const { data } = await circuitAPI.getPublic();
      setCircuits(data.circuits || []);
    } catch {
      showMessage('Failed to load public circuits', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCircuits();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return circuits;
    return circuits.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.owner?.name?.toLowerCase().includes(q)
    );
  }, [circuits, search]);

  const stats = useMemo(() => ({
    total: circuits.length,
    nodes: circuits.reduce((a, c) => a + (c.nodes?.length || 0), 0),
    creators: new Set(circuits.map((c) => c.owner?._id).filter(Boolean)).size,
  }), [circuits]);

  const handleDuplicate = async (id) => {
    try {
      const { data } = await circuitAPI.duplicate(id);
      setCircuits((prev) => [data.circuit, ...prev]);
      showMessage('Circuit duplicated to your dashboard');
    } catch {
      showMessage('Failed to duplicate circuit', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await circuitAPI.delete(deleteTarget._id);
      setCircuits((prev) => prev.filter((c) => c._id !== deleteTarget._id));
      showMessage('Circuit deleted');
    } catch {
      showMessage('Failed to delete circuit', 'error');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const openMenu = (e, circuit) => {
    setMenuAnchor(e.currentTarget);
    setMenuCircuit(circuit);
  };
  const closeMenu = () => {
    setMenuAnchor(null);
    setMenuCircuit(null);
  };
  const closeMenuThen = (action) => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    closeMenu();
    if (action) setTimeout(action, 0);
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100%' }}>
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        {/* Hero */}
        <Paper
          elevation={0}
          sx={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 4,
            p: { xs: 3, md: 4 },
            mb: 4,
            color: '#fff',
            background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              width: 260,
              height: 260,
              borderRadius: '50%',
              top: -100,
              right: -60,
              background: 'rgba(255,255,255,0.12)',
            }}
          />
          <Box sx={{ position: 'relative' }}>
            <Typography variant="overline" sx={{ opacity: 0.85, fontWeight: 700 }}>
              Community
            </Typography>
            <Typography variant="h4" fontWeight={800} sx={{ mb: 0.5, letterSpacing: '-0.02em' }}>
              Public Circuits
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9, mb: 3, maxWidth: 520 }}>
              Browse and fork circuits shared by the community. Duplicate any public
              circuit to start building on top of it.
            </Typography>
            {isAuthenticated ? (
              <Button
                variant="contained"
                size="large"
                startIcon={<DashboardRoundedIcon />}
                component={Link}
                to="/dashboard"
                sx={{
                  bgcolor: '#fff',
                  color: 'primary.main',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
                }}
              >
                Go to Dashboard
              </Button>
            ) : (
              <Button
                variant="contained"
                size="large"
                startIcon={<LoginIcon />}
                component={Link}
                to="/login"
                sx={{
                  bgcolor: '#fff',
                  color: 'primary.main',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
                }}
              >
                Sign in to contribute
              </Button>
            )}
          </Box>
        </Paper>

        {/* Stats */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 4 }}>
          <StatCard icon={<PublicRoundedIcon />} label="Public circuits" value={loading ? '—' : stats.total} color="#059669" />
          <StatCard icon={<HubRoundedIcon />} label="Total gates" value={loading ? '—' : stats.nodes} color="#0ea5e9" />
          <StatCard icon={<AccountTreeRoundedIcon />} label="Creators" value={loading ? '—' : stats.creators} color="#8b5cf6" />
        </Stack>

        {/* Toolbar row */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ sm: 'center' }}
          justifyContent="space-between"
          spacing={2}
          sx={{ mb: 3 }}
        >
          <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            Explore Circuits
            {!loading && (
              <Chip size="small" label={filtered.length} sx={{ fontWeight: 700, ml: 0.5 }} />
            )}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              size="small"
              placeholder="Search circuits…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ width: { xs: '100%', sm: 320 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />
            <Tooltip title="Refresh">
              <Button
                size="small"
                variant="outlined"
                onClick={fetchCircuits}
                sx={{ minWidth: 0, px: 1.25, display: { xs: 'none', sm: 'inline-flex' } }}
                aria-label="Refresh circuits"
              >
                <RefreshRoundedIcon fontSize="small" />
              </Button>
            </Tooltip>
            <Box sx={{ display: { xs: 'none', md: 'inline-flex' }, border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
              <Button
                size="small"
                onClick={() => setView('grid')}
                color={view === 'grid' ? 'primary' : 'inherit'}
                sx={{ borderRadius: 0, minWidth: 0, px: 1.25 }}
                aria-label="Grid view"
              >
                <ViewModuleRoundedIcon fontSize="small" />
              </Button>
              <Button
                size="small"
                onClick={() => setView('list')}
                color={view === 'list' ? 'primary' : 'inherit'}
                sx={{ borderRadius: 0, minWidth: 0, px: 1.25 }}
                aria-label="List view"
              >
                <ViewListRoundedIcon fontSize="small" />
              </Button>
            </Box>
          </Stack>
        </Stack>

        {/* Grid */}
        <Grid container spacing={3}>
          {loading && <SkeletonGrid count={6} Grid={Grid} />}

          {!loading &&
            filtered.map((circuit) => (
              <Grid item xs={12} sm={6} md={view === 'list' ? 12 : 4} key={circuit._id}>
                <CircuitCard
                  circuit={circuit}
                  variant="public"
                  onOpen={(id) => navigate(`/editor/${id}`)}
                  onDuplicate={handleDuplicate}
                />
              </Grid>
            ))}
        </Grid>

        {/* Empty states */}
        {!loading && filtered.length === 0 && (
          <Grid container>
            <EmptyState
              icon={search ? <SearchIcon fontSize="large" /> : <PublicRoundedIcon fontSize="large" />}
              title={search ? 'No matching circuits' : 'No public circuits yet'}
              description={
                search
                  ? `We couldn't find anything for "${search}".`
                  : 'Be the first to share a circuit with the community.'
              }
            />
          </Grid>
        )}
      </Container>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default PublicCircuits;
