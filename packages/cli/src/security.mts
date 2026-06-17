// CLI security controls — close threat T1 (install-time RCE via registry/CLI writer).
import { createHash } from 'node:crypto';
import { isAbsolute, relative, resolve } from 'node:path';

/** SRI hash matching the registry builder's algorithm. */
export function sri(content: string): string {
  return 'sha256-' + createHash('sha256').update(content, 'utf8').digest('base64');
}

/** Item names are used in URLs/paths — restrict to a tight charset (kills SSRF/traversal via name). */
const VALID_NAME = /^[a-z0-9][a-z0-9-]*$/;
export function assertValidName(name: string): void {
  if (!VALID_NAME.test(name)) {
    throw new Error(`invalid item name "${name}" (allowed: a-z 0-9 -)`);
  }
}

// Sensitive targets a registry item must never be allowed to write/overwrite.
const SENSITIVE = [
  /(^|[\\/])\.git([\\/]|$)/,
  /(^|[\\/])\.husky([\\/]|$)/,
  /(^|[\\/])\.github([\\/]|$)/,
  /(^|[\\/])node_modules([\\/]|$)/,
  /\.config\.[cm]?[jt]s$/,
  /(^|[\\/])package(-lock)?\.json$/,
  /(^|[\\/])pnpm-lock\.yaml$/,
  /(^|[\\/])angular\.json$/,
];

/**
 * Confine a registry file's write target to the project root and forbid sensitive paths.
 * Rejects absolute paths, `..` traversal, escapes, and CI/git/config files.
 * Returns the validated absolute path.
 */
export function assertSafeTarget(target: string, projectRoot: string): string {
  if (isAbsolute(target)) throw new Error(`absolute target rejected: ${target}`);
  if (target.split(/[\\/]/).includes('..')) throw new Error(`path traversal ('..') rejected: ${target}`);

  const abs = resolve(projectRoot, target);
  const rel = relative(projectRoot, abs);
  if (rel.startsWith('..') || isAbsolute(rel)) throw new Error(`target escapes project root: ${target}`);

  for (const re of SENSITIVE) {
    if (re.test(target)) throw new Error(`sensitive target rejected: ${target}`);
  }
  return abs;
}

/** Verify a fetched file's content matches its declared SRI. Fail closed on mismatch. */
export function verifyFileIntegrity(file: { target: string; content: string; integrity: string }): void {
  const actual = sri(file.content);
  if (actual !== file.integrity) {
    throw new Error(
      `integrity mismatch for ${file.target}\n  expected ${file.integrity}\n  actual   ${actual}`,
    );
  }
}

/** Verify the item manifest hash (over each file's integrity) — tamper-evident. */
export function verifyItemIntegrity(item: {
  name: string;
  integrity: string;
  files: { target: string; integrity: string }[];
}): void {
  const manifest = sri(item.files.map((f) => `${f.target}:${f.integrity}`).join('\n'));
  if (manifest !== item.integrity) {
    throw new Error(`item integrity mismatch for "${item.name}" — manifest tampered`);
  }
}
