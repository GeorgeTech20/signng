<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/signng-logo-dark.svg">
  <img src="assets/signng-logo-light.svg" alt="signng" width="240">
</picture>

### Componentes Angular accesibles que **copias a tu repo y posees**

Instalados por un CLI que **verifica firma + integridad antes de escribir**.
Signals-native · zoneless · SSR · WCAG 2.2 AA · cero dependencias pesadas.

![Angular](https://img.shields.io/badge/Angular-22-dd0031)
![WCAG](https://img.shields.io/badge/WCAG%202.2-AA%20(axe%200)-22c55e)
![componentes](https://img.shields.io/badge/componentes-68-6d4aff)
![registry](https://img.shields.io/badge/registry-ed25519%20firmado-0ea5e9)
![tests](https://img.shields.io/badge/Playwright-32%20passing-2ea44f)
![license](https://img.shields.io/badge/license-MIT-black)

</div>

---

## ¿Qué es signng?

signng es una librería de componentes Angular al estilo **shadcn/ui**: no instalas un paquete opaco
de `node_modules`, sino que un CLI **copia el código fuente de cada componente a tu proyecto**. Tú lo
posees, lo editas, lo versionas. La diferencia frente a copiar-pegar a mano: el CLI trae el código
desde un **registry firmado criptográficamente** y lo verifica **antes** de escribir nada — la cuña
que hace esto viable en entornos enterprise.

```bash
pnpm signng init                          # pinea el signer, cablea tema + estilos
pnpm signng add button dialog calendar    # verifica firma + SRI, luego escribe
```

- **Accesible de verdad** — WCAG 2.2 AA, validado con **axe en CI** (0 violaciones), teclado completo,
  focus management, `aria-*` que un consumidor no puede quitar (viven en host bindings).
- **Moderno** — `signal()`/`model()`/`input()`, zoneless, SSR + hydration incremental, `OnPush`. Sin
  `@Input()`/`@Output()`/`EventEmitter`, sin `NgModule`.
- **Sin dependencias pesadas** — charts en SVG puro (sin Recharts), icon set propio (sin lucide).
- **Distribución firmada** — registry `ed25519` + SRI por archivo + signer pineado, **fail-closed**.

---

## Los 3 patrones de arquitectura

signng no reinventa la accesibilidad — la **hereda** donde puede, **compone** donde conviene, y solo
**autora** lo que no existe:

| Patrón | Qué hace | Componentes |
|---|---|---|
| **Heredar a11y** | wrap de `@angular/aria` (Developer Preview de Google) | Tabs · Accordion · Select · DropdownMenu · ContextMenu · Menubar |
| **Componer CDK** | overlays sobre `@angular/cdk` (focus trap, posicionamiento) | Dialog · AlertDialog · Sheet · Drawer · Popover · Tooltip · HoverCard · Toast · Command · NavigationMenu |
| **Net-new (autorado)** | primitivos controlados desde cero, signals-only | Slider · Switch · Checkbox · RadioGroup · ToggleGroup · Combobox · Calendar · InputOTP · Carousel · Resizable |

---

## Quickstart

```bash
# en tu app Angular 22 (Tailwind v4)
pnpm signng init
pnpm signng add button card dialog form-field input select

# el CLI:
#  1. resuelve dependencias (registry + npm)
#  2. descarga el registry firmado
#  3. verifica la firma ed25519 contra el signer pineado
#  4. verifica el hash SRI de cada archivo
#  5. solo entonces escribe los archivos a src/components/ui/
#  → si algo no cuadra, NO escribe nada (fail-closed)
```

```html
<!-- úsalos como componentes/directivas normales -->
<button signngButton variant="outline">Guardar</button>

<signng-dialog title="Confirmar" triggerLabel="Abrir">
  <p>Contenido del modal.</p>
</signng-dialog>

<signng-bar-chart [data]="ventas" [height]="200" />
```

---

## Componentes (68)

<details open>
<summary><b>Formularios</b> (14)</summary>

`button` · `input` · `label` · `textarea` · `checkbox` · `switch` · `radio-group` · `select` ·
`slider` · `range-slider` (2 thumbs) · `combobox` · `input-otp` · `form-field` · `form` (validación reactive-forms)
</details>

<details>
<summary><b>Overlays</b> (9)</summary>

`dialog` · `alert-dialog` · `sheet` · `drawer` · `popover` · `tooltip` · `hover-card` · `toast` ·
`command`
</details>

<details>
<summary><b>Navegación</b> (9)</summary>

`tabs` · `accordion` · `dropdown-menu` · `context-menu` · `menubar` · `navigation-menu` ·
`breadcrumb` · `pagination` · `sidebar`
</details>

<details>
<summary><b>Fecha</b> (2)</summary>

`calendar` (grid APG: arrows/Home/End/PageUp-Down, Intl, min/max) · `date-picker`
</details>

<details>
<summary><b>Display</b> (9)</summary>

`card` · `badge` · `avatar` · `separator` · `alert` · `skeleton` · `progress` · `table` · `icon`
(~30 iconos stroke propios)
</details>

<details>
<summary><b>Interacción</b> (7)</summary>

`toggle` · `toggle-group` · `collapsible` · `scroll-area` · `aspect-ratio` · `carousel` · `resizable`
</details>

<details open>
<summary><b>Charts</b> — SVG puro, signals, role=img, sin deps (7 tipos)</summary>

`bar` · `line` · `area` · `donut` · `pie` · `radial` (gauge) · `sparkline` — con gridlines, ejes,
curva smooth, gradientes y **tooltip on hover**.
</details>

<details open>
<summary><b>Enterprise</b> — los que separan "bonito" de app de negocio (4)</summary>

- **`data-table`** — orden, búsqueda global, selección de filas, **edición inline**, **agrupación**, paginación, **export CSV**
- **`chart-analytics`** — multi-serie: multi-line (crosshair), barras apiladas/agrupadas, scatter, heatmap, leyenda
- **`file-upload`** — drag-drop FileUpload + ImageUpload (preview), validación tipo/tamaño
- **`login-form`** — bloque auth (login/signup/forgot) + proveedores sociales
</details>

<details open>
<summary><b>Avanzados</b> — formularios y datos de negocio (10)</summary>

`stepper` (wizard) · `date-range-picker` · `multi-select` (chips) · `tag-input` · `number-input`
(spinner/moneda) · `tree-view` · `timeline` · `stat-card` (KPI) · `empty-state` · `toolbar` (roving tabindex)
</details>

<details open>
<summary><b>Pro</b> — interacción rica (4)</summary>

`kanban` (drag-drop sobre @angular/cdk) · `notification-center` (inbox + badge) · `rating` (estrellas) ·
`color-picker` (swatches + hex)
</details>

---

## Internacionalización (i18n)

El texto por-instancia (`label`/`title`/`placeholder`/`triggerLabel`/`items`) se pasa como input → ya
traducible. Las fechas son locale-aware vía `Intl` (Calendar/DatePicker: `locale` + `weekStartsOn`).
El resto — aria-labels de botones-icono y defaults ("Cerrar", "Página siguiente", "Sin resultados"…) —
sale de un **único token** `SIGNNG_I18N` (defaults en inglés). Traduces toda la librería desde un sitio:

```ts
import { provideSignngI18n } from '@/components/ui/i18n';

bootstrapApplication(App, {
  providers: [
    provideSignngI18n({
      close: 'Cerrar',
      calendarPrevMonth: 'Mes anterior',
      paginationNext: 'Página siguiente',
      paginationPage: (n) => `Página ${n}`,
      // … sobreescribe solo lo que necesites; el resto cae a los defaults en inglés
    }),
  ],
});
```

## Modelo de seguridad — la cuña enterprise

El problema de "copia-pega del registry": ¿cómo sabes que el código que escribes en tu repo no fue
manipulado? signng lo resuelve:

1. **Registry firmado** — cada build firma el índice del registry con **`ed25519`**.
2. **Signer pineado** — `signng init` guarda la clave pública del signer en `ui.config.json`.
3. **SRI por archivo** — cada archivo lleva un hash `sha256` (el análogo del `integrity` de un lockfile).
4. **Verify-before-write, fail-closed** — el CLI verifica firma **y** hash **antes** de escribir; si
   algo no cuadra, aborta sin tocar el disco. Probado con **9 tests adversariales** (tamper de archivo,
   de firma, signer atacante, path traversal, http).
5. **CI/SAST** — `security:lint` (banea `bypassSecurityTrust*`/`innerHTML`/`eval`), CodeQL, OSV,
   Semgrep, **SBOM** CycloneDX, y un `release.yml` con OIDC + provenance (Sigstore keyless).

```bash
pnpm security:lint     # 0 sinks prohibidos en 132 archivos
pnpm security:test     # 9/9 fail-closed
```

---

## Arquitectura del repo

```
signng-ui/
├─ projects/signng/core/      # primitivos publicables (@signng/core, entry points secundarios)
│  ├─ slider/ switch/ checkbox/ radio-group/ dialog/ tabs/ accordion/ primitives/
├─ registry/
│  ├─ items/ui/*.ts             # los componentes "helm" (el código que copias)
│  ├─ build-registry.mts        # firma + SRI -> registry/public/r/*.json
│  └─ public/r/                 # registry firmado servido al CLI
├─ packages/cli/                # el CLI `signng` (init / add, verify-before-write)
├─ projects/playground/         # demo + dashboard admin (usa los 48 componentes)
├─ tokens/                      # design tokens (DTCG) -> theme.css oklch
├─ tools/                       # docs.mjs (sitio), sbom.mjs, cosign.mjs
├─ docs/index.html              # sitio de docs generado desde el registry firmado
└─ e2e/a11y.spec.ts             # gate Playwright + axe (SSR + hydration + zoneless)
```

---

## Desarrollo

```bash
pnpm install
pnpm verify:all     # core + unit + tokens + registry firmado + lint + fail-closed + playground + a11y
pnpm run docs       # genera docs/index.html desde el registry
pnpm run sbom       # SBOM CycloneDX

# individuales
pnpm registry:build         # re-firma el registry
pnpm exec playwright test   # 32 specs: axe 0 violaciones + interacción (teclado, overlays, charts)
```

**Gate de calidad** (cada componente pasa por aquí antes de commit): build → `verify:all` →
**review adversarial multi-agente** → fix → commit. Este loop cazó ~30 bugs reales que los tests
"felices" ocultaban (teclado de menú muerto, pause-on-hover de toast, nav sobre días disabled del
calendar, dead-first-click del combobox, contraste de alert, etc.).

---

## Demo — dashboard admin

El playground incluye un **dashboard admin** que compone los 48 componentes: sidebar colapsable,
command palette (⌘K), stat cards con sparklines, charts (bar/line/area/donut/pie/radial), tabla con
avatars + badges de estado + menús de fila dentro de un context-menu, formulario completo, drawer,
calendar, y más — con tema oklch claro/oscuro.

```bash
pnpm exec ng build playground && PORT=4000 node e2e/static-server.mjs
# abre http://localhost:4000  →  "Ver dashboard →"
```

---

## Estado

- **68 componentes** · **51 items firmados** · **7 tipos de chart** · icon set propio (~30)
- **32/32 Playwright** verde · **axe 0 violaciones WCAG 2.2 AA** · `security:lint` limpio (132 archivos)
- 3 patrones arquitectónicos cubiertos · distribución firmada · CI/SAST + SBOM + docs site

**Pendiente (gated externamente):** publicar a npm (`@signng/*` org + trusted publisher); el
`release.yml` con OIDC + provenance ya está listo para dispararse en un tag.

---

## Licencia

MIT
