// ---------------------------------------------------------------------------
// Tiny string helpers shared across the API layer.
// ---------------------------------------------------------------------------

/**
 * Escape every character that is special inside a JavaScript regular
 * expression. Used before feeding user-supplied search terms into `$regex`,
 * which otherwise allows catastrophic backtracking (ReDoS) and unintended
 * wildcard behaviour.
 *
 * @param {unknown} value
 * @returns {string}
 */
export const escapeRegex = (value = '') =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Collapse whitespace and trim. */
export const normalizeText = (value = '') => String(value).replace(/\s+/g, ' ').trim();
