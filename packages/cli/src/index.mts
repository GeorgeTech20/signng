#!/usr/bin/env node
// @signng/cli — secure copy-paste installer (shadcn-style registry, hardened).
// Security: SRI verify + item-manifest verify + write sandbox + dry-run/diff + confirm gate.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { Command } from 'commander';
import { createTwoFilesPatch } from 'diff';
import pc from 'picocolors';
import { fetchIndex, resolveItems, type RegistryItem } from './registry.mts';
import { assertSafeTarget, verifyFileIntegrity, verifyItemIntegrity } from './security.mts';
import { normalizePem, verifyRegistry } from './signature.mts';

interface UiConfig {
  registry: string;
  aliases: { components: string; ui: string; lib: string };
  theme: string;
  signer?: string; // pinned Ed25519 signer pubkey (PEM)
}

const DEFAULT_CONFIG: UiConfig = {
  registry: '../../registry/public/r',
  aliases: { components: 'src/components', ui: 'src/components/ui', lib: 'src/lib' },
  theme: 'src/signng-theme.css',
};

function loadConfig(projectRoot: string): UiConfig {
  const file = resolve(projectRoot, 'ui.config.json');
  if (existsSync(file)) return { ...DEFAULT_CONFIG, ...JSON.parse(readFileSync(file, 'utf8')) };
  return DEFAULT_CONFIG;
}

function plan(items: RegistryItem[], projectRoot: string, signedIntegrity: Map<string, string>) {
  const writes: { abs: string; target: string; content: string; existed: boolean }[] = [];
  const npmDeps = new Set<string>();
  for (const item of items) {
    // Cross-check: the item's integrity must match the SIGNED manifest entry.
    const signed = signedIntegrity.get(item.name);
    if (signed !== item.integrity) {
      throw new Error(`"${item.name}" not covered by signed manifest (integrity mismatch)`);
    }
    verifyItemIntegrity(item); // tamper-evident manifest
    for (const file of item.files) {
      verifyFileIntegrity(file); // SRI — fail closed on mismatch
      const abs = assertSafeTarget(file.target, projectRoot); // sandbox — no traversal/sensitive
      writes.push({ abs, target: file.target, content: file.content, existed: existsSync(abs) });
    }
    for (const d of item.dependencies) npmDeps.add(d);
  }
  return { writes, npmDeps };
}

function showDiff(target: string, oldContent: string, newContent: string): void {
  if (oldContent === newContent) return;
  const patch = createTwoFilesPatch(target, target, oldContent, newContent, 'current', 'incoming');
  for (const line of patch.split('\n').slice(2)) {
    if (line.startsWith('+') && !line.startsWith('+++')) console.log(pc.green(line));
    else if (line.startsWith('-') && !line.startsWith('---')) console.log(pc.red(line));
    else if (line.startsWith('@@')) console.log(pc.cyan(line));
    else console.log(pc.dim(line));
  }
}

async function runAdd(names: string[], opts: { cwd: string; yes?: boolean; dryRun?: boolean }) {
  const projectRoot = resolve(process.cwd(), opts.cwd);
  const config = loadConfig(projectRoot);
  const base = resolve(projectRoot, config.registry);

  console.log(pc.bold(`\nsignng add ${names.join(' ')}`));
  console.log(pc.dim(`  project : ${projectRoot}`));
  console.log(pc.dim(`  registry: ${base}\n`));

  // 1) Fetch the signed registry index and verify it against the PINNED signer.
  const index = await fetchIndex(base);
  if (!config.signer) {
    throw new Error('no pinned signer in ui.config.json — run `signng init` first (fail-closed)');
  }
  if (!index.signature || !verifyRegistry(index.items, index.signature, config.signer)) {
    throw new Error('registry signature verification FAILED — pinned signer mismatch or tampered manifest');
  }
  console.log(pc.green('✔ registry signature verified (ed25519, pinned signer)'));
  const signedIntegrity = new Map(index.items.map((i) => [i.name, i.integrity]));

  const items = await resolveItems(names, base);
  console.log(pc.dim(`resolved ${items.length} item(s): ${items.map((i) => i.name).join(', ')}`));

  const { writes, npmDeps } = plan(items, projectRoot, signedIntegrity); // throws if any check fails

  console.log(pc.bold('\nplanned writes (verified ✓):'));
  for (const w of writes) {
    console.log(`  ${w.existed ? pc.yellow('overwrite') : pc.green('create   ')} ${relative(projectRoot, w.abs)}`);
  }
  for (const w of writes) {
    console.log(pc.bold(`\n— ${w.target} —`));
    showDiff(w.target, w.existed ? readFileSync(w.abs, 'utf8') : '', w.content);
  }

  if (opts.dryRun) {
    console.log(pc.yellow('\ndry-run: no files written.'));
    return;
  }
  if (!opts.yes) {
    console.log(pc.yellow('\nre-run with --yes to apply (interactive confirm skipped in non-TTY).'));
    return;
  }

  for (const w of writes) {
    mkdirSync(dirname(w.abs), { recursive: true });
    writeFileSync(w.abs, w.content);
  }
  console.log(pc.green(`\n✔ wrote ${writes.length} file(s).`));
  // Auto-wire any written stylesheet (theme/overlay/style items) into src/styles.css.
  for (const w of writes) {
    if (w.target.endsWith('.css')) ensureCssImport(projectRoot, w.target);
  }
  if (npmDeps.size) console.log(pc.dim(`  ensure deps: ${[...npmDeps].join(' ')}`));
}

function ensureCssImport(projectRoot: string, cssTarget: string): void {
  const styles = resolve(projectRoot, 'src/styles.css');
  const importLine = `@import './${relative(resolve(projectRoot, 'src'), resolve(projectRoot, cssTarget)).replace(/\\/g, '/')}';`;
  let current = existsSync(styles) ? readFileSync(styles, 'utf8') : '';
  if (!current.includes(importLine)) {
    current = `${importLine}\n${current}`;
    writeFileSync(styles, current);
    console.log(pc.green(`✔ wired ${importLine} into src/styles.css`));
  }
}

function pinSigner(base: string): string | undefined {
  // Local POC: read the published pubkey beside the registry (registry/public/r -> registry/keys).
  // Production (https): fetch the cosign/Sigstore identity out-of-band and pin it here.
  const localPub = resolve(base, '..', '..', 'keys', 'signing.pub');
  return existsSync(localPub) ? normalizePem(readFileSync(localPub, 'utf8')) : undefined;
}

async function runInit(opts: { cwd: string; registry: string; yes?: boolean }) {
  const projectRoot = resolve(process.cwd(), opts.cwd);
  const cfgFile = resolve(projectRoot, 'ui.config.json');
  const base = resolve(projectRoot, opts.registry);

  const signer = pinSigner(base);
  if (!signer) console.log(pc.yellow('⚠ no signer pubkey found — `add` will refuse until one is pinned.'));

  const existing = existsSync(cfgFile) ? JSON.parse(readFileSync(cfgFile, 'utf8')) : {};
  const cfg = { ...DEFAULT_CONFIG, ...existing, registry: opts.registry, signer };
  writeFileSync(cfgFile, JSON.stringify(cfg, null, 2));
  console.log(pc.green(`✔ ui.config.json (signer pinned: ${signer ? 'yes' : 'no'})`));

  await runAdd(['theme'], { cwd: opts.cwd, yes: true }); // theme.css auto-imported by runAdd
}

const program = new Command();
program.name('signng').description('SignNG secure component installer').version('0.0.1');

program
  .command('init')
  .option('--cwd <dir>', 'target project directory', '.')
  .option('--registry <base>', 'registry base (https:// or local path)', DEFAULT_CONFIG.registry)
  .option('--yes', 'skip confirmation', false)
  .action((opts) => runInit(opts).catch(fail));

program
  .command('add')
  .argument('<names...>', 'registry item names')
  .option('--cwd <dir>', 'target project directory', '.')
  .option('--dry-run', 'show plan + diff, write nothing', false)
  .option('--yes', 'apply without confirm', false)
  .action((names, opts) => runAdd(names, opts).catch(fail));

function fail(err: unknown): never {
  console.error(pc.red(`\n✖ ${err instanceof Error ? err.message : String(err)}`));
  process.exit(1);
}

program.parseAsync(process.argv);
