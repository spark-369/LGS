import { memo, useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Box, Typography, Switch, Chip } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';

// Base accent color per gate type; light/dark surfaces are derived from it.
const GATE_ACCENT = {
  INPUT: '#16a34a',
  OUTPUT: '#ef4444',
  AND: '#2563eb',
  OR: '#9333ea',
  NOT: '#f59e0b',
  NAND: '#2563eb',
  NOR: '#9333ea',
  XOR: '#ec4899',
  XNOR: '#ec4899',
  BUFFER: '#0891b2',
  TRISTATE: '#0891b2',
  AND3: '#2563eb',
  OR3: '#9333ea',
  NOR3: '#9333ea',
  NAND3: '#2563eb',
  XOR3: '#ec4899',
  XNOR3: '#ec4899',
  AND4: '#2563eb',
  OR4: '#9333ea',
  NOR4: '#9333ea',
  NAND4: '#2563eb',
  XOR4: '#ec4899',
  XNOR4: '#ec4899',
  MUX2: '#0ea5e9',
  MUX4: '#0ea5e9',
  MUX8: '#0ea5e9',
  AOI21: '#d946ef',
  OAI21: '#d946ef',
  AOI22: '#d946ef',
  OAI22: '#d946ef',
  AOI31: '#d946ef',
  OAI31: '#d946ef',
  AOI33: '#d946ef',
  OAI33: '#d946ef',
  AOI32: '#d946ef',
  OAI32: '#d946ef',
  AND5: '#2563eb',
  OR5: '#9333ea',
  NAND5: '#2563eb',
  NOR5: '#9333ea',
  XOR5: '#ec4899',
  XNOR5: '#ec4899',
  MAJ3: '#14b8a6',
  MAJ4: '#14b8a6',
  MAJ5: '#14b8a6',
  EQ2: '#f97316',
  EQ3: '#f97316',
};

function LogicGateNode({ data, selected }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const accent = GATE_ACCENT[data.type] || GATE_ACCENT.AND;

  const handleToggle = useCallback(() => {
    if (data.onToggle) {
      data.onToggle(data.id, !data.value);
    }
  }, [data]);

  const isInput = data.type === 'INPUT';
  const isOutput = data.type === 'OUTPUT';
  const isHigh = Boolean(data.value);

  // INPUT nodes are signal sources: no left target handles, one right source
  // handle. OUTPUT nodes are sinks: target handle(s) only, no source handle.
  const inputHandles = isInput ? 0 : Math.max(1, Number(data.inputCount) || 1);
  const outputHandles = isInput ? 1 : isOutput ? 0 : 1;

  const bg = isDark ? alpha(accent, 0.18) : alpha(accent, 0.1);
  const textColor = isDark ? theme.palette.text.primary : accent;

  return (
    <Box
      sx={{
        minWidth: 132,
        borderRadius: 3,
        border: '2px solid',
        borderColor: selected ? accent : alpha(accent, 0.45),
        backgroundColor: isDark ? theme.palette.background.paper : '#fff',
        boxShadow: selected
          ? `0 0 0 3px ${alpha(accent, 0.4)}, 0 10px 26px ${alpha(accent, 0.28)}`
          : `0 4px 14px ${alpha('#000', isDark ? 0.45 : 0.08)}`,
        transition: 'box-shadow .15s ease, transform .15s ease, border-color .15s ease',
        overflow: 'hidden',
      }}
    >
      {/* Header strip */}
      <Box
        sx={{
          px: 1.25,
          py: 0.75,
          bgcolor: bg,
          backgroundImage: `linear-gradient(135deg, ${alpha(accent, isDark ? 0.28 : 0.16)}, ${alpha(accent, 0.04)})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          borderBottom: '1px solid',
          borderColor: alpha(accent, 0.25),
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
          <Box
            sx={{
              width: 18,
              height: 18,
              borderRadius: 0.75,
              bgcolor: accent,
              flexShrink: 0,
              boxShadow: `0 0 0 2px ${alpha(accent, 0.25)}`,
            }}
          />
          <Typography
            variant="subtitle2"
            fontWeight={800}
            noWrap
            sx={{ color: textColor, letterSpacing: '0.02em' }}
          >
            {data.label || data.type}
          </Typography>
        </Box>
        {isInput && (
          <Switch
            className="nodrag"
            size="small"
            checked={isHigh}
            onChange={handleToggle}
            onClick={(e) => e.stopPropagation()}
            color="success"
            sx={{ ml: -0.5 }}
          />
        )}
        {isOutput && (
          <Box
            sx={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              bgcolor: isHigh ? '#22c55e' : theme.palette.action.disabled,
              boxShadow: isHigh ? '0 0 10px #22c55e' : 'none',
              transition: 'all .15s ease',
            }}
          />
        )}
      </Box>

      {/* Value badge */}
      {data.value !== undefined && (
        <Box sx={{ px: 1.25, py: 0.75, display: 'flex', justifyContent: 'center' }}>
          <Chip
            size="small"
            label={isHigh ? '1 · HIGH' : '0 · LOW'}
            sx={{
              height: 20,
              fontWeight: 700,
              fontSize: 11,
              color: isHigh ? '#166534' : theme.palette.text.secondary,
              bgcolor: isHigh
                ? alpha('#22c55e', isDark ? 0.28 : 0.2)
                : theme.palette.action.hover,
            }}
          />
        </Box>
      )}

      {Array.from({ length: inputHandles }).map((_, i) => (
        <Handle
          key={`in-${i}`}
          type="target"
          position={Position.Left}
          id={`input-${i}`}
          style={{
            top: `${((i + 1) / (inputHandles + 1)) * 100}%`,
            background: accent,
            width: 11,
            height: 11,
          }}
        />
      ))}

      {Array.from({ length: outputHandles }).map((_, i) => (
        <Handle
          key={`out-${i}`}
          type="source"
          position={Position.Right}
          id={`output-${i}`}
          style={{
            top: `${((i + 1) / (outputHandles + 1)) * 100}%`,
            background: accent,
            width: 11,
            height: 11,
          }}
        />
      ))}
    </Box>
  );
}

export default memo(LogicGateNode);
