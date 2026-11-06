// ---------------------------------------------------------------------------
// A single labelled input pin.
//
// WHY THIS COMPONENT EXISTS
// -------------------------
// React Flow positions handles relative to the nearest positioned ancestor.
// The previous implementation placed handles with a percentage of the *whole
// card*, which meant:
//   * a wire could attach on top of the header text or the value badge, and
//   * the same pin index sat at a different height on every gate type.
//
// Here each pin is a real, fixed-height flex row and the <Handle> is
// absolutely positioned inside that row. Handle Y therefore always equals the
// centre of its own row, so wires line up with the label and stay aligned
// across gate types regardless of input count.
//
// Visually the pin is drawn as a terminal: a short lead line out to a square
// pad. That is the schematic convention and it makes the connection point
// unambiguous — a bare circle reads as decoration.
// ---------------------------------------------------------------------------
import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Box, Typography } from '@mui/material';
import {
  MONO_FONT,
  PIN_LEAD_LENGTH,
  PIN_ROW_HEIGHT,
  PIN_SIZE,
  SIGNAL_HIGH,
  microLabelSx,
  surfaces,
} from './gateNodeTokens';

function GatePin({ index, label, accent, isDark, signal = false }) {
  const s = surfaces(isDark);

  return (
    <Box
      sx={{
        position: 'relative',
        height: PIN_ROW_HEIGHT,
        display: 'flex',
        alignItems: 'center',
        pl: `${PIN_LEAD_LENGTH + 6}px`,
        pr: 0.5,
        minWidth: 0,
      }}
    >
      {/* Lead line from the pad to the node edge */}
      <Box
        component="span"
        sx={{
          position: 'absolute',
          left: 0,
          top: '50%',
          width: `${PIN_LEAD_LENGTH + 4}px`,
          height: '1px',
          bgcolor: s.line,
          pointerEvents: 'none',
        }}
      />

      <Handle
        type="target"
        position={Position.Left}
        id={`input-${index}`}
        style={{
          // Centre of this row — never a percentage of the whole node.
          top: PIN_ROW_HEIGHT / 2,
          left: 0,
          width: PIN_SIZE,
          height: PIN_SIZE,
          minWidth: PIN_SIZE,
          minHeight: PIN_SIZE,
          // Square pads: the schematic convention for a terminal.
          borderRadius: 1,
          border: `1.5px solid ${signal ? SIGNAL_HIGH : accent}`,
          background: signal ? SIGNAL_HIGH : isDark ? '#0b1120' : '#ffffff',
          transition: 'background .12s ease, border-color .12s ease',
        }}
      />

      <Typography
        sx={{
          ...microLabelSx,
          color: s.labelMuted,
          fontFamily: MONO_FONT,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

export default memo(GatePin);

