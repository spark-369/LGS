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
  useMediaQuery,
  InputAdornment,
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

const GATE_CATEGORIES = [
  {
    label: 'Input / Output',
    color: '#16a34a',
    gates: [
      { label: 'Input', type: 'INPUT', icon: '📥', inputs: 0 },
      { label: 'Output', type: 'OUTPUT', icon: '📤', inputs: 1 },
    ],
  },
  {
    label: 'Basic Gates',
    color: '#2563eb',
    gates: [
      { label: 'AND', type: 'AND', icon: '&', inputs: 2 },
      { label: 'OR', type: 'OR', icon: '≥1', inputs: 2 },
      { label: 'NOT', type: 'NOT', icon: '!', inputs: 1 },
      { label: 'Buffer', type: 'BUFFER', icon: '=', inputs: 1 },
    ],
  },
  {
    label: 'Universal Gates',
    color: '#7c3aed',
    gates: [
      { label: 'NAND', type: 'NAND', icon: '↑&', inputs: 2 },
      { label: 'NOR', type: 'NOR', icon: '↓≥1', inputs: 2 },
    ],
  },
  {
    label: 'Exclusive Gates',
    color: '#db2777',
    gates: [
      { label: 'XOR', type: 'XOR', icon: '⊕', inputs: 2 },
      { label: 'XNOR', type: 'XNOR', icon: '=⊕', inputs: 2 },
    ],
  },
  {
    label: '3-Input Gates',
    color: '#2563eb',
    gates: [
      { label: 'AND3', type: 'AND3', icon: '&3', inputs: 3 },
      { label: 'OR3', type: 'OR3', icon: '≥1×3', inputs: 3 },
      { label: 'NAND3', type: 'NAND3', icon: '↑&3', inputs: 3 },
      { label: 'NOR3', type: 'NOR3', icon: '↓≥1×3', inputs: 3 },
      { label: 'XOR3', type: 'XOR3', icon: '⊕3', inputs: 3 },
      { label: 'XNOR3', type: 'XNOR3', icon: '=⊕3', inputs: 3 },
    ],
  },
  {
    label: '4-Input Gates',
    color: '#2563eb',
    gates: [
      { label: 'AND4', type: 'AND4', icon: '&4', inputs: 4 },
      { label: 'OR4', type: 'OR4', icon: '≥1×4', inputs: 4 },
      { label: 'NAND4', type: 'NAND4', icon: '↑&4', inputs: 4 },
      { label: 'NOR4', type: 'NOR4', icon: '↓≥1×4', inputs: 4 },
      { label: 'XOR4', type: 'XOR4', icon: '⊕4', inputs: 4 },
      { label: 'XNOR4', type: 'XNOR4', icon: '=⊕4', inputs: 4 },
    ],
  },
  {
    label: '5-Input Gates',
    color: '#1d4ed8',
    gates: [
      { label: 'AND5', type: 'AND5', icon: '&5', inputs: 5 },
      { label: 'OR5', type: 'OR5', icon: '≥1×5', inputs: 5 },
      { label: 'NAND5', type: 'NAND5', icon: '↑&5', inputs: 5 },
      { label: 'NOR5', type: 'NOR5', icon: '↓≥1×5', inputs: 5 },
      { label: 'XOR5', type: 'XOR5', icon: '⊕5', inputs: 5 },
      { label: 'XNOR5', type: 'XNOR5', icon: '=⊕5', inputs: 5 },
    ],
  },
  {
    label: 'Multiplexers',
    color: '#0891b2',
    gates: [
      { label: 'MUX2', type: 'MUX2', icon: 'M2', inputs: 3 },
      { label: 'MUX4', type: 'MUX4', icon: 'M4', inputs: 6 },
      { label: 'MUX8', type: 'MUX8', icon: 'M8', inputs: 10 },
    ],
  },
  {
    label: 'Arithmetic',
    color: '#059669',
    gates: [
      { label: 'Maj3', type: 'MAJ3', icon: 'Maj', inputs: 3 },
      { label: 'Maj4', type: 'MAJ4', icon: 'Maj4', inputs: 4 },
      { label: 'Maj5', type: 'MAJ5', icon: 'Maj5', inputs: 5 },
      { label: 'EQ2', type: 'EQ2', icon: '=2', inputs: 2 },
      { label: 'EQ3', type: 'EQ3', icon: '=3', inputs: 3 },
    ],
  },
  {
    label: 'Complex',
    color: '#c026d3',
    gates: [
      { label: 'AOI21', type: 'AOI21', icon: 'AOI', inputs: 3 },
      { label: 'OAI21', type: 'OAI21', icon: 'OAI', inputs: 3 },
      { label: 'AOI22', type: 'AOI22', icon: 'AOI2', inputs: 5 },
      { label: 'OAI22', type: 'OAI22', icon: 'OAI2', inputs: 5 },
      { label: 'AOI31', type: 'AOI31', icon: 'AOI3', inputs: 4 },
      { label: 'OAI31', type: 'OAI31', icon: 'OAI3', inputs: 4 },
      { label: 'AOI33', type: 'AOI33', icon: 'AOI3', inputs: 6 },
      { label: 'OAI33', type: 'OAI33', icon: 'OAI3', inputs: 6 },
      { label: 'AOI32', type: 'AOI32', icon: 'AOI32', inputs: 5 },
      { label: 'OAI32', type: 'OAI32', icon: 'OAI32', inputs: 5 },
    ],
  },
  {
    label: 'Special',
    color: '#d97706',
    gates: [{ label: 'Tri-state', type: 'TRISTATE', icon: '⊢', inputs: 2 }],
  },
];

const QUICK_GATES = [
  { label: 'Input', type: 'INPUT' },
  { label: 'Output', type: 'OUTPUT' },
  { label: 'AND', type: 'AND' },
  { label: 'OR', type: 'OR' },
  { label: 'NOT', type: 'NOT' },
];

function GateCard({ gate, onAdd, accent }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

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
        px: 1.25,
        py: 0.75,
        borderRadius: 1.5,
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: accent,
          bgcolor: alpha(accent, 0.08),
          transform: 'translateY(-1px)',
          boxShadow: `0 4px 12px ${alpha(accent, 0.2)}`,
        },
        '&:active': {
          transform: 'translateY(0)',
        },
      }}
    >
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 28,
          height: 28,
          borderRadius: 1,
          bgcolor: alpha(accent, 0.12),
          color: accent,
          fontSize: 12,
          fontWeight: 800,
          mr: 1,
          flexShrink: 0,
        }}
      >
        {gate.icon}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 700,
            lineHeight: 1.2,
            fontSize: '0.8rem',
          }}
        >
          {gate.label}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            fontSize: '0.65rem',
            lineHeight: 1,
          }}
        >
          {gate.inputs} in
        </Typography>
      </Box>
      <Chip
        size="small"
        label={gate.inputs}
        sx={{
          height: 18,
          fontSize: 10,
          fontWeight: 700,
          bgcolor: alpha(accent, 0.1),
          color: accent,
          '& .MuiChip-label': { px: 0.75 },
        }}
      />
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

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return GATE_CATEGORIES;

    const q = searchQuery.toLowerCase().trim();
    return GATE_CATEGORIES.map((cat) => ({
      ...cat,
      gates: cat.gates.filter(
        (g) =>
          g.label.toLowerCase().includes(q) ||
          g.type.toLowerCase().includes(q)
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
      }}
    >
      <Tooltip title="Back to dashboard">
        <IconButton size="small" onClick={() => navigate('/dashboard')}>
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
        sx={{ minWidth: { xs: 120, sm: 200 } }}
        InputProps={{
          disableUnderline: false,
          sx: { fontWeight: 700, fontSize: '1rem' },
        }}
      />

      <Divider orientation="vertical" flexItem sx={{ my: 0.5 }} />

      {/* Quick add buttons + palette */}
      <Stack direction="row" spacing={1} alignItems="center" sx={{ overflowX: 'auto' }}>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={(e) => setAnchorEl(e.currentTarget)}
        >
          Add Gate
        </Button>
        {!isSmDown &&
          QUICK_GATES.map((g) => (
            <Tooltip key={g.type} title={`Add ${g.label}`}>
              <Chip
                label={g.label}
                size="small"
                variant="outlined"
                onClick={() => handleAdd(g.type)}
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
              width: 380,
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
        {/* Header */}
        <Box
          sx={{
            px: 2.5,
            pt: 2,
            pb: 1.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: (theme) =>
              theme.palette.mode === 'dark'
                ? alpha(theme.palette.background.paper, 0.8)
                : theme.palette.grey[50],
            backdropFilter: 'blur(8px)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography variant="subtitle1" fontWeight={800} sx={{ letterSpacing: '-0.01em' }}>
              Gate Library
            </Typography>
            <Chip
              size="small"
              label={`${GATE_CATEGORIES.reduce((sum, c) => sum + c.gates.length, 0)} gates`}
              sx={{
                height: 22,
                fontSize: 11,
                fontWeight: 700,
                bgcolor: 'action.selected',
              }}
            />
          </Box>
          <TextField
            size="small"
            fullWidth
            placeholder="Search gates…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                </InputAdornment>
              ),
              sx: {
                borderRadius: 2,
                bgcolor: 'background.default',
                fontSize: '0.9rem',
                '& .MuiInput-input': { py: 1 },
              },
            }}
          />
        </Box>

        {/* Scrollable gate list */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            px: 2,
            py: 1.5,
            '&::-webkit-scrollbar': { width: 6 },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: 'text.disabled',
              borderRadius: 3,
            },
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
                    sx={{
                      height: 18,
                      fontSize: 10,
                      fontWeight: 700,
                      ml: 'auto',
                      bgcolor: 'action.hover',
                    }}
                  />
                </Box>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                    gap: 0.75,
                  }}
                >
                  {cat.gates.map((g) => (
                    <GateCard
                      key={g.type}
                      gate={g}
                      onAdd={handleAdd}
                      accent={cat.color}
                    />
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
        <Tooltip title="Delete selected (Del)">
          <IconButton size="small" color="error" onClick={onDeleteSelected}>
            <DeleteIcon fontSize="small" />
          </IconButton>
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
          startIcon={<SaveIcon />}
          onClick={onSave}
        >
          Save
        </Button>
      </Box>
    </Box>
  );
}

export default Toolbar;
