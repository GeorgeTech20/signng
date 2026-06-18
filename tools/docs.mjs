// Static docs-site generator — reads the SIGNED registry and emits docs/index.html.
// Dogfoods the signng oklch theme; foregrounds the signed-distribution story (the enterprise wedge).
// Run: pnpm docs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const R = resolve(ROOT, 'registry', 'public', 'r');
const OUT = resolve(ROOT, 'docs');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// 1) Theme vars: @theme {…} isn't valid CSS, so rewrite it to :root {…} (the .dark block is already plain).
const themeCss = readFileSync(resolve(ROOT, 'tokens', 'dist', 'theme.css'), 'utf8')
  .replace(/@import\s+["']tailwindcss["'];/g, '')
  .replace(/@custom-variant[^;]*;/g, '')
  .replace(/@theme\s*\{/, ':root {');

// 2) Registry index + per-item details.
const index = JSON.parse(readFileSync(resolve(R, 'registry.json'), 'utf8'));
const items = index.items
  .filter((i) => i.type === 'registry:ui')
  .map((i) => JSON.parse(readFileSync(resolve(R, `${i.name}.json`), 'utf8')));

const CATEGORIES = [
  ['Formularios', ['button', 'input', 'label', 'textarea', 'checkbox', 'switch', 'radio-group', 'select', 'slider', 'combobox', 'input-otp', 'form-field']],
  ['Overlays', ['dialog', 'alert-dialog', 'sheet', 'drawer', 'popover', 'tooltip', 'hover-card', 'toast', 'command']],
  ['Navegación', ['tabs', 'accordion', 'dropdown-menu', 'context-menu', 'menubar', 'navigation-menu', 'breadcrumb', 'pagination', 'sidebar']],
  ['Fecha', ['calendar', 'date-picker']],
  ['Display', ['card', 'badge', 'avatar', 'separator', 'alert', 'skeleton', 'progress', 'table']],
  ['Interacción', ['toggle', 'toggle-group', 'collapsible', 'scroll-area', 'aspect-ratio', 'carousel', 'resizable']],
  ['Gráficos', ['chart']],
];
const byName = new Map(items.map((i) => [i.name, i]));
const used = new Set();

// Icon gallery — parse the ICONS map from the icon component (pure SVG path data).
const iconSrc = readFileSync(resolve(R, '..', '..', 'items', 'ui', 'icon.ts'), 'utf8');
const ICON_ENTRIES = [...iconSrc.matchAll(/['"]?([a-z][\w-]*)['"]?:\s*\[([^\]]*)\]/gi)]
  .map(([, name, body]) => ({ name, paths: [...body.matchAll(/'([^']*)'/g)].map((m) => m[1]) }))
  .filter((e) => e.paths.length && e.paths.every((p) => /^[Mm]/.test(p.trim())));
const iconCard = (e) =>
  `<button class="icon-card" data-name="${esc(e.name)}" title="Copiar &lt;signng-icon name=&quot;${esc(e.name)}&quot; /&gt;">` +
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="22" height="22">` +
  e.paths.map((d) => `<path d="${esc(d)}"/>`).join('') +
  `</svg><span>${esc(e.name)}</span></button>`;
const iconsHtml =
  `<h2 id="iconos">Iconos <span class="badge">${ICON_ENTRIES.length}</span></h2>` +
  `<p class="desc">Set de iconos propio (stroke, grilla 24px, sin dependencia). Click un icono para copiar su uso.</p>` +
  `<div class="icon-grid">${ICON_ENTRIES.map(iconCard).join('')}</div>`;

const badge = (t) => `<span class="badge">${esc(t)}</span>`;
const depBadges = (item) => {
  const npm = (item.dependencies ?? []).map((d) => badge(d));
  const reg = (item.registryDependencies ?? []).map((d) => `<span class="badge badge-reg">${esc(d)}</span>`);
  if (!npm.length && !reg.length) return '';
  return `<p class="deps">${npm.join(' ')} ${reg.join(' ')}</p>`;
};

function componentHtml(item) {
  const file = item.files[0];
  return `
  <section id="c-${item.name}" class="component">
    <h3>${esc(item.name)} ${badge(item.type.replace('registry:', ''))}</h3>
    <p class="desc">${esc(item.description)}</p>
    ${depBadges(item)}
    <pre class="cmd" tabindex="0">pnpm signng add ${esc(item.name)}</pre>
    <details>
      <summary>Ver fuente — <code>${esc(file.target)}</code></summary>
      <pre class="src"><code>${esc(file.content)}</code></pre>
    </details>
    <p class="integrity" title="Subresource Integrity verificado por el CLI antes de escribir">${esc(file.integrity)}</p>
  </section>`;
}

let sections = '';
let nav = '';
for (const [cat, names] of CATEGORIES) {
  const inCat = names.map((n) => byName.get(n)).filter(Boolean);
  inCat.forEach((i) => used.add(i.name));
  if (!inCat.length) continue;
  nav += `<li class="nav-cat">${esc(cat)}</li>` + inCat.map((i) => `<li><a href="#c-${i.name}">${esc(i.name)}</a></li>`).join('');
  sections += `<h2 id="cat-${cat}">${esc(cat)}</h2>` + inCat.map(componentHtml).join('');
}
const orphans = items.filter((i) => !used.has(i.name));
if (orphans.length) {
  nav += `<li class="nav-cat">Otros</li>` + orphans.map((i) => `<li><a href="#c-${i.name}">${esc(i.name)}</a></li>`).join('');
  sections += `<h2>Otros</h2>` + orphans.map(componentHtml).join('');
}

const signer = (index.publicKey ?? '').replace(/-----[^-]+-----/g, '').replace(/\s+/g, '').slice(0, 44);
const sig = (index.signature ?? '').slice(0, 44);

const html = `<!doctype html>
<html lang="es" class="">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>signng — componentes Angular que son tuyos</title>
<style>
${themeCss}
* { box-sizing: border-box; }
body { margin: 0; background: var(--color-background); color: var(--color-foreground); font: 15px/1.6 ui-sans-serif, system-ui, sans-serif; }
a { color: var(--color-primary); text-decoration: none; }
a:hover { text-decoration: underline; }
.layout { display: grid; grid-template-columns: 240px 1fr; max-width: 1100px; margin: 0 auto; }
aside { position: sticky; top: 0; align-self: start; height: 100vh; overflow: auto; padding: 1.5rem 1rem; border-right: 1px solid var(--color-border); }
aside ul { list-style: none; margin: 0; padding: 0; font-size: 13px; }
aside li a { display: block; padding: 2px 8px; border-radius: 6px; color: var(--color-muted-foreground); }
aside li a:hover { background: var(--color-accent); color: var(--color-accent-foreground); text-decoration: none; }
.nav-cat { margin: 12px 0 4px; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: var(--color-foreground); }
main { padding: 2rem 2.5rem; min-width: 0; }
h1 { font-size: 2rem; letter-spacing: -.02em; margin: 0 0 .25rem; }
h2 { font-size: 1.1rem; margin: 2.5rem 0 .5rem; padding-bottom: .35rem; border-bottom: 1px solid var(--color-border); }
h3 { font-size: 1rem; margin: 1.75rem 0 .25rem; display: flex; align-items: center; gap: .5rem; }
.tagline { color: var(--color-muted-foreground); font-size: 1.05rem; max-width: 60ch; }
.badge { display: inline-block; font-size: 11px; padding: 1px 8px; border-radius: 9999px; background: var(--color-secondary); color: var(--color-secondary-foreground); border: 1px solid var(--color-border); }
.badge-reg { background: transparent; color: var(--color-muted-foreground); }
.deps { margin: .25rem 0; }
.desc { color: var(--color-muted-foreground); margin: .25rem 0; }
pre { background: var(--color-card); border: 1px solid var(--color-border); border-radius: var(--radius); padding: .75rem 1rem; overflow: auto; font: 13px/1.5 ui-monospace, monospace; }
pre.cmd { background: var(--color-foreground); color: var(--color-background); }
.src { max-height: 420px; }
.integrity { font: 11px/1.4 ui-monospace, monospace; color: var(--color-muted-foreground); word-break: break-all; }
details summary { cursor: pointer; font-size: 13px; color: var(--color-muted-foreground); margin: .25rem 0; }
.card { border: 1px solid var(--color-border); border-radius: var(--radius); padding: 1.25rem 1.5rem; margin: 1rem 0; background: var(--color-card); }
.patterns { display: grid; grid-template-columns: repeat(3, 1fr); gap: .75rem; margin: 1rem 0; }
.patterns div { border: 1px solid var(--color-border); border-radius: var(--radius); padding: .75rem 1rem; font-size: 13px; }
.toggle { position: fixed; top: 1rem; right: 1rem; z-index: 10; border: 1px solid var(--color-border); background: var(--color-card); color: var(--color-foreground); border-radius: 8px; padding: 6px 10px; cursor: pointer; font-size: 13px; }
.icon-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(88px, 1fr)); gap: 8px; margin: 1rem 0; }
.icon-card { display: flex; flex-direction: column; align-items: center; gap: 7px; padding: 14px 6px; border: 1px solid var(--color-border); border-radius: var(--radius); background: var(--color-card); color: var(--color-foreground); cursor: pointer; font: inherit; font-size: 11px; transition: background .12s, border-color .12s; }
.icon-card:hover { background: var(--color-accent); color: var(--color-accent-foreground); }
.icon-card.copied { border-color: var(--color-primary); color: var(--color-primary); }
.icon-card span { color: var(--color-muted-foreground); }
.icon-card.copied span { color: var(--color-primary); }
@media (max-width: 760px) { .layout { grid-template-columns: 1fr; } aside { display: none; } .patterns { grid-template-columns: 1fr; } }
</style>
</head>
<body>
<button class="toggle" onclick="document.documentElement.classList.toggle('dark')">◐ tema</button>
<div class="layout">
<aside><ul>
<li><a href="#hero">Introducción</a></li>
<li><a href="#install">Instalación</a></li>
<li><a href="#security">Distribución firmada</a></li>
<li><a href="#iconos">Iconos</a></li>
${nav}
</ul></aside>
<main>
  <section id="hero">
    <h1>signng</h1>
    <p class="tagline">Componentes Angular accesibles (WCAG 2.2 AA), signals-native, zoneless + SSR — que copias a tu repo y <strong>posees</strong>. Instalados por un CLI que verifica firma + integridad antes de escribir.</p>
    <div class="patterns">
      <div><strong>Heredar a11y</strong><br/>wrap de @angular/aria (Tabs, Select, Menu…)</div>
      <div><strong>Componer CDK</strong><br/>overlays con @angular/cdk (Dialog, Popover, Toast…)</div>
      <div><strong>Net-new</strong><br/>primitivos autorados (Slider, Calendar, Combobox…)</div>
    </div>
    <p class="desc">${items.length} componentes · ${index.items.length} items firmados.</p>
  </section>

  <section id="install" class="card">
    <h2 style="margin-top:0;border:0">Instalación</h2>
    <pre class="cmd" tabindex="0">pnpm signng init        # pinea el signer, cablea tema + estilos
pnpm signng add button dialog calendar   # verifica firma + SRI, luego escribe</pre>
  </section>

  <section id="security" class="card">
    <h2 style="margin-top:0;border:0">Distribución firmada — la cuña enterprise</h2>
    <p class="desc">El registry se firma con <strong>${esc(index.algorithm || 'ed25519')}</strong>. El CLI verifica la firma contra el <strong>signer pineado</strong> y el hash <strong>SRI</strong> de cada archivo <em>antes</em> de escribir — <strong>fail-closed</strong>: si algo no cuadra, no escribe nada.</p>
    <p class="integrity">signer (pubkey): ${esc(signer)}…</p>
    <p class="integrity">signature: ${esc(sig)}…</p>
  </section>

  <section>${iconsHtml}</section>

  ${sections}

  <footer style="margin:3rem 0 2rem;color:var(--color-muted-foreground);font-size:13px;border-top:1px solid var(--color-border);padding-top:1rem">
    Generado desde el registry firmado · axe 0 violaciones WCAG 2.2 AA
  </footer>
</main>
</div>
<script>
document.querySelectorAll('.icon-card').forEach(function (b) {
  b.addEventListener('click', function () {
    navigator.clipboard.writeText('<signng-icon name="' + b.dataset.name + '" />');
    b.classList.add('copied');
    setTimeout(function () { b.classList.remove('copied'); }, 900);
  });
});
</script>
</body>
</html>`;

mkdirSync(OUT, { recursive: true });
writeFileSync(resolve(OUT, 'index.html'), html);
console.log(`✔ docs -> docs/index.html  (${items.length} components, ${(html.length / 1024) | 0} kB)`);
