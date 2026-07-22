# Benchmarks & seguridad — SignNG

> Datos **medidos**, no estimados. Reproducibles con los comandos al pie. Última corrida: 2026-06-18.
> Lo que no medimos todavía está marcado **pendiente** — sin inventar números.

## 1. Footprint por componente (el número que importa)

SignNG es **copy-paste**: tu bundle solo carga los componentes que importas — no hay un paquete-lib en
`node_modules` sumando peso muerto. Tamaño del **código fuente** que copias (gzip):

| Rango | Componentes | gzip |
|---|---|---|
| **Ultra-ligeros** (<0.5 KB) | `label` · `aspect-ratio` · `skeleton` · `separator` · `scroll-area` · `textarea` · `input` | 0.3–0.5 KB |
| **Ligeros** (0.5–1 KB) | `card` · `table` · `badge` · `progress` · `alert` · `form-field` · `radio-group` · `switch` · `breadcrumb` · `toggle` · `button` · `accordion` · `slider` · `drawer` · `dialog` · `sheet` · `popover` | 0.5–1 KB |
| **Medios** (1–2 KB) | `avatar` · `i18n` · `tooltip` · `pagination` · `resizable` · `context-menu` · `sidebar` · `input-otp` · `navigation-menu` · `toggle-group` · `carousel` · `dropdown-menu` · `select` · `date-picker` · `icon` | 1–2 KB |
| **Pesados** (2–4 KB) | `command` · `menubar` · `toast` · `combobox` · `calendar` | 2–3.6 KB |
| **Máximo** | `chart` (7 tipos de gráfico, SVG puro) | 4.1 KB |

**Toda la librería (49 archivos): 154 KB raw / 58 KB gzip.** Promedio **1.2 KB gzip** por componente.
El más chico (`label`) = **318 B**. Un botón = **905 B**. La mayoría de apps usan 8–15 componentes →
**~10–18 KB gzip** de código de UI que además posees y puedes tree-shakear.

## 2. Dependencias de runtime (lo que el consumidor SÍ instala)

Solo 3 utilidades, todas micro y sin CVEs conocidos:

| Dep | Para qué | Peso |
|---|---|---|
| `clsx` | merge de clases | ~0.5 KB |
| `tailwind-merge` | dedup de utilidades Tailwind | ~3 KB |
| `class-variance-authority` | variantes de componente | ~2 KB |

Lo demás (`@angular/*`, `@angular/aria`, `@angular/cdk`) ya está en cualquier app Angular 22 — no es peso
que SignNG agregue. **Charts e iconos son SVG/código propio → cero Recharts, cero lucide.**

## 3. Accesibilidad (medido en CI)

- **axe-core: 0 violaciones WCAG 2.2 AA** — corrido en **32 specs Playwright** bajo **SSR + hidratación + zoneless**.
- Teclado completo, focus management, `aria-*` en host bindings (el consumidor no los puede quitar).
- Contraste AA verificado (tokens oklch ajustados hasta pasar axe color-contrast).

## 4. Seguridad

**Distribución (la superficie de mayor severidad para una lib copy-paste):**
- Registry firmado **ed25519** + **SRI sha256 por archivo**; el CLI verifica firma **y** hash **antes** de
  escribir — **fail-closed**. Probado con **9 tests adversariales** (tamper de archivo/firma, signer atacante,
  path-traversal, http downgrade).
- `security:lint` **limpio: 134 archivos, 0 sinks prohibidos** (`bypassSecurityTrust*`/`innerHTML`/`eval`).
- SBOM CycloneDX generable (`pnpm run sbom`).

**SCA (npm audit) — honesto:**
- **0 vulnerabilidades en deps de runtime** (lo que el consumidor envía).
- 5 advisories existen pero **todas en el toolchain de build dev** (`vite`/`esbuild`/`@babel/core`/`piscina`),
  heredadas de `@angular/build` — las tiene toda app Angular 22, **no van al bundle del consumidor**.

**Pendiente (no corrido aún — no afirmar):** CodeQL · OSV-Scanner · Semgrep · Lighthouse perf · publicación
npm con OIDC + provenance (el `release.yml` existe, sin disparar).

## Reproducir

```bash
# footprint por componente
cd registry/items/ui && for f in *.ts; do echo "$f: $(gzip -c "$f" | wc -c)B gz"; done
pnpm audit --audit-level=low      # SCA
pnpm security:lint                # 0 sinks
pnpm exec playwright test         # axe 0 + 32 specs
```
