import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Container,
  Typography,
  Button,
  Grid,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  InputAdornment,
  Stack,
  Snackbar,
  Alert,
  Paper,
  Tooltip,
  Pagination,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/SearchRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import AccountTreeRoundedIcon from '@mui/icons-material/AccountTreeRounded';
import HubRoundedIcon from '@mui/icons-material/HubRounded';
import PublicRoundedIcon from '@mui/icons-material/PublicRounded';
import MemoryRoundedIcon from '@mui/icons-material/MemoryRounded';
import ViewModuleRoundedIcon from '@mui/icons-material/ViewModuleRounded';
import ViewListRoundedIcon from '@mui/icons-material/ViewListRounded';
import { useNavigate } from 'react-router-dom';
import { circuitAPI, getErrorMessage } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import ConfirmDialog from '../components/common/ConfirmDialog';
import CircuitCard from '../components/circuit/CircuitCard';
import { SkeletonGrid } from '../components/circuit/SkeletonCard';
import EmptyState from '../components/circuit/EmptyState';
import { GRADIENTS } from '../theme/theme';

const PAGE_SIZE = 12;

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

function Dashboard() {
  const [circuits, setCircuits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [createError, setCreateError] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [view, setView] = useState('grid');
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuCircuit, setMenuCircuit] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const { user } = useAuth();
  const navigate = useNavigate();

  const showMessage = useCallback(
    (message, severity = 'success') => setSnackbar({ open: true, message, severity }),
    []
  );

  // Debounce the search box so typing does not fire a request per keystroke.
  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(id);
  }, [searchInput]);

  const fetchCircuits = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const { data } = await circuitAPI.getAll({
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
      });
      setCircuits(data.circuits || []);
      setTotal(data.pagination?.total ?? (data.circuits || []).length);
    } catch (error) {
      setLoadError(getErrorMessage(error, 'Failed to load circuits'));
      setCircuits([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchCircuits();
  }, [fetchCircuits]);

  // The server already filtered and paginated the list.
  const filtered = circuits;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const stats = useMemo(
    () => ({
      total,
      nodes: circuits.reduce((acc, c) => acc + (c.nodes?.length || c.gateCount || 0), 0),
      public: circuits.filter((c) => c.isPublic).length,
    }),
    [circuits, total]
  );

  const handleCreate = async () => {
    setCreating(true);
    setCreateError('');
    try {
      const { data } = await circuitAPI.create({
        name: newName.trim() || 'Untitled Circuit',
        description: newDesc,
      });
      setCreateOpen(false);
      setNewName('');
      setNewDesc('');
      navigate(`/editor/${data.circuit._id}`);
    } catch (error) {
      setCreateError(getErrorMessage(error, 'Failed to create circuit'));
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await circuitAPI.delete(deleteTarget._id);
      showMessage('Circuit deleted');
      // Step back a page when the last item on it disappears.
      if (circuits.length === 1 && page > 1) setPage((p) => p - 1);
      else fetchCircuits();
    } catch (error) {
      showMessage(getErrorMessage(error, 'Failed to delete circuit'), 'error');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleDuplicate = async (id) => {
    try {
      await circuitAPI.duplicate(id);
      showMessage('Circuit duplicated');
      setPage(1);
      fetchCircuits();
    } catch (error) {
      showMessage(getErrorMessage(error, 'Failed to duplicate circuit'), 'error');
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

  const togglePublic = async (target) => {
    const next = !target.isPublic;
    try {
      await circuitAPI.togglePublic(target._id, next);
      setCircuits((prev) =>
        prev.map((c) => (c._id === target._id ? { ...c, isPublic: next } : c))
      );
      showMessage(next ? 'Circuit is now public' : 'Circuit is now private');
    } catch (error) {
      showMessage(getErrorMessage(error, 'Failed to update visibility'), 'error');
    }
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
            background: GRADIENTS.brandSoft,
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
              Dashboard
            </Typography>
            <Typography variant="h4" fontWeight={800} sx={{ mb: 0.5, letterSpacing: '-0.02em' }}>
              Welcome back, {user?.name?.split(' ')[0] || 'there'} 👋
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9, mb: 3, maxWidth: 520 }}>
              Manage your logic circuits, jump back into a design, or start
              something new.
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              onClick={() => setCreateOpen(true)}
              sx={{
                bgcolor: '#fff',
                color: 'primary.main',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
              }}
            >
              New Circuit
            </Button>
          </Box>
        </Paper>

        {/* Stats */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 4 }}>
          <StatCard icon={<AccountTreeRoundedIcon />} label="Total circuits" value={loading ? '—' : stats.total} color="#6366f1" />
          <StatCard icon={<HubRoundedIcon />} label="Total gates" value={loading ? '—' : stats.nodes} color="#0ea5e9" />
          <StatCard icon={<PublicRoundedIcon />} label="Public circuits" value={loading ? '—' : stats.public} color="#16a34a" />
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
            My Circuits
            {!loading && (
              <Chip size="small" label={total} sx={{ fontWeight: 700, ml: 0.5 }} />
            )}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              size="small"
              placeholder="Search circuits…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              sx={{ width: { xs: '100%', sm: 280 } }}
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

        {/* Error banner */}
        {loadError && !loading && (
          <Alert
            severity="error"
            sx={{ mb: 3 }}
            action={
              <Button color="inherit" size="small" onClick={fetchCircuits}>
                Retry
              </Button>
            }
          >
            {loadError}
          </Alert>
        )}

        {/* Grid */}
        <Grid container spacing={3}>
          {loading && <SkeletonGrid count={6} Grid={Grid} />}

          {!loading &&
            filtered.map((circuit) => (
              <Grid item xs={12} sm={6} md={view === 'list' ? 12 : 4} key={circuit._id}>
                <CircuitCard
                  circuit={circuit}
                  variant="owned"
                  onOpen={(id) => navigate(`/editor/${id}`)}
                  onDuplicate={handleDuplicate}
                  onDelete={setDeleteTarget}
                  onTogglePublic={togglePublic}
                  onMenu={openMenu}
                  menuAnchorEl={menuAnchor}
                  onMenuClose={closeMenuThen}
                  menuTarget={menuCircuit}
                />
              </Grid>
            ))}
        </Grid>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <Stack alignItems="center" sx={{ mt: 4 }}>
            <Pagination
              page={page}
              count={totalPages}
              onChange={(_, value) => setPage(value)}
              color="primary"
              shape="rounded"
              showFirstButton
              showLastButton
            />
          </Stack>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && !loadError && (
          <Grid container>
            <EmptyState
              icon={search ? <SearchIcon fontSize="large" /> : <MemoryRoundedIcon fontSize="large" />}
              title={search ? 'No matching circuits' : 'No circuits yet'}
              description={
                search
                  ? `We couldn't find anything for “${search}”.`
                  : 'Create your first logic gate circuit to get started.'
              }
              actionLabel={search ? undefined : 'Create Circuit'}
              onAction={search ? undefined : () => setCreateOpen(true)}
            />
          </Grid>
        )}
      </Container>

      {/* Create dialog */}
      <Dialog open={createOpen} onClose={() => !creating && setCreateOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Create New Circuit</DialogTitle>
        <DialogContent>
          {createError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {createError}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Circuit Name"
            placeholder="e.g. Full Adder"
            fullWidth
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            inputProps={{ maxLength: 100 }}
            sx={{ mt: 1, mb: 1 }}
          />
          <TextField
            margin="dense"
            label="Description (optional)"
            placeholder="What does this circuit do?"
            fullWidth
            multiline
            rows={3}
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            inputProps={{ maxLength: 500 }}
            helperText={`${newDesc.length}/500`}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button color="inherit" onClick={() => setCreateOpen(false)} disabled={creating}>
            Cancel
          </Button>
          <Button onClick={handleCreate} variant="contained" disabled={creating} startIcon={<AddIcon />}>
            {creating ? 'Creating…' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete circuit"
        message={`Are you sure you want to delete “${deleteTarget?.name}”? This action cannot be undone.`}
        confirmText="Delete"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => !deleting && setDeleteTarget(null)}
      />

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

export default Dashboard;
