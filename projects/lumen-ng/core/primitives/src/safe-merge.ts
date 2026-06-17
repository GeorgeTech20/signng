/**
 * Prototype-pollution-safe deep merge for theme/config objects.
 *
 * Threat T5 (see security threat-model): a naive `deepMerge(defaults, userConfig)` that
 * copies `__proto__` / `constructor` / `prototype` keys lets attacker-controlled config
 * poison `Object.prototype` (CVE-2022-24802 / -25907 / -23417) → DoS or gadget-driven XSS/RCE.
 *
 * Mitigations baked in here:
 *  - own-enumerable keys only (`Object.keys`), never inherited.
 *  - hard-drop the three forbidden keys.
 *  - only recurse into plain objects whose prototype is `Object.prototype` or `null`.
 */

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

export type PlainObject = Record<string, unknown>;

export function isPlainObject(value: unknown): value is PlainObject {
  if (value === null || typeof value !== 'object') return false;
  if (Object.prototype.toString.call(value) !== '[object Object]') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * Deep-merge `sources` left→right onto a fresh object. Pollution keys are dropped.
 * Returns a new object; inputs are never mutated.
 */
export function safeMerge<T extends PlainObject>(
  base: T,
  ...sources: Array<Partial<T> | null | undefined>
): T {
  const out: PlainObject = {};
  mergeInto(out, base);
  for (const src of sources) {
    if (isPlainObject(src)) mergeInto(out, src);
  }
  return out as T;
}

function mergeInto(target: PlainObject, source: PlainObject): void {
  for (const key of Object.keys(source)) {
    if (FORBIDDEN_KEYS.has(key)) continue; // drop pollution vectors
    const incoming = source[key];
    const existing = target[key];
    if (isPlainObject(incoming)) {
      const nested: PlainObject = isPlainObject(existing) ? { ...existing } : {};
      mergeInto(nested, incoming);
      target[key] = nested;
    } else {
      target[key] = incoming;
    }
  }
}
