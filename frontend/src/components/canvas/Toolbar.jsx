import { useState, useMemo } from 'react';
import {
  Box,
  TextField,
  Button,
  IconButton,
  Tooltip,
  Divider,
  Popover,
  Typography,
  Stack,
  Chip,
  CircularProgress,
  InputAdornment,
  useMediaQuery,
  Fade,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/SearchRounded';
import DeleteIcon from '@mui/icons-material/DeleteOutlineRounded';
import StopIcon from '@mui/icons-material/StopRounded';
import PlayIcon from '@mui/icons-material/PlayArrowRounded';
import SaveIcon from '@mui/icons-material/SaveRounded';
import AddIcon from '@mui/icons-material/AddCircleOutlineRounded';
import ArrowBackIcon from '@mui/icons-material/ArrowBackRounded';
import { useNavigate } from 'react-router-dom';
import {
  GATE_CATEGORIES,
  GATE_INPUT_COUNTS,
  TOTAL_GATE_COUNT,
  gateShortLabel,
} from '../../utils/gates';
import GateSymbol from '../gates/GateSymbol';
import { gateSymbolSx } from '../gates/gateSymbolStyles';

// The palette mirrors the five most-used gates as one-click chips.
const QUICK_GATES = ['INPUT', 'OUTPUT', 'AND', 'OR', 'NOT'];

function GateCard({ gate, onAdd, accent }) {
  const inputs = GATE_INPUT_COUNTS[gate.type] ?? 0;

  return (
    <Button
      size="small"
      variant="outlined"
      color="inherit"
      onClick={() => onAdd(gate.type)}
      sx={{
        borderColor: alpha(accent, 0.3),
        textTransform: 'none',
        fontWeight: 600,
        minWidth: 0,
        justifyContent: 'flex-start',
        px: 1,
        py: 0.75,
        borderRadius: 1.5,
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: accent,
          bgcolor: alpha(accent, 0.08),
          transform: 'translateY(-1px)',
          boxShadow: `0 4px 12px ${alpha(accent, 0.2)}`,
        },
        '&:active': { transform: 'translateY(0)' },
      }}
    >
      <Box sx={{ width: 34, height: 24, mr: 1, flexShrink: 0, ...gateSymbolSx(accent) }}>
        <GateSymbol type={gate.type} />
      </Box>

      <Box sx={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
        <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.2, fontSize: '0.78rem' }}>
          {gateShortLabel(gate.type)}
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: 'text.secondary', fontSize: '0.65rem', lineHeight: 1 }}
        >
          {inputs === 0 ? 'source' : `${inputs} in`}
        </Typography>
      </Box>
    </Button>
  );
}

function Toolbar({
  circuitName,
  setCircuitName,
  onSave,
  onAddGate,
  onToggleSimulation,
  isSimulating,
  onDeleteSelected,
  onBack,
  saving = false,
  dirty = false,
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const theme = useTheme();
  const isSmDown = useMediaQuery(theme.breakpoints.down('md'));

  const handleAdd = (type) => {
    onAddGate(type);
    setAnchorEl(null);
    setSearchQuery('');
  };

  const handleBack = () => {
    if (onBack) onBack();
    else navigate('/dashboard');
  };

  // Filter across both the short label and the raw type so "mux8" and "MUX8"
  // both match.
  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return GATE_CATEGORIES;

    return GATE_CATEGORIES.map((cat) => ({
      ...cat,
      gates: cat.gates.filter(
        (g) =>
          g.type.toLowerCase().includes(q) ||
          gateShortLabel(g.type).toLowerCase().includes(q)
      ),
    })).filter((cat) => cat.gates.length > 0);
  }, [searchQuery]);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 2,
        py: 1.25,
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        boxShadow: 1,
        zIndex: 5,
        flexWrap: { xs: 'wrap', lg: 'nowrap' },
      }}
    >
      <Tooltip title="Back to dashboard">
        <IconButton size="small" onClick={handleBack} aria-label="Back to dashboard">
          <ArrowBackIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Divider orientation="vertical" flexItem sx={{ my: 0.5 }} />

      <TextField
        size="small"
        value={circuitName}
        onChange={(e) => setCircuitName(e.target.value)}
        variant="standard"
        placeholder="Circuit name"
        inputProps={{ maxLength: 100 }}
        sx={{ minWidth: { xs: 120, sm: 200 } }}
        InputProps={{ disableUnderline: false, sx: { fontWeight: 700, fontSize: '1rem' } }}
      />

      <Divider orientation="vertical" flexItem sx={{ my: 0.5 }} />

      {/* Quick add + palette trigger */}
      <Stack direction="row" spacing={1} alignItems="center" sx={{ overflowX: 'auto', py: 0.25 }}>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={(e) => setAnchorEl(e.currentTarget)}
        >
          Add Gate
        </Button>
        {!isSmDown &&
          QUICK_GATES.map((type) => (
            <Tooltip key={type} title={`Add ${type}`}>
              <Chip
                label={gateShortLabel(type)}
                size="small"
                variant="outlined"
                onClick={() => handleAdd(type)}
                sx={{ cursor: 'pointer', fontWeight: 600 }}
              />
            </Tooltip>
          ))}
      </Stack>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => {
          setAnchorEl(null);
          setSearchQuery('');
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: {
              p: 0,
              width: 400,
              maxWidth: '95vw',
              maxHeight: '75vh',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 3,
              boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
              border: '1px solid',
              borderColor: 'divider',
            },
          },
        }}
        TransitionComponent={Fade}
        transitionDuration={200}
      >
        {/* Palette header */}
        <Box sx={{ px: 2.5, pt: 2, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
            <Typography variant="subtitle1" fontWeight={800}>
              Gate Palette
            </Typography>
            <Chip
              size="small"
              label={`${TOTAL_GATE_COUNT} gates`}
              sx={{ ml: 'auto', height: 22, fontWeight: 700, bgcolor: 'action.hover' }}
            />
          </Box>
          <TextField
            fullWidth
            size="small"
            autoFocus
            placeholder="Search gates…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Palette body */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            px: 2,
            py: 1.5,
            '&::-webkit-scrollbar': { width: 6 },
            '&::-webkit-scrollbar-thumb': { bgcolor: 'text.disabled', borderRadius: 3 },
          }}
        >
          <Stack spacing={2}>
            {filteredCategories.map((cat) => (
              <Box key={cat.label}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      bgcolor: cat.color,
                      boxShadow: `0 0 8px ${alpha(cat.color, 0.4)}`,
                    }}
                  />
                  <Typography
                    variant="overline"
                    sx={{
                      fontWeight: 700,
                      color: 'text.secondary',
                      fontSize: '0.7rem',
                      letterSpacing: '0.08em',
                    }}
                  >
                    {cat.label}
                  </Typography>
                  <Chip
                    size="small"
                    label={cat.gates.length}
                    sx={{ height: 18, fontSize: 10, fontWeight: 700, ml: 'auto', bgcolor: 'action.hover' }}
                  />
                </Box>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(124px, 1fr))',
                    gap: 0.75,
                  }}
                >
                  {cat.gates.map((g) => (
                    <GateCard key={g.type} gate={g} onAdd={handleAdd} accent={cat.color} />
                  ))}
                </Box>
              </Box>
            ))}
          </Stack>

          {filteredCategories.length === 0 && (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No gates match &ldquo;{searchQuery}&rdquo;
              </Typography>
            </Box>
          )}
        </Box>
      </Popover>

      {/* Right actions */}
      <Box sx={{ ml: 'auto', display: 'flex', gap: 1, alignItems: 'center' }}>
        {dirty && (
          <Chip
            size="small"
            color="warning"
            variant="outlined"
            label="Unsaved"
            sx={{ fontWeight: 700, display: { xs: 'none', sm: 'inline-flex' } }}
          />
        )}

        <Tooltip title="Delete selected (Del)">
          <span>
            <IconButton size="small" color="error" onClick={onDeleteSelected} aria-label="Delete selected">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>

        <Button
          variant="contained"
          size="small"
          color={isSimulating ? 'error' : 'success'}
          startIcon={isSimulating ? <StopIcon /> : <PlayIcon />}
          onClick={onToggleSimulation}
        >
          {isSimulating ? 'Stop' : 'Simulate'}
        </Button>

        <Button
          variant="contained"
          size="small"
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
          onClick={onSave}
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </Box>
    </Box>
  );
}

export default Toolbar;
