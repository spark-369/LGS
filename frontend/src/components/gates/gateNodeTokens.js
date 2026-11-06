// ---------------------------------------------------------------------------
// Visual tokens for the canvas gate node.
//
// The node is styled as an *instrument panel*, not a card: flat surfaces,
// hairline borders, minimal corner radius, monospace technical readouts and
// uppercase micro-labels. Deliberately no gradients, no playful switches and
// no pill-shaped chips — those read as consumer UI on a schematic canvas.
// ---------------------------------------------------------------------------

/** Corner radii. Near-square: precision tooling, not a marketing tile. */
export const NODE_RADIUS = '4px';
export const INNER_RADIUS = '2px';

/** Fixed node geometry, in px. */
export const NODE_WIDTH = 178;
export const HEADER_HEIGHT = 26;
export const PIN_ROW_HEIGHT = 20;
export const PIN_SIZE = 9;
export const PIN_LEAD_LENGTH = 7;

/** Tabular monospace — keeps every numeric readout column-aligned. */
export const MONO_FONT =
  'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace';

/** Logic-level colours. Deliberately restrained; green is the only chroma. */
export const SIGNAL_HIGH = '#16a34a';
export const SIGNAL_HIGH_TEXT = '#15803d';

/**
 * Surface + border colours per theme.
 *
 * `surface` is the panel background, `inset` the recessed readout well, and
 * `line` the hairline rule colour.
 */
export const surfaces = (isDark) =>
  isDark
    ? {
        surface: '#0f172a',
        inset: 'rgba(255,255,255,0.035)',
        line: 'rgba(148,163,184,0.22)',
        lineStrong: 'rgba(148,163,184,0.34)',
        label: '#94a3b8',
        labelMuted: 'rgba(148,163,184,0.62)',
        value: '#e2e8f0',
        highBg: 'rgba(34,197,94,0.18)',
      }
    : {
        surface: '#ffffff',
        inset: 'rgba(15,23,42,0.028)',
        line: 'rgba(100,116,139,0.24)',
        lineStrong: 'rgba(100,116,139,0.4)',
        label: '#64748b',
        labelMuted: 'rgba(100,116,139,0.7)',
        value: '#0f172a',
        highBg: 'rgba(34,197,94,0.14)',
      };

/** Shared type styles for the node's micro-labels. */
export const microLabelSx = {
  fontFamily: MONO_FONT,
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  lineHeight: 1,
  userSelect: 'none',
};

/** Type style for numeric readouts (values, counts). */
export const readoutSx = {
  fontFamily: MONO_FONT,
  fontSize: 10,
  fontWeight: 700,
  fontVariantNumeric: 'tabular-nums',
  lineHeight: 1,
  userSelect: 'none',
};
