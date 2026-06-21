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
  ['Formularios', ['button', 'input', 'label', 'textarea', 'checkbox', 'switch', 'radio-group', 'select', 'slider', 'range-slider', 'combobox', 'input-otp', 'form-field', 'form']],
  ['Overlays', ['dialog', 'alert-dialog', 'sheet', 'drawer', 'popover', 'tooltip', 'hover-card', 'toast', 'command']],
  ['Navegación', ['tabs', 'accordion', 'dropdown-menu', 'context-menu', 'menubar', 'navigation-menu', 'breadcrumb', 'pagination', 'sidebar']],
  ['Fecha', ['calendar', 'date-picker', 'time-picker']],
  ['Display', ['card', 'badge', 'avatar', 'separator', 'alert', 'skeleton', 'progress', 'spinner', 'table']],
  ['Interacción', ['toggle', 'toggle-group', 'collapsible', 'scroll-area', 'aspect-ratio', 'carousel', 'resizable']],
  ['Gráficos', ['chart']],
  ['Enterprise', ['data-table', 'chart-analytics', 'file-upload', 'login-form']],
  ['Avanzados', ['stepper', 'date-range-picker', 'multi-select', 'tag-input', 'number-input', 'tree-view', 'timeline', 'stat-card', 'empty-state', 'toolbar']],
  ['Pro', ['kanban', 'notification-center', 'rating', 'color-picker']],
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

// Inline-SVG glyphs for the previews (the docs CSS has no Tailwind, so previews use vars + these).
const g = (d, sw = 2) => `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const chk = g('<path d="M20 6L9 17l-5-5"/>', 3);
const chev = g('<path d="M6 9l6 6 6-6"/>');
const info = g('<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>');

// Static, var-styled previews — visually identical to the rendered component (same tokens), dark-aware.
const PREVIEWS = {
  button: `<span class="pv-btn">Botón</span><span class="pv-btn secondary">Secondary</span><span class="pv-btn outline">Outline</span><span class="pv-btn ghost">Ghost</span><span class="pv-btn destructive">Eliminar</span>`,
  input: `<input class="pv-input" placeholder="email@ejemplo.com" />`,
  label: `<span class="pv-label">Correo electrónico</span>`,
  textarea: `<span class="pv-input" style="height:72px;min-width:280px;align-items:flex-start;padding:8px 12px;color:var(--color-muted-foreground)">Escribe tu mensaje…</span>`,
  checkbox: `<span class="pv-check">${chk}</span><span class="pv-label">Aceptar términos</span>&nbsp;&nbsp;<span class="pv-check empty"></span><span class="pv-muted">Sin marcar</span>`,
  switch: `<span class="pv-switch"></span><span class="pv-label">Activado</span>&nbsp;&nbsp;<span class="pv-switch off"></span><span class="pv-muted">Apagado</span>`,
  'radio-group': `<span class="pv-radio on"></span> <span class="pv-label">Opción A</span> &nbsp;&nbsp; <span class="pv-radio"></span> <span class="pv-muted">Opción B</span>`,
  select: `<span class="pv-input" style="justify-content:space-between;min-width:200px">Perú ${chev}</span>`,
  slider: `<span class="pv-slider"><i></i><b></b></span>`,
  combobox: `<span class="pv-input" style="justify-content:space-between;min-width:240px"><span class="pv-muted">Buscar framework…</span> ${chev}</span>`,
  'input-otp': `<span class="pv-otp">2</span><span class="pv-otp">4</span><span class="pv-otp">8</span><span class="pv-otp">1</span>`,
  'form-field': `<div class="pv-card" style="display:flex;flex-direction:column;gap:6px"><span class="pv-label">Nombre</span><input class="pv-input" placeholder="Tu nombre" /><span class="pv-muted">Como aparece en tu perfil.</span></div>`,
  card: `<div class="pv-card"><div style="font-weight:600;margin-bottom:2px">Plan Pro</div><div class="pv-muted">$29/mes · facturación anual</div></div>`,
  badge: `<span class="pv-badge">Default</span><span class="pv-badge secondary">Secondary</span><span class="pv-badge destructive">Destructive</span><span class="pv-badge outline">Outline</span>`,
  avatar: `<span class="pv-avatar">GF</span><span class="pv-avatar">AT</span><span class="pv-avatar">LM</span>`,
  separator: `<div style="width:100%;max-width:320px"><div style="font-size:13px">Sección superior</div><div class="pv-sep" style="margin:10px 0"></div><div style="font-size:13px">Sección inferior</div></div>`,
  alert: `<div class="pv-alert"><span style="color:var(--color-primary)">${info}</span><div><div style="font-weight:600;font-size:14px">Heads up</div><div class="pv-muted">Puedes añadir componentes a tu app.</div></div></div>`,
  skeleton: `<div style="display:flex;gap:12px;align-items:center"><div class="pv-skel" style="width:40px;height:40px;border-radius:50%"></div><div style="width:200px"><div class="pv-skel" style="width:70%;margin-bottom:8px"></div><div class="pv-skel" style="width:100%"></div></div></div>`,
  progress: `<span class="pv-progress"><i></i></span><span class="pv-muted">62%</span>`,
  table: `<table class="pv-table"><thead><tr><th>Nombre</th><th>Rol</th><th>Estado</th></tr></thead><tbody><tr><td>Ana Torres</td><td>Admin</td><td><span class="pv-badge">activo</span></td></tr><tr><td>Luis Méndez</td><td>Editor</td><td><span class="pv-badge secondary">invitado</span></td></tr></tbody></table>`,
  toast: `<div class="pv-card" style="display:flex;gap:.7rem;align-items:flex-start;box-shadow:0 8px 24px rgba(0,0,0,.14)"><div style="flex:1"><div style="font-weight:600;font-size:14px">Guardado</div><div class="pv-muted">Cambios aplicados.</div></div><span class="pv-muted">✕</span></div>`,
  dialog: `<div class="pv-card" style="max-width:340px;box-shadow:0 16px 40px rgba(0,0,0,.18)"><div style="font-weight:600;margin-bottom:4px">Confirmar acción</div><div class="pv-muted" style="margin-bottom:14px">¿Seguro que deseas continuar?</div><div style="display:flex;gap:8px;justify-content:flex-end"><span class="pv-btn outline" style="height:32px">Cancelar</span><span class="pv-btn" style="height:32px">Confirmar</span></div></div>`,
  'alert-dialog': `<div class="pv-card" style="max-width:340px;box-shadow:0 16px 40px rgba(0,0,0,.18)"><div style="font-weight:600;margin-bottom:4px">¿Eliminar cuenta?</div><div class="pv-muted" style="margin-bottom:14px">Esta acción no se puede deshacer.</div><div style="display:flex;gap:8px;justify-content:flex-end"><span class="pv-btn outline" style="height:32px">Cancelar</span><span class="pv-btn destructive" style="height:32px">Eliminar</span></div></div>`,
  sheet: `<div class="pv-card" style="width:240px;height:120px;border-radius:var(--radius)"><div style="font-weight:600">Panel lateral</div><div class="pv-muted">Se desliza desde el borde.</div></div>`,
  drawer: `<div class="pv-card" style="width:280px;border-radius:14px 14px 0 0"><div style="width:36px;height:4px;border-radius:9999px;background:var(--color-muted);margin:0 auto 10px"></div><div style="font-weight:600">Hoja inferior</div><div class="pv-muted">Drawer estilo móvil.</div></div>`,
  popover: `<div class="pv-menu" style="padding:14px"><div style="font-weight:600;font-size:14px;padding:0 0 4px">Dimensiones</div><div class="pv-muted" style="padding:0">Ajusta ancho y alto.</div></div>`,
  tooltip: `<span style="position:relative;background:var(--color-foreground);color:var(--color-background);font-size:12px;padding:6px 10px;border-radius:7px">Añadir a la biblioteca</span>`,
  'hover-card': `<div class="pv-card" style="max-width:300px;display:flex;gap:.7rem"><span class="pv-avatar">@</span><div><div style="font-weight:600;font-size:14px">@signng</div><div class="pv-muted">Componentes Angular que posees.</div></div></div>`,
  command: `<div class="pv-menu" style="min-width:300px;padding:0"><div style="padding:10px 12px;border-bottom:1px solid var(--color-border);color:var(--color-muted-foreground);font-size:13px">Escribe un comando…</div><div style="padding:6px"><div class="on" style="padding:7px 10px;border-radius:6px;font-size:13px">Crear usuario</div><div style="padding:7px 10px;font-size:13px">Ir a facturación</div></div></div>`,
  tabs: `<div><div class="pv-tabs"><span class="pv-tab on">Cuenta</span><span class="pv-tab">Contraseña</span><span class="pv-tab">Equipo</span></div></div>`,
  accordion: `<div class="pv-card" style="min-width:320px;padding:0"><div style="padding:12px 16px;display:flex;justify-content:space-between;border-bottom:1px solid var(--color-border)"><span style="font-weight:500;font-size:14px">¿Es accesible?</span><span class="pv-muted">${chev}</span></div><div style="padding:12px 16px" class="pv-muted">Sí. Sigue WAI-ARIA APG.</div></div>`,
  'dropdown-menu': `<div class="pv-menu"><div class="on">Editar</div><div>Duplicar</div><div>Archivar</div></div>`,
  'context-menu': `<div class="pv-menu"><div>Copiar fila</div><div class="on">Fijar</div><div>Eliminar</div></div>`,
  menubar: `<div class="pv-chip" style="gap:1rem;padding:6px 16px"><span>Archivo</span><span class="pv-muted">Editar</span><span class="pv-muted">Ver</span></div>`,
  'navigation-menu': `<div class="pv-chip" style="gap:1rem;padding:8px 16px"><span style="display:inline-flex;align-items:center;gap:4px">Productos ${chev}</span><span class="pv-muted" style="display:inline-flex;align-items:center;gap:4px">Recursos ${chev}</span></div>`,
  breadcrumb: `<span class="pv-muted" style="font-size:14px">Inicio <span style="opacity:.5">/</span> Dashboard <span style="opacity:.5">/</span> <span style="color:var(--color-foreground)">Resumen</span></span>`,
  pagination: `<span class="pv-chip">‹</span><span class="pv-chip" style="background:var(--color-accent)">1</span><span class="pv-chip">2</span><span class="pv-chip">3</span><span class="pv-chip">›</span>`,
  sidebar: `<div class="pv-card" style="width:200px;padding:8px"><div style="padding:8px 10px;border-radius:7px;background:var(--color-accent);font-size:13px;font-weight:500">Dashboard</div><div style="padding:8px 10px;font-size:13px;color:var(--color-muted-foreground)">Usuarios</div><div style="padding:8px 10px;font-size:13px;color:var(--color-muted-foreground)">Ajustes</div></div>`,
  calendar: `<div class="pv-card" style="padding:12px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-size:13px;font-weight:600">junio 2026 ${chev}</div><div style="display:grid;grid-template-columns:repeat(7,26px);gap:2px;font-size:12px;text-align:center">${['L','M','X','J','V','S','D'].map((d) => `<span class="pv-muted">${d}</span>`).join('')}${Array.from({ length: 14 }, (_, i) => `<span style="padding:4px 0;${i === 7 ? 'background:var(--color-primary);color:var(--color-primary-foreground);border-radius:6px' : ''}">${i + 1}</span>`).join('')}</div></div>`,
  'date-picker': `<span class="pv-input" style="justify-content:space-between;min-width:220px">15 jun 2026 ${g('<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>')}</span>`,
  toggle: `<span class="pv-chip" style="background:var(--color-accent);font-weight:600">B</span><span class="pv-chip"><em>I</em></span>`,
  'toggle-group': `<div style="display:inline-flex"><span class="pv-chip" style="border-radius:7px 0 0 7px;background:var(--color-accent)">≡</span><span class="pv-chip" style="border-radius:0;border-left:0">≢</span><span class="pv-chip" style="border-radius:0 7px 7px 0;border-left:0">☰</span></div>`,
  collapsible: `<div class="pv-card" style="min-width:300px"><div style="display:flex;justify-content:space-between;font-size:14px;font-weight:500">Ver más ${chev}</div></div>`,
  'scroll-area': `<div class="pv-card" style="width:200px;height:90px;overflow:hidden;position:relative"><div class="pv-muted" style="font-size:13px">Lista larga…<br/>elemento 1<br/>elemento 2<br/>elemento 3</div><div style="position:absolute;right:3px;top:6px;width:4px;height:40px;border-radius:9999px;background:var(--color-muted)"></div></div>`,
  'aspect-ratio': `<div style="width:200px;aspect-ratio:16/9;border-radius:var(--radius);background:var(--color-muted);display:flex;align-items:center;justify-content:center" class="pv-muted">16 / 9</div>`,
  carousel: `<div style="display:flex;align-items:center;gap:8px"><span class="pv-chip">‹</span><div class="pv-card" style="width:160px;height:80px;display:flex;align-items:center;justify-content:center;font-weight:600">Slide 1</div><span class="pv-chip">›</span></div>`,
  resizable: `<div style="display:flex;border:1px solid var(--color-border);border-radius:var(--radius);overflow:hidden;width:300px;height:80px"><div style="flex:1;display:flex;align-items:center;justify-content:center" class="pv-muted">Panel A</div><div style="width:2px;background:var(--color-border)"></div><div style="flex:1;display:flex;align-items:center;justify-content:center" class="pv-muted">Panel B</div></div>`,
  chart: `<div class="pv-bars">${[40, 55, 48, 70, 62, 80].map((h) => `<i style="height:${h}%"></i>`).join('')}</div>`,
  'data-table': `<div style="width:100%"><div style="display:flex;gap:8px;margin-bottom:8px"><span class="pv-input" style="min-width:140px"><span class="pv-muted">Buscar…</span></span><span class="pv-chip" style="margin-left:auto">⬇ Export CSV</span></div><table class="pv-table" style="width:100%"><thead><tr><th>☐</th><th>Nombre ⌄</th><th>Depto ⌄</th><th style="text-align:right">Ventas ⌄</th></tr></thead><tbody><tr><td>☑</td><td>Ana Torres</td><td>Ventas</td><td style="text-align:right">$4,200</td></tr><tr><td>☐</td><td>Diego Soto</td><td>Marketing</td><td style="text-align:right">$5,200</td></tr></tbody></table></div>`,
  'chart-analytics': `<div style="width:100%"><div class="pv-bars" style="height:72px;gap:14px">${[[30, 14, 6], [38, 20, 10], [48, 24, 12]].map((g) => `<span style="display:flex;align-items:flex-end;gap:3px;height:100%">${g.map((h, i) => `<i style="height:${h}%;width:9px;background:${['#6d4aff', '#22c55e', '#f59e0b'][i]}"></i>`).join('')}</span>`).join('')}</div><div style="display:flex;gap:14px;justify-content:center;margin-top:8px;font-size:11px">${['Free', 'Pro', 'Team'].map((n, i) => `<span style="display:inline-flex;align-items:center;gap:5px"><span style="width:9px;height:9px;border-radius:2px;background:${['#6d4aff', '#22c55e', '#f59e0b'][i]}"></span><span class="pv-muted">${n}</span></span>`).join('')}</div></div>`,
  'file-upload': `<div style="width:100%;display:flex;flex-direction:column;align-items:center;gap:6px;border:2px dashed var(--color-border);border-radius:10px;padding:20px;text-align:center">${g('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/>')}<div style="font-size:14px"><b>Click para subir</b> <span class="pv-muted">o arrastra aquí</span></div></div>`,
  'login-form': `<div class="pv-card" style="max-width:280px;text-align:center"><div style="font-weight:600;margin-bottom:2px">Iniciar sesión</div><div class="pv-muted" style="margin-bottom:12px">Bienvenido de vuelta.</div><div style="text-align:left;display:flex;flex-direction:column;gap:8px"><input class="pv-input" placeholder="email@ejemplo.com" /><input class="pv-input" value="••••••••" /><span class="pv-btn" style="justify-content:center">Entrar</span></div></div>`,
  'stat-card': `<div class="pv-card" style="min-width:200px"><div style="display:flex;justify-content:space-between;align-items:center"><span class="pv-muted">MRR</span></div><div style="display:flex;align-items:flex-end;gap:8px;margin-top:4px"><span style="font-size:22px;font-weight:600">$48.2k</span><span style="font-size:11px;font-weight:600;color:var(--color-primary);background:color-mix(in oklab,var(--color-primary) 12%,transparent);border-radius:999px;padding:1px 7px">↗ +12%</span></div></div>`,
  'stepper': `<div style="display:flex;align-items:center;gap:6px;width:100%"><span style="display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:50%;background:var(--color-primary);color:var(--color-primary-foreground);font-size:13px">✓</span><span style="height:1px;flex:1;background:var(--color-primary)"></span><span style="display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:50%;border:2px solid var(--color-primary);color:var(--color-primary);font-size:13px">2</span><span style="height:1px;flex:1;background:var(--color-border)"></span><span style="display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:50%;border:1px solid var(--color-border);color:var(--color-muted-foreground);font-size:13px">3</span></div>`,
  'date-range-picker': `<span class="pv-input" style="min-width:200px;gap:6px">${g('<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>')} 10 jun – 18 jun</span>`,
  'multi-select': `<span class="pv-input" style="min-width:240px;flex-wrap:wrap;gap:4px"><span class="pv-badge secondary" style="border-radius:4px">Angular ✕</span><span class="pv-badge secondary" style="border-radius:4px">TypeScript ✕</span><span style="margin-left:auto" class="pv-muted">⌄</span></span>`,
  'tag-input': `<span class="pv-input" style="min-width:240px;flex-wrap:wrap;gap:4px"><span class="pv-badge secondary" style="border-radius:4px">saas ✕</span><span class="pv-badge secondary" style="border-radius:4px">b2b ✕</span><span class="pv-muted" style="font-size:13px">Añadir…</span></span>`,
  'number-input': `<span style="display:inline-flex;height:36px;border:1px solid var(--color-input);border-radius:8px;overflow:hidden"><span style="display:flex;align-items:center;padding:0 8px">3</span><span style="display:flex;flex-direction:column;border-left:1px solid var(--color-input)"><span style="flex:1;display:flex;align-items:center;padding:0 6px;font-size:9px">▲</span><span style="flex:1;display:flex;align-items:center;padding:0 6px;border-top:1px solid var(--color-input);font-size:9px">▼</span></span></span>`,
  'tree-view': `<div style="font-size:13px;text-align:left;min-width:160px"><div style="padding:3px 6px">⌄ 📁 src</div><div style="padding:3px 6px 3px 22px">⌄ components</div><div style="padding:3px 6px 3px 38px;color:var(--color-muted-foreground)">button.ts</div><div style="padding:3px 6px 3px 38px;color:var(--color-muted-foreground)">dialog.ts</div><div style="padding:3px 6px;color:var(--color-muted-foreground)">README.md</div></div>`,
  'timeline': `<ol style="border-left:1px solid var(--color-border);margin-left:6px;text-align:left;min-width:220px;list-style:none;padding:0">${[['Usuario creado', 'hace 2h'], ['Pago recibido', 'hace 5h']].map(([t, w]) => `<li style="margin-left:18px;margin-bottom:14px;position:relative"><span style="position:absolute;left:-25px;top:0;width:18px;height:18px;border-radius:50%;background:var(--color-primary)"></span><div style="font-size:13px;font-weight:500">${t} <span class="pv-muted" style="font-size:11px">${w}</span></div></li>`).join('')}</ol>`,
  'empty-state': `<div style="display:flex;flex-direction:column;align-items:center;gap:10px;border:1px dashed var(--color-border);border-radius:10px;padding:24px;min-width:240px"><span style="display:flex;width:44px;height:44px;align-items:center;justify-content:center;border-radius:50%;background:var(--color-muted)">${g('<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/>')}</span><div style="font-weight:600;font-size:14px">Sin proyectos</div><div class="pv-muted" style="font-size:13px;text-align:center">Crea tu primer proyecto.</div><span class="pv-btn" style="height:30px">Nuevo</span></div>`,
  'rating': `<span style="display:inline-flex;gap:2px;color:#fbbf24">${[1, 1, 1, 1, 0].map((f) => `<svg width="22" height="22" viewBox="0 0 24 24" fill="${f ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.6"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`).join('')}</span>`,
  'color-picker': `<span class="pv-input" style="gap:8px"><span style="width:20px;height:20px;border-radius:5px;background:#6d4aff;border:1px solid var(--color-border)"></span><span style="font-family:ui-monospace,monospace;font-size:12px">#6D4AFF</span></span>`,
  'kanban': `<div style="display:flex;gap:10px">${[['Por hacer', 2], ['En curso', 1], ['Hecho', 1]].map(([t, n]) => `<div style="width:120px;border:1px solid var(--color-border);border-radius:8px;background:color-mix(in oklab,var(--color-muted) 40%,transparent);padding:6px"><div style="font-size:12px;font-weight:600;margin-bottom:6px">${t} <span class="pv-muted">${n}</span></div>${Array.from({ length: n }, () => `<div class="pv-card" style="min-width:0;padding:6px 8px;margin-bottom:5px;font-size:12px">Tarjeta</div>`).join('')}</div>`).join('')}</div>`,
  'notification-center': `<div style="position:relative;display:inline-flex"><span class="pv-chip" style="width:36px;height:36px;justify-content:center;border-radius:8px">${g('<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>')}</span><span style="position:absolute;top:-5px;right:-5px;background:var(--color-destructive);color:#fff;font-size:10px;font-weight:600;border-radius:999px;min-width:17px;height:17px;display:flex;align-items:center;justify-content:center">2</span></div>`,
  'form': `<div style="width:100%;max-width:280px;text-align:left"><div style="font-size:14px;font-weight:500;margin-bottom:5px">Email <span style="color:var(--color-destructive)">*</span></div><input class="pv-input" style="width:100%;border-color:var(--color-destructive)" value="no-es-email" /><div style="color:var(--color-destructive);font-size:13px;font-weight:500;margin-top:5px">Correo no válido.</div></div>`,
  'range-slider': `<span class="pv-slider" style="width:240px"><span style="position:absolute;left:25%;right:25%;top:0;height:100%;background:var(--color-primary);border-radius:9999px"></span><b style="left:25%"></b><b style="left:75%"></b></span>`,
  'toolbar': `<div style="display:inline-flex;align-items:center;gap:4px;border:1px solid var(--color-border);border-radius:8px;padding:4px;background:var(--color-background)"><span class="pv-btn outline" style="height:30px;width:32px;justify-content:center;padding:0;font-weight:700">B</span><span class="pv-btn outline" style="height:30px;width:32px;justify-content:center;padding:0;font-style:italic">I</span><span style="width:1px;height:20px;background:var(--color-border);margin:0 2px"></span><span class="pv-btn outline" style="height:30px">Exportar</span></div>`,
  'spinner': `<span style="color:var(--color-primary)"><svg width="28" height="28" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" style="opacity:.2"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg></span>`,
  'time-picker': `<span class="pv-input" style="gap:6px;min-width:0">${g('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>')} <span style="font-variant-numeric:tabular-nums">09</span><span class="pv-muted">:</span><span style="font-variant-numeric:tabular-nums">30</span></span>`,
};

function componentHtml(item) {
  const file = item.files[0];
  const preview = PREVIEWS[item.name] ? `<div class="preview">${PREVIEWS[item.name]}</div>` : '';
  return `
  <section id="c-${item.name}" class="component">
    <h3>${esc(item.name)} ${badge(item.type.replace('registry:', ''))}</h3>
    <p class="desc">${esc(item.description)}</p>
    ${depBadges(item)}
    ${preview}
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
/* live-ish component previews (styled by the same oklch vars → dark-aware, no Tailwind/runtime) */
.preview { display: flex; flex-wrap: wrap; gap: .6rem; align-items: center; padding: 1.75rem 1.5rem; border: 1px solid var(--color-border); border-radius: var(--radius) var(--radius) 0 0; background: var(--color-background); margin-top: .5rem; min-height: 56px; }
.preview + .cmd { border-top-left-radius: 0; border-top-right-radius: 0; margin-top: -1px; }
.pv-btn { display: inline-flex; align-items: center; gap: .4rem; height: 36px; padding: 0 16px; border-radius: calc(var(--radius) - 2px); font-size: 14px; font-weight: 500; border: 1px solid transparent; background: var(--color-primary); color: var(--color-primary-foreground); }
.pv-btn.outline { background: transparent; border-color: var(--color-border); color: var(--color-foreground); }
.pv-btn.secondary { background: var(--color-secondary); color: var(--color-secondary-foreground); }
.pv-btn.ghost { background: transparent; color: var(--color-foreground); }
.pv-btn.destructive { background: var(--color-destructive); color: #fff; }
.pv-badge { display: inline-flex; align-items: center; height: 21px; padding: 0 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; background: var(--color-primary); color: var(--color-primary-foreground); }
.pv-badge.secondary { background: var(--color-secondary); color: var(--color-secondary-foreground); }
.pv-badge.destructive { background: var(--color-destructive); color: #fff; }
.pv-badge.outline { background: transparent; border: 1px solid var(--color-border); color: var(--color-foreground); }
.pv-input { height: 36px; padding: 0 12px; border: 1px solid var(--color-input); border-radius: calc(var(--radius) - 2px); background: var(--color-background); color: var(--color-foreground); font: 14px ui-sans-serif, system-ui; min-width: 220px; display: inline-flex; align-items: center; }
.pv-label { font-size: 14px; font-weight: 500; }
.pv-muted { color: var(--color-muted-foreground); font-size: 13px; }
.pv-card { border: 1px solid var(--color-border); border-radius: var(--radius); background: var(--color-card); padding: 1rem 1.25rem; min-width: 250px; box-shadow: 0 1px 2px rgba(0,0,0,.05); }
.pv-switch { width: 40px; height: 22px; border-radius: 9999px; background: var(--color-primary); position: relative; flex: none; }
.pv-switch::after { content: ''; position: absolute; top: 2px; left: 20px; width: 18px; height: 18px; border-radius: 50%; background: #fff; }
.pv-switch.off { background: var(--color-muted); }
.pv-switch.off::after { left: 2px; }
.pv-check { width: 18px; height: 18px; border-radius: 5px; background: var(--color-primary); color: var(--color-primary-foreground); display: inline-flex; align-items: center; justify-content: center; flex: none; }
.pv-check.empty { background: transparent; border: 1px solid var(--color-input); }
.pv-radio { width: 16px; height: 16px; border-radius: 50%; border: 2px solid var(--color-input); display: inline-block; vertical-align: middle; position: relative; flex: none; }
.pv-radio.on { border-color: var(--color-primary); }
.pv-radio.on::after { content: ''; position: absolute; inset: 3px; border-radius: 50%; background: var(--color-primary); }
.pv-avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--color-muted); color: var(--color-foreground); display: inline-flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; flex: none; }
.pv-progress { width: 240px; height: 8px; border-radius: 9999px; background: var(--color-muted); overflow: hidden; }
.pv-progress > i { display: block; height: 100%; width: 62%; background: var(--color-primary); }
.pv-skel { height: 14px; border-radius: 6px; background: var(--color-muted); }
.pv-sep { height: 1px; background: var(--color-border); width: 100%; }
.pv-slider { width: 240px; height: 6px; border-radius: 9999px; background: var(--color-muted); position: relative; }
.pv-slider > i { position: absolute; left: 0; top: 0; height: 100%; width: 55%; background: var(--color-primary); border-radius: 9999px; }
.pv-slider > b { position: absolute; left: 55%; top: 50%; transform: translate(-50%,-50%); width: 16px; height: 16px; border-radius: 50%; background: var(--color-background); border: 2px solid var(--color-primary); }
.pv-otp { width: 38px; height: 44px; border: 1px solid var(--color-input); border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 600; }
.pv-tabs { display: inline-flex; gap: 4px; padding: 4px; border-radius: 9px; background: var(--color-muted); }
.pv-tab { padding: 6px 14px; border-radius: 7px; font-size: 13px; font-weight: 500; color: var(--color-muted-foreground); }
.pv-tab.on { background: var(--color-background); color: var(--color-foreground); box-shadow: 0 1px 2px rgba(0,0,0,.1); }
.pv-chip { display: inline-flex; align-items: center; gap: .4rem; padding: 6px 12px; border: 1px solid var(--color-border); border-radius: calc(var(--radius) - 2px); background: var(--color-background); font-size: 13px; }
.pv-menu { border: 1px solid var(--color-border); border-radius: var(--radius); background: var(--color-popover, var(--color-card)); box-shadow: 0 8px 24px rgba(0,0,0,.12); padding: 4px; min-width: 180px; }
.pv-menu div { padding: 7px 10px; border-radius: 6px; font-size: 13px; }
.pv-menu div.on { background: var(--color-accent); color: var(--color-accent-foreground); }
.pv-alert { display: flex; gap: .6rem; border: 1px solid var(--color-border); border-radius: var(--radius); background: var(--color-card); padding: .85rem 1rem; min-width: 320px; }
.pv-table { border-collapse: collapse; font-size: 13px; min-width: 320px; }
.pv-table th, .pv-table td { text-align: left; padding: 7px 12px; border-bottom: 1px solid var(--color-border); }
.pv-table th { color: var(--color-muted-foreground); font-weight: 500; }
.pv-bars { display: flex; align-items: flex-end; gap: 7px; height: 64px; }
.pv-bars > i { width: 16px; background: var(--color-primary); border-radius: 3px 3px 0 0; }
@media (max-width: 760px) { .layout { grid-template-columns: 1fr; } aside { display: none; } .patterns { grid-template-columns: 1fr; } }
</style>
</head>
<body>
<button class="toggle" onclick="document.documentElement.classList.toggle('dark')">◐ tema</button>
<div class="layout">
<aside><ul>
<li class="nav-cat">Empezar</li>
<li><a href="#hero">Introducción</a></li>
<li><a href="#start">Get Started</a></li>
<li><a href="#install">Instalación</a></li>
<li><a href="#theming">Tema</a></li>
<li><a href="#cli">CLI</a></li>
<li><a href="#security">Distribución firmada</a></li>
<li><a href="#faq">FAQ</a></li>
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

  <section id="start">
    <h2>Get Started</h2>
    <p class="desc">Tres pasos para tener componentes accesibles en tu app Angular 22.</p>
    <div class="patterns" style="grid-template-columns:repeat(3,1fr);margin-top:1rem">
      <div><strong>1 · init</strong><br/><span class="desc">Pinea el signer, cablea el tema oklch + estilos del overlay.</span></div>
      <div><strong>2 · add</strong><br/><span class="desc">Descarga del registry firmado, verifica firma + SRI, escribe el source a tu repo.</span></div>
      <div><strong>3 · usa</strong><br/><span class="desc">Importa el componente standalone. Es tuyo: edítalo, versiónalo.</span></div>
    </div>
    <pre class="cmd" tabindex="0">pnpm signng init
pnpm signng add button data-table chart-analytics login-form</pre>
    <pre class="src"><code>// app.ts
import { DataTable } from '@/components/ui/data-table';

&#64;Component({ imports: [DataTable], template: \`
  &lt;signng-data-table [data]="rows" [columns]="cols" [selectable]="true" /&gt;
\` })
export class App { /* … */ }</code></pre>
  </section>

  <section id="install" class="card">
    <h2 style="margin-top:0;border:0">Instalación</h2>
    <p class="desc"><strong>Requisitos:</strong> Angular 22 · Tailwind v4 · pnpm. <code>signng init</code> escribe
    <code>ui.config.json</code> (style, aliases, signer pineado) e importa <code>theme.css</code> + <code>signng-overlay.css</code>.</p>
    <pre class="cmd" tabindex="0">pnpm signng init        # pinea el signer, cablea tema + estilos
pnpm signng add button dialog calendar   # verifica firma + SRI, luego escribe
pnpm signng list        # lista los componentes del registry</pre>
    <p class="desc">El CLI es <strong>fail-closed</strong>: si la firma o el hash no cuadran, aborta sin tocar el disco.</p>
  </section>

  <section id="theming" class="card">
    <h2 style="margin-top:0;border:0">Tema · claro / oscuro</h2>
    <p class="desc">El tema vive en <strong>variables CSS oklch</strong> (convención shadcn: <code>--primary</code>,
    <code>--background</code>, <code>--radius</code>…). Cambia el modo poniendo la clase <code>.dark</code> en
    <code>&lt;html&gt;</code> — así los <strong>overlays de CDK</strong> (que se montan en <code>&lt;body&gt;</code>) también heredan el tema.</p>
    <pre class="src"><code>// dark mode: clase en &lt;html&gt; (no en un div interno)
document.documentElement.classList.toggle('dark', isDark);</code></pre>
    <p class="desc">El output de <strong>tweakcn</strong> cae sin cambios — pega un tema oklch en tu <code>theme.css</code> y
    re-tematiza todo sin tocar componentes. El showcase incluye un <strong>customizer visual</strong> (color + radio en vivo).</p>
  </section>

  <section id="cli" class="card">
    <h2 style="margin-top:0;border:0">CLI</h2>
    <table class="pv-table" style="width:100%;border-collapse:collapse;font-size:13px">
      <thead><tr><th style="text-align:left;padding:6px 10px;border-bottom:1px solid var(--color-border)">Comando</th><th style="text-align:left;padding:6px 10px;border-bottom:1px solid var(--color-border)">Qué hace</th></tr></thead>
      <tbody>
        <tr><td style="padding:6px 10px"><code>signng init</code></td><td style="padding:6px 10px" class="desc">Configura el proyecto: ui.config.json, tema, estilos, signer pineado.</td></tr>
        <tr><td style="padding:6px 10px"><code>signng add &lt;...&gt;</code></td><td style="padding:6px 10px" class="desc">Resuelve deps, verifica firma + SRI, escribe el source (fail-closed).</td></tr>
        <tr><td style="padding:6px 10px"><code>signng list</code></td><td style="padding:6px 10px" class="desc">Lista todos los componentes disponibles en el registry.</td></tr>
      </tbody>
    </table>
  </section>

  <section id="security" class="card">
    <h2 style="margin-top:0;border:0">Distribución firmada — la cuña enterprise</h2>
    <p class="desc">El registry se firma con <strong>${esc(index.algorithm || 'ed25519')}</strong>. El CLI verifica la firma contra el <strong>signer pineado</strong> y el hash <strong>SRI</strong> de cada archivo <em>antes</em> de escribir — <strong>fail-closed</strong>: si algo no cuadra, no escribe nada.</p>
    <p class="integrity">signer (pubkey): ${esc(signer)}…</p>
    <p class="integrity">signature: ${esc(sig)}…</p>
  </section>

  <section id="faq">
    <h2>FAQ</h2>
    <details class="card"><summary style="font-size:15px;color:var(--color-foreground);font-weight:500">¿Por qué no usar Angular Material o PrimeNG?</summary>
      <p class="desc" style="margin-top:.5rem">Son paquetes de <code>node_modules</code>: reescribir su look pelea con su CSS. signng copia el <em>source</em> a tu repo — lo posees y editas como cualquier archivo tuyo, igual que shadcn en React.</p></details>
    <details class="card"><summary style="font-size:15px;color:var(--color-foreground);font-weight:500">¿Es accesible de verdad?</summary>
      <p class="desc" style="margin-top:.5rem">Sí. WCAG 2.2 AA validado con <strong>axe en CI</strong> (0 violaciones) sobre 32 specs Playwright, bajo SSR + hidratación + zoneless. El ARIA vive en host bindings — un consumidor no lo puede quitar.</p></details>
    <details class="card"><summary style="font-size:15px;color:var(--color-foreground);font-weight:500">¿Cómo se actualiza un componente copiado?</summary>
      <p class="desc" style="margin-top:.5rem">Vuelves a correr <code>signng add &lt;nombre&gt;</code> (sobrescribe) y revisas el diff como un PR. La capa a11y crítica vive en <code>@signng/core</code> (npm, parchable por <code>ng update</code>); solo el cosmético se copia.</p></details>
    <details class="card"><summary style="font-size:15px;color:var(--color-foreground);font-weight:500">¿Soporta i18n y dark mode?</summary>
      <p class="desc" style="margin-top:.5rem">Sí. Token central <code>SIGNNG_I18N</code> + <code>provideSignngI18n()</code> traduce todos los textos desde un sitio; las fechas son locale-aware (Intl). Dark mode vía <code>.dark</code> en <code>&lt;html&gt;</code> (los overlays heredan).</p></details>
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

// ---- Standalone icon library page (search + copy SVG / component) ----
const svgMarkup = (paths, sw = 2) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">` +
  paths.map((d) => `<path d="${d}"/>`).join('') +
  `</svg>`;
const libCard = (e) =>
  `<button class="ic" data-name="${esc(e.name)}" data-svg="${esc(svgMarkup(e.paths))}">` +
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24">` +
  e.paths.map((d) => `<path d="${esc(d)}"/>`).join('') +
  `</svg><span>${esc(e.name)}</span></button>`;

const iconsPage = `<!doctype html>
<html lang="es" class="">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>signng — librería de iconos</title>
<style>
${themeCss}
* { box-sizing: border-box; }
body { margin: 0; background: var(--color-background); color: var(--color-foreground); font: 15px/1.6 ui-sans-serif, system-ui, sans-serif; }
.wrap { max-width: 1040px; margin: 0 auto; padding: 2rem 1.5rem 4rem; }
header { display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
h1 { font-size: 1.6rem; letter-spacing: -.02em; margin: 0; display: flex; align-items: center; gap: .5rem; }
h1 svg { color: var(--color-primary); }
.muted { color: var(--color-muted-foreground); font-size: 14px; }
.controls { display: flex; flex-wrap: wrap; gap: .5rem; align-items: center; margin: 1rem 0 1.25rem; }
input[type=search] { flex: 1; min-width: 200px; height: 40px; padding: 0 .8rem; border: 1px solid var(--color-input); border-radius: 10px; background: var(--color-background); color: var(--color-foreground); font: inherit; outline: none; }
input[type=search]:focus { box-shadow: 0 0 0 2px var(--color-ring); }
.seg { display: inline-flex; border: 1px solid var(--color-border); border-radius: 10px; overflow: hidden; }
.seg button { border: 0; background: var(--color-background); color: var(--color-foreground); padding: 8px 14px; font: inherit; font-size: 13px; cursor: pointer; }
.seg button.on { background: var(--color-accent); color: var(--color-accent-foreground); }
.toggle { border: 1px solid var(--color-border); background: var(--color-card); color: var(--color-foreground); border-radius: 10px; padding: 8px 12px; cursor: pointer; font-size: 13px; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 10px; }
.ic { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 16px 6px; border: 1px solid var(--color-border); border-radius: var(--radius); background: var(--color-card); color: var(--color-foreground); cursor: pointer; font: inherit; font-size: 11px; transition: background .12s, border-color .12s, transform .12s; }
.ic:hover { background: var(--color-accent); color: var(--color-accent-foreground); transform: translateY(-1px); }
.ic.copied { border-color: var(--color-primary); }
.ic span { color: var(--color-muted-foreground); }
.ic.hide { display: none; }
.toast { position: fixed; bottom: 1.25rem; left: 50%; transform: translateX(-50%) translateY(20px); background: var(--color-foreground); color: var(--color-background); padding: 10px 18px; border-radius: 10px; font-size: 13px; font-weight: 600; opacity: 0; transition: .2s; pointer-events: none; }
.toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
</style>
</head>
<body>
<div class="wrap">
  <header>
    <h1>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="26" height="26"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>
      Librería de iconos <span class="muted">${ICON_ENTRIES.length} · signng</span>
    </h1>
    <button class="toggle" onclick="document.documentElement.classList.toggle('dark')">◐ tema</button>
  </header>
  <p class="muted">Iconos stroke propios (24px, sin dependencia). Busca, elige el formato y click para copiar. <a href="index.html">← docs</a></p>
  <div class="controls">
    <input type="search" id="q" placeholder="Buscar icono…" autocomplete="off" />
    <div class="seg">
      <button id="m-comp" class="on">&lt;signng-icon&gt;</button>
      <button id="m-svg">SVG</button>
    </div>
  </div>
  <div class="grid" id="grid">${ICON_ENTRIES.map(libCard).join('')}</div>
</div>
<div class="toast" id="toast">Copiado</div>
<script>
var mode = 'comp';
document.getElementById('m-comp').onclick = function () { mode = 'comp'; this.classList.add('on'); document.getElementById('m-svg').classList.remove('on'); };
document.getElementById('m-svg').onclick = function () { mode = 'svg'; this.classList.add('on'); document.getElementById('m-comp').classList.remove('on'); };
var toast = document.getElementById('toast');
document.querySelectorAll('.ic').forEach(function (b) {
  b.addEventListener('click', function () {
    var text = mode === 'svg' ? b.dataset.svg : '<signng-icon name="' + b.dataset.name + '" />';
    navigator.clipboard.writeText(text);
    b.classList.add('copied'); setTimeout(function () { b.classList.remove('copied'); }, 700);
    toast.textContent = 'Copiado: ' + b.dataset.name; toast.classList.add('show');
    setTimeout(function () { toast.classList.remove('show'); }, 1100);
  });
});
document.getElementById('q').addEventListener('input', function (e) {
  var q = e.target.value.toLowerCase().trim();
  document.querySelectorAll('.ic').forEach(function (b) {
    b.classList.toggle('hide', q && b.dataset.name.indexOf(q) === -1);
  });
});
</script>
</body>
</html>`;
writeFileSync(resolve(OUT, 'icons.html'), iconsPage);
console.log(`✔ icons -> docs/icons.html  (${ICON_ENTRIES.length} icons)`);
