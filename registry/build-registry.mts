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
    name: 'i18n',
    type: 'registry:lib',
    description: 'SIGNNG_I18N token + provideSignngI18n() — translate all built-in UI strings from one place.',
    files: [{ src: 'ui/i18n.ts', target: 'src/components/ui/i18n.ts', type: 'registry:lib' }],
  },
  {
    name: 'data-table',
    type: 'registry:ui',
    description: 'Smart DataTable: sort, global search, row selection, inline edit, grouping, pagination, CSV export.',
    registryDependencies: ['utils', 'icon', 'i18n'],
    files: [{ src: 'ui/data-table.ts', target: 'src/components/ui/data-table.ts', type: 'registry:ui' }],
  },
  {
    name: 'chart-analytics',
    type: 'registry:ui',
    description: 'Multi-series analytics charts: multi-line, stacked/grouped bars, scatter, heatmap, legend, hover crosshair.',
    files: [{ src: 'ui/chart-analytics.ts', target: 'src/components/ui/chart-analytics.ts', type: 'registry:ui' }],
  },
  {
    name: 'file-upload',
    type: 'registry:ui',
    description: 'Drag-and-drop FileUpload + ImageUpload (thumbnail preview), type/size validation.',
    registryDependencies: ['icon'],
    files: [{ src: 'ui/file-upload.ts', target: 'src/components/ui/file-upload.ts', type: 'registry:ui' }],
  },
  {
    name: 'login-form',
    type: 'registry:ui',
    description: 'Composed auth block (login / signup / forgot) with optional social providers.',
    registryDependencies: ['utils', 'button', 'input', 'label', 'card'],
    files: [{ src: 'ui/login-form.ts', target: 'src/components/ui/login-form.ts', type: 'registry:ui' }],
  },
  {
    name: 'stat-card',
    type: 'registry:ui',
    description: 'KPI tile: label, value, colored delta chip, optional icon.',
    registryDependencies: ['icon'],
    files: [{ src: 'ui/stat-card.ts', target: 'src/components/ui/stat-card.ts', type: 'registry:ui' }],
  },
  {
    name: 'empty-state',
    type: 'registry:ui',
    description: 'Centered empty/zero-results placeholder with icon, title, action slot.',
    registryDependencies: ['icon'],
    files: [{ src: 'ui/empty-state.ts', target: 'src/components/ui/empty-state.ts', type: 'registry:ui' }],
  },
  {
    name: 'timeline',
    type: 'registry:ui',
    description: 'Vertical activity feed with colored nodes, title, time, description.',
    registryDependencies: ['icon'],
    files: [{ src: 'ui/timeline.ts', target: 'src/components/ui/timeline.ts', type: 'registry:ui' }],
  },
  {
    name: 'stepper',
    type: 'registry:ui',
    description: 'Multi-step wizard progress indicator (numbered nodes, connectors, aria-current).',
    registryDependencies: ['icon'],
    files: [{ src: 'ui/stepper.ts', target: 'src/components/ui/stepper.ts', type: 'registry:ui' }],
  },
  {
    name: 'number-input',
    type: 'registry:ui',
    description: 'Numeric spinner: clamp, step, prefix/suffix, arrow keys, role=spinbutton.',
    registryDependencies: ['icon'],
    files: [{ src: 'ui/number-input.ts', target: 'src/components/ui/number-input.ts', type: 'registry:ui' }],
  },
  {
    name: 'multi-select',
    type: 'registry:ui',
    description: 'Multi-select with removable chips + toggle checklist panel (aria-multiselectable).',
    registryDependencies: ['icon', 'i18n'],
    files: [{ src: 'ui/multi-select.ts', target: 'src/components/ui/multi-select.ts', type: 'registry:ui' }],
  },
  {
    name: 'tag-input',
    type: 'registry:ui',
    description: 'Free-text tag entry: Enter/comma adds, Backspace removes, dedup.',
    registryDependencies: ['icon', 'i18n'],
    files: [{ src: 'ui/tag-input.ts', target: 'src/components/ui/tag-input.ts', type: 'registry:ui' }],
  },
  {
    name: 'tree-view',
    type: 'registry:ui',
    description: 'Collapsible hierarchy (file-explorer), recursive ng-template, role=tree.',
    registryDependencies: ['icon'],
    files: [{ src: 'ui/tree-view.ts', target: 'src/components/ui/tree-view.ts', type: 'registry:ui' }],
  },
  {
    name: 'date-range-picker',
    type: 'registry:ui',
    description: 'Popover month grid selecting a start-end date range with tinted in-range days.',
    registryDependencies: ['icon'],
    files: [{ src: 'ui/date-range-picker.ts', target: 'src/components/ui/date-range-picker.ts', type: 'registry:ui' }],
  },
  {
    name: 'rating',
    type: 'registry:ui',
    description: 'Star rating control (hover preview, keyboard, role=slider).',
    files: [{ src: 'ui/rating.ts', target: 'src/components/ui/rating.ts', type: 'registry:ui' }],
  },
  {
    name: 'color-picker',
    type: 'registry:ui',
    description: 'Color picker: preset swatches + native picker + hex field, popover.',
    files: [{ src: 'ui/color-picker.ts', target: 'src/components/ui/color-picker.ts', type: 'registry:ui' }],
  },
  {
    name: 'kanban',
    type: 'registry:ui',
    description: 'Drag-and-drop Kanban board on @angular/cdk/drag-drop (reorder + cross-column transfer).',
    dependencies: ['@angular/cdk'],
    files: [{ src: 'ui/kanban.ts', target: 'src/components/ui/kanban.ts', type: 'registry:ui' }],
  },
  {
    name: 'notification-center',
    type: 'registry:ui',
    description: 'Bell trigger + unread badge + dropdown inbox (mark read / mark all).',
    registryDependencies: ['icon'],
    files: [{ src: 'ui/notification-center.ts', target: 'src/components/ui/notification-center.ts', type: 'registry:ui' }],
  },
  {
    name: 'form',
    type: 'registry:ui',
    description: 'Validation-aware field (shadcn <Form> analogue): label + control + auto error from reactive-forms validators, aria wired.',
    dependencies: ['@angular/forms', '@angular/cdk'],
    files: [{ src: 'ui/form.ts', target: 'src/components/ui/form.ts', type: 'registry:ui' }],
  },
  {
    name: 'range-slider',
    type: 'registry:ui',
    description: 'Two-thumb range slider [low, high] (Radix-style): pointer drag + keyboard, role=slider per thumb.',
    files: [{ src: 'ui/range-slider.ts', target: 'src/components/ui/range-slider.ts', type: 'registry:ui' }],
  },
  {
    name: 'toolbar',
    type: 'registry:ui',
    description: 'role=toolbar with WAI-ARIA roving tabindex (single tab stop, arrow/Home/End) + separators.',
    registryDependencies: ['utils'],
    files: [{ src: 'ui/toolbar.ts', target: 'src/components/ui/toolbar.ts', type: 'registry:ui' }],
  },
  {
    name: 'spinner',
    type: 'registry:ui',
    description: 'Loading spinner (role=status, accessible label, animate-spin, reduced-motion safe).',
    files: [{ src: 'ui/spinner.ts', target: 'src/components/ui/spinner.ts', type: 'registry:ui' }],
  },
  {
    name: 'time-picker',
    type: 'registry:ui',
    description: 'Hour + minute picker via native selects (HH:mm, configurable minute step), zero deps.',
    files: [{ src: 'ui/time-picker.ts', target: 'src/components/ui/time-picker.ts', type: 'registry:ui' }],
  },
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
    registryDependencies: ['utils', 'overlay', 'i18n'],
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
    description: 'Avatar with image + initials fallback; src run through an image-scoped URL allowlist.',
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
    name: 'calendar',
    type: 'registry:ui',
    description: 'Date-grid calendar (controlled APG grid: arrows/Home/End/PageUp-Down, Intl labels).',
    dependencies: ['@angular/cdk'],
    registryDependencies: ['utils', 'i18n'],
    files: [{ src: 'ui/calendar.ts', target: 'src/components/ui/calendar.ts', type: 'registry:ui' }],
  },
  {
    name: 'date-picker',
    type: 'registry:ui',
    description: 'Date picker: trigger button + Calendar in a CDK overlay dialog (focus trap, Esc).',
    dependencies: ['@angular/cdk'],
    registryDependencies: ['utils', 'overlay', 'calendar'],
    files: [{ src: 'ui/date-picker.ts', target: 'src/components/ui/date-picker.ts', type: 'registry:ui' }],
  },
  {
    name: 'combobox',
    type: 'registry:ui',
    description: 'Searchable single-select (controlled APG combobox: input + CDK overlay listbox).',
    dependencies: ['@angular/cdk'],
    registryDependencies: ['utils', 'overlay', 'i18n'],
    files: [{ src: 'ui/combobox.ts', target: 'src/components/ui/combobox.ts', type: 'registry:ui' }],
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
    registryDependencies: ['utils', 'i18n'],
    files: [{ src: 'ui/toast.ts', target: 'src/components/ui/toast.ts', type: 'registry:ui' }],
  },
  {
    name: 'alert',
    type: 'registry:ui',
    description: 'Alert callout (title/description directives, CVA variants).',
    dependencies: ['class-variance-authority'],
    registryDependencies: ['utils'],
    files: [{ src: 'ui/alert.ts', target: 'src/components/ui/alert.ts', type: 'registry:ui' }],
  },
  {
    name: 'skeleton',
    type: 'registry:ui',
    description: 'Skeleton loading placeholder (decorative, aria-hidden).',
    registryDependencies: ['utils'],
    files: [{ src: 'ui/skeleton.ts', target: 'src/components/ui/skeleton.ts', type: 'registry:ui' }],
  },
  {
    name: 'progress',
    type: 'registry:ui',
    description: 'Progress bar (role=progressbar, aria-valuenow/min/max).',
    registryDependencies: ['utils'],
    files: [{ src: 'ui/progress.ts', target: 'src/components/ui/progress.ts', type: 'registry:ui' }],
  },
  {
    name: 'table',
    type: 'registry:ui',
    description: 'Table part directives (native semantics + skin).',
    registryDependencies: ['utils'],
    files: [{ src: 'ui/table.ts', target: 'src/components/ui/table.ts', type: 'registry:ui' }],
  },
  {
    name: 'toggle',
    type: 'registry:ui',
    description: 'Two-state toggle button (aria-pressed, CVA variants).',
    dependencies: ['class-variance-authority'],
    registryDependencies: ['utils'],
    files: [{ src: 'ui/toggle.ts', target: 'src/components/ui/toggle.ts', type: 'registry:ui' }],
  },
  {
    name: 'collapsible',
    type: 'registry:ui',
    description: 'Single disclosure (aria-expanded + lazy region).',
    dependencies: ['@angular/cdk'],
    registryDependencies: ['utils'],
    files: [{ src: 'ui/collapsible.ts', target: 'src/components/ui/collapsible.ts', type: 'registry:ui' }],
  },
  {
    name: 'hover-card',
    type: 'registry:ui',
    description: 'Supplementary hover/focus card (CDK overlay, hoverable, Esc).',
    dependencies: ['@angular/cdk'],
    registryDependencies: ['utils', 'overlay'],
    files: [{ src: 'ui/hover-card.ts', target: 'src/components/ui/hover-card.ts', type: 'registry:ui' }],
  },
  {
    name: 'drawer',
    type: 'registry:ui',
    description: 'Bottom-sheet drawer (grab handle) on @signng/core/dialog.',
    dependencies: ['@signng/core', '@angular/cdk'],
    registryDependencies: ['utils', 'button', 'overlay'],
    files: [{ src: 'ui/drawer.ts', target: 'src/components/ui/drawer.ts', type: 'registry:ui' }],
  },
  {
    name: 'form-field',
    type: 'registry:ui',
    description: 'Form field wrapper (label + control + description + error, role=alert).',
    registryDependencies: ['utils'],
    files: [{ src: 'ui/form-field.ts', target: 'src/components/ui/form-field.ts', type: 'registry:ui' }],
  },
  {
    name: 'sidebar',
    type: 'registry:ui',
    description: 'Collapsible app-shell sidebar (header/content/footer + items + trigger).',
    registryDependencies: ['utils', 'icon', 'i18n'],
    files: [{ src: 'ui/sidebar.ts', target: 'src/components/ui/sidebar.ts', type: 'registry:ui' }],
  },
  {
    name: 'chart',
    type: 'registry:ui',
    description: 'Minimal pure-SVG charts (bar, line, donut, sparkline) — signals, role=img, no deps.',
    files: [{ src: 'ui/chart.ts', target: 'src/components/ui/chart.ts', type: 'registry:ui' }],
  },
  {
    name: 'icon',
    type: 'registry:ui',
    description: 'Owned minimal stroke icon set (~30 feather-style) rendered as path d (no innerHTML).',
    files: [{ src: 'ui/icon.ts', target: 'src/components/ui/icon.ts', type: 'registry:ui' }],
  },
  {
    name: 'navigation-menu',
    type: 'registry:ui',
    description: 'Navigation menu: disclosure triggers revealing projected panels (CDK overlay, hover/click).',
    dependencies: ['@angular/cdk'],
    registryDependencies: ['overlay'],
    files: [{ src: 'ui/navigation-menu.ts', target: 'src/components/ui/navigation-menu.ts', type: 'registry:ui' }],
  },
  {
    name: 'menubar',
    type: 'registry:ui',
    description: 'Menubar: role=menubar of menu buttons, each an @angular/aria Menu in a CDK overlay.',
    dependencies: ['@angular/cdk', '@angular/aria'],
    registryDependencies: ['overlay'],
    files: [{ src: 'ui/menubar.ts', target: 'src/components/ui/menubar.ts', type: 'registry:ui' }],
  },
  {
    name: 'input-otp',
    type: 'registry:ui',
    description: 'Segmented OTP input (role=group, auto-advance, paste, numeric autofill).',
    registryDependencies: ['utils'],
    files: [{ src: 'ui/input-otp.ts', target: 'src/components/ui/input-otp.ts', type: 'registry:ui' }],
  },
  {
    name: 'carousel',
    type: 'registry:ui',
    description: 'Carousel region (prev/next + arrow keys, aria-roledescription, live region).',
    files: [{ src: 'ui/carousel.ts', target: 'src/components/ui/carousel.ts', type: 'registry:ui' }],
  },
  {
    name: 'resizable',
    type: 'registry:ui',
    description: 'Resizable two-panel split (pointer drag + keyboard, role=separator).',
    registryDependencies: ['utils', 'i18n'],
    files: [{ src: 'ui/resizable.ts', target: 'src/components/ui/resizable.ts', type: 'registry:ui' }],
  },
  {
    name: 'toggle-group',
    type: 'registry:ui',
    description: 'Roving toggle group (single/multiple, role=group, arrow nav) reusing toggle variants.',
    registryDependencies: ['utils', 'toggle'],
    files: [{ src: 'ui/toggle-group.ts', target: 'src/components/ui/toggle-group.ts', type: 'registry:ui' }],
  },
  {
    name: 'context-menu',
    type: 'registry:ui',
    description: 'Right-click menu over @angular/aria Menu, positioned at the pointer (CDK overlay).',
    dependencies: ['@angular/cdk', '@angular/aria'],
    registryDependencies: ['utils', 'overlay'],
    files: [{ src: 'ui/context-menu.ts', target: 'src/components/ui/context-menu.ts', type: 'registry:ui' }],
  },
  {
    name: 'scroll-area',
    type: 'registry:ui',
    description: 'Styled scroll container (thin themed scrollbar).',
    registryDependencies: ['utils'],
    files: [{ src: 'ui/scroll-area.ts', target: 'src/components/ui/scroll-area.ts', type: 'registry:ui' }],
  },
  {
    name: 'aspect-ratio',
    type: 'registry:ui',
    description: 'Aspect-ratio box.',
    files: [{ src: 'ui/aspect-ratio.ts', target: 'src/components/ui/aspect-ratio.ts', type: 'registry:ui' }],
  },
  {
    name: 'breadcrumb',
    type: 'registry:ui',
    description: 'Breadcrumb nav part directives (aria-current page, separator).',
    registryDependencies: ['utils'],
    files: [{ src: 'ui/breadcrumb.ts', target: 'src/components/ui/breadcrumb.ts', type: 'registry:ui' }],
  },
  {
    name: 'pagination',
    type: 'registry:ui',
    description: 'Pagination nav (prev/next + windowed page numbers, aria-current page).',
    registryDependencies: ['utils', 'i18n'],
    files: [{ src: 'ui/pagination.ts', target: 'src/components/ui/pagination.ts', type: 'registry:ui' }],
  },
  {
    name: 'command',
    type: 'registry:ui',
    description: 'Command palette: modal (@signng/core/dialog) + filtered command listbox.',
    dependencies: ['@signng/core', '@angular/cdk'],
    registryDependencies: ['utils', 'button', 'overlay', 'i18n'],
    files: [{ src: 'ui/command.ts', target: 'src/components/ui/command.ts', type: 'registry:ui' }],
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
