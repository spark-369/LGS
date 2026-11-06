// ---------------------------------------------------------------------------
// Shared helpers for the SVG gate symbols.
//
// The symbols are rendered in three places (canvas node, palette, circuit-card
// thumbnail). Their *base* appearance — stroke, fill, bubble, arity label — is
// defined once in styles/global.css using `currentColor`, so all three render
// identically without per-component CSS.
//
// The helpers here only handle the two things CSS cannot express: the family
// accent colour, and per-context overrides.
// ---------------------------------------------------------------------------

/**
 * Sizing + accent for a symbol container.
 *
 * Sets `color`, which the global `.lgs-gate-symbol` rules consume via
 * `currentColor`. Optionally adjusts stroke weight and fill for dense
 * contexts such as the circuit-card thumbnail.
 *
 * @param {string}  accent  Gate family colour.
 * @param {object}  [options]
 * @param {number}  [options.strokeWidth] Stroke weight in viewBox units.
 * @param {number}  [options.fillOpacity] Body fill opacity (0-1).
 * @param {boolean} [options.hideArity]   Hide "3"/"4"/"≥2" body labels.
 */
export const gateSymbolSx = (accent, { strokeWidth, fillOpacity, hideArity = false } = {}) => ({
  color: accent,
  display: 'flex',
  alignItems: 'center',
  ...(strokeWidth !== undefined
    ? {
        '& .lgs-sym-body path, & .lgs-sym-body rect, & .lgs-sym-extra, & .lgs-sym-bubble': {
          strokeWidth,
        },
      }
    : {}),
  ...(fillOpacity !== undefined
    ? { '& .lgs-sym-body path, & .lgs-sym-body rect': { fillOpacity } }
    : {}),
  ...(hideArity ? { '& .lgs-sym-arity': { display: 'none' } } : {}),
});

/** Tabular monospace for metric readouts — keeps columns aligned. */
export const MONO_FONT =
  'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace';
