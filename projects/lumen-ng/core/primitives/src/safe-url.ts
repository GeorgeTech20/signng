/**
 * URL scheme allowlist — defense against DOM-XSS via `[href]`/`[src]` inputs (threat T4)
 * and open-redirect via protocol-relative URLs (threat T9).
 *
 * Components bind user-supplied URLs through `sanitizeUrl()` so a `javascript:`/`data:`
 * scheme can never reach an attribute binding, and `//evil.com` can never launder a
 * redirect through a trusted origin. We do NOT rely on Angular's URL sanitizer alone.
 */

const SAFE_SCHEMES = new Set(['http:', 'https:', 'mailto:', 'tel:', 'ftp:']);

/** Matches an absolute URL that begins with a scheme, e.g. `https:` / `javascript:`. */
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i;

export function isSafeUrl(raw: unknown): raw is string {
  if (typeof raw !== 'string') return false;
  const value = raw.trim();
  if (value === '') return false;

  // Protocol-relative (`//host/...`) — blocked: open-redirect / scheme-inheritance vector.
  if (value.startsWith('//')) return false;

  if (HAS_SCHEME.test(value)) {
    try {
      return SAFE_SCHEMES.has(new URL(value).protocol);
    } catch {
      return false;
    }
  }

  // No scheme → relative path / query / fragment. Safe by construction.
  return true;
}

/** Returns the URL if safe, otherwise a harmless fallback (default `about:blank`). */
export function sanitizeUrl(raw: unknown, fallback = 'about:blank'): string {
  return isSafeUrl(raw) ? raw.trim() : fallback;
}
