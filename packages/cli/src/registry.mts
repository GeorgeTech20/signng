// Registry resolution — HTTPS-only fetch (or local path for dev), bounded recursion, cycle-safe.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { assertValidName } from './security.mts';

export interface RegistryFile {
  path: string;
  target: string;
  type: string;
  content: string;
  integrity: string;
}
export interface RegistryItem {
  name: string;
  type: string;
  description?: string;
  dependencies: string[];
  registryDependencies: string[];
  files: RegistryFile[];
  integrity: string;
}

const MAX_DEPTH = 8;

export interface RegistryIndex {
  name: string;
  items: { name: string; type: string; integrity: string }[];
  algorithm?: string;
  signature?: string;
  publicKey?: string;
}

function isHttps(base: string): boolean {
  return /^https:\/\//i.test(base);
}

/** Fetch the signed registry index (registry.json). */
export async function fetchIndex(base: string): Promise<RegistryIndex> {
  assertSafeRegistry(base);
  if (isHttps(base)) {
    const res = await fetch(`${base.replace(/\/$/, '')}/registry.json`, { redirect: 'error' });
    if (!res.ok) throw new Error(`registry index fetch failed: HTTP ${res.status}`);
    return (await res.json()) as RegistryIndex;
  }
  return JSON.parse(readFileSync(resolve(base, 'registry.json'), 'utf8')) as RegistryIndex;
}

/** Reject insecure transports up front (security LAYER 2a: HTTPS-only). */
export function assertSafeRegistry(base: string): void {
  if (/^http:\/\//i.test(base)) {
    throw new Error(`insecure http:// registry rejected — use https:// : ${base}`);
  }
}

async function readItem(base: string, name: string): Promise<RegistryItem> {
  assertValidName(name);
  if (isHttps(base)) {
    // `redirect: 'error'` defeats cross-host redirect / MITM swap that HTTPS alone won't catch.
    const res = await fetch(`${base.replace(/\/$/, '')}/${name}.json`, { redirect: 'error' });
    if (!res.ok) throw new Error(`registry fetch failed for "${name}": HTTP ${res.status}`);
    return (await res.json()) as RegistryItem;
  }
  // Local path (dev / this POC).
  return JSON.parse(readFileSync(resolve(base, `${name}.json`), 'utf8')) as RegistryItem;
}

/**
 * Resolve an item plus its registryDependencies in install order.
 * Bounded depth + visited-set → no infinite recursion, no duplicate writes.
 */
export async function resolveItems(names: string[], base: string): Promise<RegistryItem[]> {
  assertSafeRegistry(base);
  const seen = new Set<string>();
  const order: RegistryItem[] = [];

  async function walk(name: string, depth: number): Promise<void> {
    if (depth > MAX_DEPTH) throw new Error(`registryDependencies exceed max depth (${MAX_DEPTH})`);
    if (seen.has(name)) return;
    seen.add(name);
    const item = await readItem(base, name);
    for (const dep of item.registryDependencies ?? []) {
      await walk(dep, depth + 1);
    }
    order.push(item);
  }

  for (const name of names) await walk(name, 0);
  return order;
}
