// ---------------------------------------------------------------------------
// Circuit schematic preview.
//
// Renders a miniature, to-scale view of the saved circuit so the card shows
// what the circuit actually IS rather than a generic icon. Node positions are
// normalised into the available box, gate symbols are drawn with the real
// <GateSymbol> component, and connections are drawn as orthogonal wires.
//
// Falls back to an empty-state message when the circuit has no nodes (which
// also happens for public listings, where the API omits nodes/edges).
// ---------------------------------------------------------------------------
import { memo, useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { getGateAccent } from '../../utils/gates';
import GateSymbol from '../gates/GateSymbol';
import { gateSymbolSx } from '../gates/gateSymbolStyles';
const VIEW_W = 320;
const VIEW_H = 132;
const PAD = 18;
// Node footprint in viewBox units. Kept constant (rather than scaled to the
// real 168px node) so a 3-gate and a 60-gate circuit both stay legible.
const NODE_W = 26;
const NODE_H = 18;

/** Scale a circuit's node positions to fit the preview box. */
const projectNodes = (nodes) => {
  const xs = nodes.map((n) => Number(n.position?.x) || 0);
  const ys = nodes.map((n) => Number(n.position?.y) || 0);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);

  // Guard against a single node / all nodes stacked at one point.
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;
  const usableW = VIEW_W - PAD * 2 - NODE_W;
  const usableH = VIEW_H - PAD * 2 - NODE_H;

  // Uniform scale so the schematic is never distorted.
  const scale = Math.min(usableW / spanX, usableH / spanY, 1.6);

  // Centre the result inside the viewBox.
  const drawnW = spanX * scale;
  const drawnH = spanY * scale;
  const offsetX = (VIEW_W - drawnW - NODE_W) / 2;
  const offsetY = (VIEW_H - drawnH - NODE_H) / 2;

  const positions = new Map();
  for (const node of nodes) {
    const x = (Number(node.position?.x) || 0) - minX;
    const y = (Number(node.position?.y) || 0) - minY;
    positions.set(node.id, {
      x: offsetX + x * scale,
      y: offsetY + y * scale,
    });
  }
  return positions;
};

function CircuitPreview({ nodes, edges, emptyLabel = 'No gates yet' }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const wire = isDark ? '#475569' : '#94a3b8';

  // Only render the first N nodes so a huge circuit cannot produce a wall of
  // unreadable symbols.
  const shown = useMemo(() => (nodes || []).slice(0, 18), [nodes]);
  const positions = useMemo(() => (shown.length ? projectNodes(shown) : new Map()), [shown]);

  const wires = useMemo(() => {
    if (!edges?.length) return [];
    return edges
      .map((e) => {
        const a = positions.get(e.source);
        const b = positions.get(e.target);
        if (!a || !b) return null;
        // Orthogonal routing: out of the source, into the target.
        const x1 = a.x + NODE_W;
        const y1 = a.y + NODE_H / 2;
        const x2 = b.x;
        const y2 = b.y + NODE_H / 2;
        const midX = (x1 + x2) / 2;
        return { id: e.id, d: `M${x1} ${y1} H${midX} V${y2} H${x2}` };
      })
      .filter(Boolean)
      .slice(0, 40);
  }, [edges, positions]);

  if (!shown.length) {
    return (
      <Box
        sx={{
          height: VIEW_H,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 2,
          border: '1px dashed',
          borderColor: 'divider',
          bgcolor: isDark ? alpha('#fff', 0.02) : alpha('#0f172a', 0.015),
        }}
      >
        <Typography
          variant="caption"
          sx={{ color: 'text.disabled', fontStyle: 'italic', fontSize: '0.72rem' }}
        >
          {emptyLabel}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: isDark ? alpha('#fff', 0.02) : alpha('#0f172a', 0.015),
        // Faint dot grid, matching the editor canvas.
        backgroundImage: `radial-gradient(circle at 1px 1px, ${
          isDark ? 'rgba(148,163,184,0.16)' : 'rgba(100,116,139,0.16)'
        } 1px, transparent 0)`,
        backgroundSize: '12px 12px',
        overflow: 'hidden',
      }}
    >
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        width="100%"
        height="auto"
        style={{ display: 'block' }}
        aria-hidden="true"
      >
        {/* Wires first so symbols sit on top */}
        <g>
          {wires.map((w) => (
            <path
              key={w.id}
              d={w.d}
              fill="none"
              stroke={wire}
              strokeWidth={1.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </g>

        {/* Gate symbols */}
        {shown.map((node) => {
          const p = positions.get(node.id);
          if (!p) return null;
          const accent = getGateAccent(node.type);

          return (
            <g key={node.id} transform={`translate(${p.x} ${p.y})`}>
              {/* plate */}
              <rect
                width={NODE_W}
                height={NODE_H}
                rx={3}
                fill={isDark ? alpha(accent, 0.14) : alpha(accent, 0.08)}
                stroke={alpha(accent, 0.45)}
                strokeWidth={0.8}
              />
              {/* symbol, inset so the plate reads as a frame.
                  gateSymbolSx sets `color`, which the global
                  .lgs-gate-symbol rules consume via currentColor. */}
              <g
                style={{ ...gateSymbolSx(accent, { strokeWidth: 3.4, fillOpacity: 0.16 }) }}
                transform={`translate(3 2) scale(${(NODE_W - 6) / 64} ${(NODE_H - 4) / 40})`}
              >
                <GateSymbol type={node.type} />
              </g>
            </g>
          );
        })}
      </svg>
    </Box>
  );
}

export default memo(CircuitPreview);
