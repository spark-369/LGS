import { memo, useCallback, useMemo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Box, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { buildPinLabels, getGateAccent, GATE_INPUT_COUNTS } from '../../utils/gates';
import GateSymbol from './GateSymbol';
import GatePin from './GatePin';
import { gateSymbolSx } from './gateSymbolStyles';
import {
  HEADER_HEIGHT,
  INNER_RADIUS,
  MONO_FONT,
  NODE_RADIUS,
  NODE_WIDTH,
  PIN_LEAD_LENGTH,
  PIN_ROW_HEIGHT,
  PIN_SIZE,
  SIGNAL_HIGH,
  SIGNAL_HIGH_TEXT,
  microLabelSx,
  readoutSx,
  surfaces,
} from './gateNodeTokens';

/**
 * Canvas node for every gate type — styled as an instrument panel.
 *
 * Layout: header (ref-des + state) -> symbol flanked by labelled pin rows.
 * The pin rows are real DOM rows so each <Handle> is centred on its own row
 * (see GatePin) rather than positioned as a percentage of the whole node,
 * which is what keeps wires attached to the correct, labelled pin.
 *
 * Deliberately flat: hairline borders, 4px radius, monospace readouts. No
 * gradients, no pill chips and no toggle switches — those read as consumer UI
 * on a schematic canvas.
 */
function LogicGateNode({ data, selected }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const s = surfaces(isDark);

  const type = data.type;
  const accent = getGateAccent(type);

  const isInput = type === 'INPUT';
  const isOutput = type === 'OUTPUT';
  const isHigh = Boolean(data.value);

  const inputCount = isInput ? 0 : Number(data.inputCount) || GATE_INPUT_COUNTS[type] || 1;
  const labels = useMemo(() => buildPinLabels(type), [type]);

  const handleToggle = useCallback(
    (e) => {
      e.stopPropagation();
      data.onToggle?.(data.id, !data.value);
    },
    [data]
  );

  // Height of the pin column — drives the symbol's vertical extent so the
  // symbol is optically centred against its pins.
  const bodyHeight = Math.max(inputCount, 1) * PIN_ROW_HEIGHT;

  /** Shared styling for the header state readout (both variants). */
  const readoutSxBase = {
    display: 'flex',
    alignItems: 'center',
    gap: 0.4,
    px: 0.5,
    height: 15,
    borderRadius: '2px',
    border: '1px solid',
    transition: 'all .12s ease',
  };

  return (
    <Box
      sx={{
        width: NODE_WIDTH,
        borderRadius: NODE_RADIUS,
        border: '1px solid',
        borderColor: selected ? accent : s.lineStrong,
        backgroundColor: s.surface,
        // Selection is communicated by the ring, not by thickening the border,
        // so the node never shifts size when selected.
        boxShadow: selected
          ? `0 0 0 2px ${alpha(accent, 0.45)}, 0 6px 18px ${alpha('#000', isDark ? 0.55 : 0.12)}`
          : `0 1px 3px ${alpha('#000', isDark ? 0.5 : 0.1)}`,
        transition: 'box-shadow .12s ease, border-color .12s ease',
        // Handles sit outside the border box, so never clip them.
        overflow: 'visible',
      }}
    >
      {/* Header: reference designator + live state */}
      <Box
        sx={{
          height: HEADER_HEIGHT,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 0.5,
          pl: 1,
          pr: 0.75,
          borderBottom: '1px solid',
          borderColor: s.line,
          // Family colour as a thin accent rule, not a filled gradient block.
          backgroundImage: `linear-gradient(90deg, ${alpha(accent, isDark ? 0.2 : 0.12)}, transparent 72%)`,
          borderTopLeftRadius: INNER_RADIUS,
          borderTopRightRadius: INNER_RADIUS,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, minWidth: 0 }}>
          <Box sx={{ width: 6, height: 6, borderRadius: '1px', bgcolor: accent, flexShrink: 0 }} />
          <Typography
            sx={{
              ...microLabelSx,
              fontSize: 10,
              color: isDark ? theme.palette.text.primary : '#0f172a',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {data.label || type}
          </Typography>
        </Box>

        {/* State readout. For INPUT this is the interactive control; for every
            other gate it is a passive level indicator. */}
        {isInput ? (
          <Box
            className="nodrag"
            role="switch"
            aria-checked={isHigh}
            aria-label={`${data.label || type} input value`}
            tabIndex={0}
            onClick={handleToggle}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleToggle(e);
              }
            }}
            sx={{
              ...readoutSxBase,
              cursor: 'pointer',
              borderColor: isHigh ? SIGNAL_HIGH : s.line,
              bgcolor: isHigh ? s.highBg : s.inset,
              '&:hover': { borderColor: isHigh ? SIGNAL_HIGH : s.lineStrong },
              '&:focus-visible': { outline: `2px solid ${alpha(accent, 0.5)}`, outlineOffset: 1 },
            }}
          >
            <Box
              sx={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                bgcolor: isHigh ? SIGNAL_HIGH : s.labelMuted,
                boxShadow: isHigh ? `0 0 5px ${SIGNAL_HIGH}` : 'none',
                transition: 'all .12s ease',
              }}
            />
            <Typography sx={{ ...readoutSx, fontSize: 9, color: isHigh ? SIGNAL_HIGH_TEXT : s.label }}>
              {isHigh ? '1' : '0'}
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              ...readoutSxBase,
              borderColor: isHigh ? alpha(SIGNAL_HIGH, 0.5) : s.line,
              bgcolor: isHigh ? s.highBg : s.inset,
            }}
          >
            <Box
              sx={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                bgcolor: isHigh ? SIGNAL_HIGH : s.labelMuted,
                boxShadow: isHigh ? `0 0 5px ${SIGNAL_HIGH}` : 'none',
              }}
            />
            <Typography sx={{ ...readoutSx, fontSize: 9, color: isHigh ? SIGNAL_HIGH_TEXT : s.label }}>
              {isHigh ? '1' : '0'}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Body: pin column + gate symbol */}
      <Box sx={{ position: 'relative', display: 'flex', alignItems: 'stretch' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', flex: '0 0 auto', py: '2px' }}>
          {Array.from({ length: inputCount }).map((_, i) => (
            <GatePin
              key={`in-${i}`}
              index={i}
              label={labels.inputs[i] || `I${i}`}
              accent={accent}
              isDark={isDark}
            />
          ))}
        </Box>

        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            px: 0.5,
            py: 0.75,
          }}
        >
          <Box
            sx={{
              width: 58,
              height: Math.min(bodyHeight, 52),
              minHeight: 30,
              ...gateSymbolSx(accent, { strokeWidth: 2.2 }),
            }}
          >
            <GateSymbol type={type} />
          </Box>
        </Box>

        {/* Output terminal, centred on the symbol block */}
        {!isOutput && (
          <>
            <Box
              component="span"
              sx={{
                position: 'absolute',
                right: 0,
                top: '50%',
                width: `${PIN_LEAD_LENGTH + 4}px`,
                height: '1px',
                bgcolor: s.line,
                pointerEvents: 'none',
              }}
            />
            <Handle
              type="source"
              position={Position.Right}
              id="output-0"
              style={{
                top: '50%',
                right: 0,
                width: PIN_SIZE,
                height: PIN_SIZE,
                minWidth: PIN_SIZE,
                minHeight: PIN_SIZE,
                borderRadius: 1,
                border: `1.5px solid ${isHigh ? SIGNAL_HIGH : accent}`,
                background: isHigh ? SIGNAL_HIGH : isDark ? '#0b1120' : '#ffffff',
                transition: 'background .12s ease, border-color .12s ease',
              }}
            />
          </>
        )}
      </Box>

      {/* Footer: part number + arity, monospace */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1,
          height: 18,
          borderTop: '1px solid',
          borderColor: s.line,
          bgcolor: s.inset,
          borderBottomLeftRadius: INNER_RADIUS,
          borderBottomRightRadius: INNER_RADIUS,
        }}
      >
        <Typography sx={{ ...microLabelSx, fontSize: 8, color: s.labelMuted }}>{type}</Typography>
        <Typography sx={{ ...microLabelSx, fontSize: 8, color: s.labelMuted, fontFamily: MONO_FONT }}>
          {isOutput ? 'SINK' : isInput ? 'SRC' : `IN ${inputCount}`}
        </Typography>
      </Box>
    </Box>
  );
}

export default memo(LogicGateNode);

