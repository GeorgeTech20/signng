# signng — Fase 0 (rebanada vertical)

POC que valida la tesis del análisis: **"DX estilo shadcn, estilada sobre `@angular/aria`,
signals-native, con distribución firmada/verificada"** — la cuña que ningún incumbente
(spartan, ng-primitives) ocupa todavía.

No es una librería terminada. Es la **tubería end-to-end** probada con un primitivo de cada
clase, para de-riesgar antes de construir los 32 ítems del MVP.

## Arquitectura (3 capas)

```
tokens/        DTCG (oklch) -> Style Dictionary v5 -> Tailwind v4 @theme + dark   (Capa 3)
registry/      helm copy-paste source (button, slider) + builder con SRI sha256   (Capa 2 distribución)
packages/cli/  @signng/cli — add/init con SRI verify + sandbox + dry-run/diff   (Capa 2 seguridad)
projects/signng/core/   @signng/core  (ng-packagr, APF, secondary entry points)
   ├─ primitives/  safeMerge (anti proto-pollution) + isSafeUrl (anti XSS/redirect)
   ├─ slider/      primitivo net-new: role=slider, teclado, drag, alternativa no-drag  (Capa 1)
   └─ tabs/        adapter sobre @angular/aria (aísla churn Dev Preview)
projects/playground/      app consumidora (SSR + zoneless) que consume todo
e2e/           Playwright + axe-core (WCAG 2.2 AA) + prueba de seguridad fail-closed
```

## Qué quedó probado

| Claim del análisis | Evidencia en este repo |
|---|---|
| APF + secondary entry points tree-shakeable, signals-only | `ng build @signng/core` ✔ (3 entradas) |
| Primitivo a11y net-new (Slider) bajo SSR + hidratación | axe 0 violaciones + teclado 40→41→51→0→100 ✔ |
| Heredar a11y de `@angular/aria` (Tabs) vía adapter | roles/selección aria ✔, 1 archivo aísla el churn |
| Seguridad horneada (proto-pollution, URL allowlist) | 9 unit tests adversariales ✔ |
| Theming oklch portable (drop-in tweakcn) | editar solo `signng-theme.css` re-tematiza, axe sigue AA ✔ |
| Distribución firmada/verificada (la cuña enterprise) | SRI por item + CLI **fail-closed** 6/6 (tamper/traversal/http) ✔ |

## Correr todo

```bash
pnpm install
pnpm verify:all     # core build + unit tests + tokens + registry + security + playground + a11y
```

Individuales: `pnpm tokens:build` · `pnpm registry:build` ·
`pnpm signng add button slider --cwd projects/playground --dry-run` ·
`pnpm a11y` · `pnpm security:test`

## Diferido (post-Fase 0)

Firma cosign/Sigstore real + publish OIDC, los otros 10 primitivos + 18 componentes,
Storybook/Compodoc, MCP server, marketplace de temas. Ver el análisis completo en
`~/.claude/plans/analiza-la-creacion-de-glowing-glacier.md`.
