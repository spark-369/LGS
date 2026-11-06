// ---------------------------------------------------------------------------
// ANSI/IEEE-style gate symbols drawn as inline SVG.
//
// Every shape is authored inside a 64x40 viewBox so they all share the same
// optical weight and can be scaled to any size. Inversion bubbles are appended
// on the right edge, which is why `bubble` widens the effective drawing area.
// ---------------------------------------------------------------------------
import { memo } from 'react';
import { GATE_FAMILY, getGateFamily, isInverted } from '../../utils/gates';

const VB_W = 64;
const VB_H = 40;
const MID = VB_H / 2;

/** AND / NAND — flat back, semicircular nose. */
function AndShape({ arity = 2 }) {
  return (
    <>
      <path d="M10 6 H32 A14 14 0 0 1 32 34 H10 Z" />
      {arity > 2 && (
        <text x="16" y={MID} className="lgs-sym-arity" dominantBaseline="middle">
          {arity}
        </text>
      )}
    </>
  );
}

/** OR / NOR — curved back, pointed nose. */
function OrShape({ arity = 2 }) {
  return (
    <>
      <path d="M10 6 Q30 20 10 34 Q34 34 50 20 Q34 6 10 6 Z" />
      {arity > 2 && (
        <text x="22" y={MID} className="lgs-sym-arity" dominantBaseline="middle">
          {arity}
        </text>
      )}
    </>
  );
}

/** XOR / XNOR — OR shape with an extra back arc. */
function XorShape({ arity = 2 }) {
  return (
    <>
      <path d="M4 6 Q24 20 4 34" className="lgs-sym-extra" />
      <path d="M12 6 Q32 20 12 34 Q36 34 52 20 Q36 6 12 6 Z" />
      {arity > 2 && (
        <text x="26" y={MID} className="lgs-sym-arity" dominantBaseline="middle">
          {arity}
        </text>
      )}
    </>
  );
}

/** NOT / BUFFER — triangle. */
function TriangleShape() {
  return <path d="M14 6 L14 34 L50 20 Z" />;
}

/** Majority — rounded body with "≥k" threshold marker. */
function MajorityShape({ arity = 3 }) {
  return (
    <>
      <rect x="10" y="5" width="44" height="30" rx="8" />
      <text x="32" y={MID} className="lgs-sym-arity" textAnchor="middle" dominantBaseline="middle">
        ≥{Math.floor(arity / 2) + 1}
      </text>
    </>
  );
}

/** Equality — body with "=" marker. */
function EqualityShape() {
  return (
    <>
      <rect x="10" y="5" width="44" height="30" rx="8" />
      <text x="32" y={MID} className="lgs-sym-arity" textAnchor="middle" dominantBaseline="middle">
        =
      </text>
    </>
  );
}

/** Multiplexer — trapezoid with the data/select split drawn as a divider. */
function MuxShape({ dataCount = 2 }) {
  return (
    <>
      <path d="M12 5 H52 L44 35 H12 Z" />
      {/* divider separating data lines from select lines */}
      <path d="M14 27 H47" className="lgs-sym-extra" />
      <text x="33" y="18" className="lgs-sym-arity" textAnchor="middle" dominantBaseline="middle">
        M{dataCount}
      </text>
    </>
  );
}

/** Tri-state — triangle with an enable bar underneath. */
function TristateShape() {
  return (
    <>
      <path d="M14 6 L14 30 L50 18 Z" />
      <path d="M14 36 H50" className="lgs-sym-extra" />
    </>
  );
}

/** AOI / OAI — compound body annotated with its AND/OR grouping. */
function CompoundShape({ label }) {
  return (
    <>
      <rect x="10" y="5" width="44" height="30" rx="8" />
      <text x="32" y={MID} className="lgs-sym-arity" textAnchor="middle" dominantBaseline="middle">
        {label}
      </text>
    </>
  );
}

/** INPUT — source flag. */
function InputShape() {
  return (
    <>
      <rect x="12" y="10" width="40" height="20" rx="4" />
      <path d="M52 20 H58" className="lgs-sym-extra" />
    </>
  );
}

/** OUTPUT — sink flag. */
function OutputShape() {
  return (
    <>
      <path d="M10 20 H18" className="lgs-sym-extra" />
      <rect x="18" y="10" width="36" height="20" rx="4" />
    </>
  );
}

function GateBody({ type }) {
  const family = getGateFamily(type);
  // `type` may be missing on a malformed/legacy node — guard before matching.
  const arity = Number((String(type ?? '').match(/(\d)$/) || [])[1]) || 2;
  const inverted = isInverted(type);

  let shape;
  switch (family) {
    case GATE_FAMILY.IO:
      shape = type === 'INPUT' ? <InputShape /> : <OutputShape />;
      break;
    case GATE_FAMILY.NOT:
    case GATE_FAMILY.BUFFER:
      shape = <TriangleShape />;
      break;
    case GATE_FAMILY.OR:
      shape = <OrShape arity={arity} />;
      break;
    case GATE_FAMILY.XOR:
      shape = <XorShape arity={arity} />;
      break;
    case GATE_FAMILY.MUX:
      shape = <MuxShape dataCount={Number(type.replace('MUX', ''))} />;
      break;
    case GATE_FAMILY.MAJORITY:
      shape = <MajorityShape arity={arity} />;
      break;
    case GATE_FAMILY.EQUALITY:
      shape = <EqualityShape />;
      break;
    case GATE_FAMILY.TRISTATE:
      shape = <TristateShape />;
      break;
    case GATE_FAMILY.AOI:
      shape = <CompoundShape label={type.replace(/^([A-Z]+)(\d+)$/, '$1 $2')} />;
      break;
    case GATE_FAMILY.AND:
    default:
      shape = <AndShape arity={arity} />;
  }

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      width="100%"
      height="100%"
      className="lgs-gate-symbol"
      aria-hidden="true"
      focusable="false"
    >
      <g className="lgs-sym-body">{shape}</g>
      {inverted && <circle cx={family === GATE_FAMILY.NOT ? 54 : 52} cy={MID} r="4" className="lgs-sym-bubble" />}
    </svg>
  );
}

export default memo(GateBody);
