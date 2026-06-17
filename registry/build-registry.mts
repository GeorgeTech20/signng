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

type RegistryType = 'registry:ui' | 'registry:lib' | 'registry:theme' | 'registry:style';

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
    name: 'switch',
    type: 'registry:ui',
    description: 'Accessible switch (role=switch) on @signng/core/switch.',
    dependencies: ['@signng/core'],
    registryDependencies: ['utils'],
    files: [{ src: 'ui/switch.ts', target: 'src/components/ui/switch.ts', type: 'registry:ui' }],
  },
  {
    name: 'checkbox',
    type: 'registry:ui',
    description: 'Tri-state checkbox (role=checkbox, mixed) on @signng/core/checkbox.',
    dependencies: ['@signng/core'],
    registryDependencies: ['utils'],
    files: [{ src: 'ui/checkbox.ts', target: 'src/components/ui/checkbox.ts', type: 'registry:ui' }],
  },
  {
    name: 'input',
    type: 'registry:ui',
    description: 'Styled native input.',
    registryDependencies: ['utils'],
    files: [{ src: 'ui/input.ts', target: 'src/components/ui/input.ts', type: 'registry:ui' }],
  },
  {
    name: 'label',
    type: 'registry:ui',
    description: 'Styled native label.',
    registryDependencies: ['utils'],
    files: [{ src: 'ui/label.ts', target: 'src/components/ui/label.ts', type: 'registry:ui' }],
  },
  {
    name: 'overlay',
    type: 'registry:style',
    description: 'CDK overlay prebuilt CSS + dialog backdrop. Required by dialog/tooltip/popover.',
    files: [{ src: 'styles/overlay.css', target: 'src/signng-overlay.css', type: 'registry:style' }],
  },
  {
    name: 'dialog',
    type: 'registry:ui',
    description: 'Modal dialog (focus trap, backdrop, Esc, restore focus) on @signng/core/dialog.',
    dependencies: ['@signng/core', '@angular/cdk'],
    registryDependencies: ['utils', 'button', 'overlay'],
    files: [{ src: 'ui/dialog.ts', target: 'src/components/ui/dialog.ts', type: 'registry:ui' }],
  },
  {
    name: 'tooltip',
    type: 'registry:ui',
    description: 'Tooltip via CDK connected overlay (hover/focus, role=tooltip).',
    dependencies: ['@angular/cdk'],
    registryDependencies: ['utils', 'overlay'],
    files: [{ src: 'ui/tooltip.ts', target: 'src/components/ui/tooltip.ts', type: 'registry:ui' }],
  },
  {
    name: 'radio-group',
    type: 'registry:ui',
    description: 'Accessible radio group (roving tabindex, arrow nav) on @signng/core/radio-group.',
    dependencies: ['@signng/core'],
    registryDependencies: ['utils'],
    files: [{ src: 'ui/radio-group.ts', target: 'src/components/ui/radio-group.ts', type: 'registry:ui' }],
  },
  {
    name: 'popover',
    type: 'registry:ui',
    description: 'Non-modal popover (CDK connected overlay, outside-click + Esc dismiss).',
    dependencies: ['@angular/cdk'],
    registryDependencies: ['utils', 'button', 'overlay'],
    files: [{ src: 'ui/popover.ts', target: 'src/components/ui/popover.ts', type: 'registry:ui' }],
  },
  {
    name: 'textarea',
    type: 'registry:ui',
    description: 'Styled native textarea.',
    registryDependencies: ['utils'],
    files: [{ src: 'ui/textarea.ts', target: 'src/components/ui/textarea.ts', type: 'registry:ui' }],
  },
  {
    name: 'accordion',
    type: 'registry:ui',
    description: 'Accordion over @angular/aria (keyboard, aria-expanded, lazy content inherited).',
    dependencies: ['@signng/core', '@angular/aria'],
    registryDependencies: ['utils'],
    files: [{ src: 'ui/accordion.ts', target: 'src/components/ui/accordion.ts', type: 'registry:ui' }],
  },
  {
    name: 'select',
    type: 'registry:ui',
    description: 'Select: trigger + CDK overlay hosting @angular/aria Listbox (single-select).',
    dependencies: ['@signng/core', '@angular/cdk', '@angular/aria'],
    registryDependencies: ['utils', 'overlay'],
    files: [{ src: 'ui/select.ts', target: 'src/components/ui/select.ts', type: 'registry:ui' }],
  },
  {
    name: 'card',
    type: 'registry:ui',
    description: 'Card part directives (header/title/description/content/footer).',
    registryDependencies: ['utils'],
    files: [{ src: 'ui/card.ts', target: 'src/components/ui/card.ts', type: 'registry:ui' }],
  },
  {
    name: 'badge',
    type: 'registry:ui',
    description: 'Badge with CVA variants.',
    dependencies: ['class-variance-authority'],
    registryDependencies: ['utils'],
    files: [{ src: 'ui/badge.ts', target: 'src/components/ui/badge.ts', type: 'registry:ui' }],
  },
  {
    name: 'separator',
    type: 'registry:ui',
    description: 'Separator (role=separator, orientation).',
    registryDependencies: ['utils'],
    files: [{ src: 'ui/separator.ts', target: 'src/components/ui/separator.ts', type: 'registry:ui' }],
  },
  {
    name: 'avatar',
    type: 'registry:ui',
    description: 'Avatar with image + initials fallback; src run through URL scheme allowlist.',
    dependencies: ['@signng/core'],
    registryDependencies: ['utils'],
    files: [{ src: 'ui/avatar.ts', target: 'src/components/ui/avatar.ts', type: 'registry:ui' }],
  },
  {
    name: 'alert-dialog',
    type: 'registry:ui',
    description: 'Confirm/cancel modal (role=alertdialog) on @signng/core/dialog.',
    dependencies: ['@signng/core', '@angular/cdk'],
    registryDependencies: ['utils', 'button', 'overlay'],
    files: [{ src: 'ui/alert-dialog.ts', target: 'src/components/ui/alert-dialog.ts', type: 'registry:ui' }],
  },
  {
    name: 'dropdown-menu',
    type: 'registry:ui',
    description: 'Dropdown menu over @angular/aria Menu (role=menu, roving, typeahead) in a CDK overlay.',
    dependencies: ['@signng/core', '@angular/cdk', '@angular/aria'],
    registryDependencies: ['utils', 'button', 'overlay'],
    files: [{ src: 'ui/dropdown-menu.ts', target: 'src/components/ui/dropdown-menu.ts', type: 'registry:ui' }],
  },
  {
    name: 'sheet',
    type: 'registry:ui',
    description: 'Side drawer (edge-positioned modal) on @signng/core/dialog.',
    dependencies: ['@signng/core', '@angular/cdk'],
    registryDependencies: ['utils', 'button', 'overlay'],
    files: [{ src: 'ui/sheet.ts', target: 'src/components/ui/sheet.ts', type: 'registry:ui' }],
  },
  {
    name: 'toast',
    type: 'registry:ui',
    description: 'Toast service + viewport (signal queue, auto-dismiss, aria-live status/alert).',
    registryDependencies: ['utils'],
    files: [{ src: 'ui/toast.ts', target: 'src/components/ui/toast.ts', type: 'registry:ui' }],
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
