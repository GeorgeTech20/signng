// Registry builder: registry/items/* -> registry/public/r/*.json
// Each file carries an `integrity` (SRI sha256) the CLI verifies before writing.
// This is the missing lockfile-`integrity` analogue for fetched registry JSON (security LAYER 2a).
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadOrCreateKeys, signRegistry, type SignedIndexItem } from '../packages/cli/src/signature.mts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const ITEMS_DIR = resolve(__dirname, 'items');
const OUT_DIR = resolve(__dirname, 'public', 'r');

type RegistryType = 'registry:ui' | 'registry:lib' | 'registry:theme';

interface ItemDef {
  name: string;
  type: RegistryType;
  description: string;
  dependencies?: string[];
  registryDependencies?: string[];
  files: { src: string; target: string; type: RegistryType }[];
}

const ITEMS: ItemDef[] = [
  {
    name: 'utils',
    type: 'registry:lib',
    description: 'cn() class-merge helper.',
    dependencies: ['clsx', 'tailwind-merge'],
    files: [{ src: 'lib/utils.ts', target: 'src/lib/utils.ts', type: 'registry:lib' }],
  },
  {
    name: 'button',
    type: 'registry:ui',
    description: 'Button with CVA variants. WCAG 2.2 AA focus + target size.',
    dependencies: ['class-variance-authority'],
    registryDependencies: ['utils'],
    files: [{ src: 'ui/button.ts', target: 'src/components/ui/button.ts', type: 'registry:ui' }],
  },
  {
    name: 'slider',
    type: 'registry:ui',
    description: 'Accessible slider styled on the @signng/core/slider primitive.',
    dependencies: ['@signng/core'],
    registryDependencies: ['utils'],
    files: [{ src: 'ui/slider.ts', target: 'src/components/ui/slider.ts', type: 'registry:ui' }],
  },
  {
    name: 'theme',
    type: 'registry:theme',
    description: 'signng oklch theme (Tailwind v4 @theme + dark). tweakcn-compatible.',
    files: [{ src: '../../tokens/dist/theme.css', target: 'src/signng-theme.css', type: 'registry:theme' }],
  },
];

function sri(content: string): string {
  return 'sha256-' + createHash('sha256').update(content, 'utf8').digest('base64');
}

mkdirSync(OUT_DIR, { recursive: true });

const index: unknown[] = [];

for (const item of ITEMS) {
  const files = item.files.map((f) => {
    const abs = resolve(ITEMS_DIR, f.src);
    const content = readFileSync(abs, 'utf8');
    return { path: f.target, target: f.target, type: f.type, content, integrity: sri(content) };
  });

  // Item-level integrity = hash over each file's own integrity (tamper-evident manifest).
  const itemIntegrity = sri(files.map((f) => `${f.target}:${f.integrity}`).join('\n'));

  const record = {
    $schema: 'https://signng.dev/schema/registry-item.json',
    name: item.name,
    type: item.type,
    description: item.description,
    dependencies: item.dependencies ?? [],
    registryDependencies: item.registryDependencies ?? [],
    files,
    integrity: itemIntegrity,
  };

  writeFileSync(resolve(OUT_DIR, `${item.name}.json`), JSON.stringify(record, null, 2));
  index.push({
    name: item.name,
    type: item.type,
    description: item.description,
    integrity: itemIntegrity,
  });
  console.log(`  ✔ ${item.name}  (${files.length} file, ${itemIntegrity.slice(0, 24)}…)`);
}

// Sign the manifest (Ed25519). Private key stays local/gitignored; pubkey is pinned by consumers.
const { privatePem, publicPem } = loadOrCreateKeys(resolve(__dirname, 'keys'));
const signed = index as SignedIndexItem[];
const signature = signRegistry(signed, privatePem);

const registry = {
  $schema: 'https://signng.dev/schema/registry.json',
  name: 'signng-ui',
  homepage: 'https://signng.dev',
  items: index,
  algorithm: 'ed25519',
  signature,
  publicKey: publicPem, // informational; trust is the PINNED key, not this one
};
writeFileSync(resolve(OUT_DIR, 'registry.json'), JSON.stringify(registry, null, 2));
console.log(`✔ registry -> ${OUT_DIR.replace(ROOT, '.')}  (${ITEMS.length} items, signed ed25519)`);
