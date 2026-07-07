import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Toaster, ToastService } from '@/components/ui/toast';

interface Preset {
  key: string;
  label: string;
  primary: string;
  fg: string;
}

const PRESETS: Preset[] = [
  { key: 'violet', label: 'Violet', primary: '#6d4aff', fg: '#ffffff' },
  { key: 'blue', label: 'Blue', primary: '#2563eb', fg: '#ffffff' },
  { key: 'green', label: 'Green', primary: '#16a34a', fg: '#ffffff' },
  { key: 'rose', label: 'Rose', primary: '#e11d48', fg: '#ffffff' },
  { key: 'orange', label: 'Orange', primary: '#ea580c', fg: '#ffffff' },
  { key: 'cyan', label: 'Cyan', primary: '#0891b2', fg: '#ffffff' },
];
const RADII = ['0', '0.375', '0.5', '0.75', '1'];
const STORAGE_KEY = 'signng-theme-customizer';

/**
 * Global visual theme customizer — lets a non-technical stakeholder pick a brand color + corner
 * radius and see every component update live (sets CSS custom properties on <html>), then export
 * the result as a plain :root {} CSS block to hand to a developer. Persists to localStorage so it
 * survives navigation/reload. Mounted once in the app shell (app.html), not per-page.
 */
@Component({
  selector: 'signng-theme-customizer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, Button, Toaster],
  template: `
    <button
      (click)="open.set(!open())"
      [attr.aria-expanded]="open()"
      aria-label="Customize theme"
      class="fixed bottom-4 left-4 z-50 inline-flex h-10 items-center gap-2 rounded-full border border-border bg-background px-4 text-sm font-medium shadow-lg hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span class="size-3.5 rounded-full" [style.background]="'var(--color-primary)'"></span> Customize
    </button>
    @if (open()) {
      <div class="fixed bottom-16 left-4 z-50 w-72 rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-2xl">
        <div class="mb-3 flex items-center justify-between">
          <span class="text-sm font-semibold">Theme</span>
          <button (click)="open.set(false)" aria-label="Close" class="text-muted-foreground hover:text-foreground"><signng-icon name="x" [size]="16" /></button>
        </div>

        <div class="mb-1.5 text-xs font-medium text-muted-foreground">Brand color</div>
        <div class="mb-4 grid grid-cols-6 gap-1.5">
          @for (p of PRESETS; track p.key) {
            <button (click)="applyColor(p)" [style.background]="p.primary" [attr.aria-label]="p.label" [attr.aria-pressed]="themeKey() === p.key"
              [class]="'size-7 rounded-md ring-offset-2 ring-offset-popover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ' + (themeKey() === p.key ? 'ring-2 ring-foreground' : '')"></button>
          }
        </div>

        <div class="mb-1.5 text-xs font-medium text-muted-foreground">Corner radius</div>
        <div class="mb-4 grid grid-cols-5 gap-1.5">
          @for (r of RADII; track r) {
            <button (click)="applyRadius(r)" [class]="'rounded-md border py-1 text-xs ' + (radiusKey() === r ? 'border-primary bg-accent font-medium' : 'border-border')">{{ r }}</button>
          }
        </div>

        <div class="flex gap-2">
          <button signngButton variant="outline" class="flex-1" (click)="resetTheme()">Reset</button>
          <button signngButton class="flex-1" (click)="exportCss()">Export CSS</button>
        </div>

        @if (exported()) {
          <pre class="mt-3 max-h-40 overflow-auto rounded-md bg-muted p-2 text-[11px] leading-relaxed">{{ exported() }}</pre>
          <p class="mt-1 text-[11px] text-muted-foreground">Copied — paste into your app's global CSS.</p>
        }
      </div>
    }
    <signng-toaster />
  `,
})
export class ThemeCustomizer {
  private readonly toast = inject(ToastService);
  protected readonly PRESETS = PRESETS;
  protected readonly RADII = RADII;
  protected readonly open = signal(false);
  protected readonly themeKey = signal('violet');
  protected readonly radiusKey = signal('0.5');
  protected readonly exported = signal('');

  constructor() {
    this.load();
    inject(DestroyRef).onDestroy(() => {});
  }

  private style(): CSSStyleDeclaration | null {
    return typeof document === 'undefined' ? null : document.documentElement.style;
  }

  private save(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ theme: this.themeKey(), radius: this.radiusKey() }));
  }

  private load(): void {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const { theme, radius } = JSON.parse(raw) as { theme?: string; radius?: string };
      const preset = PRESETS.find((p) => p.key === theme);
      if (preset) this.applyColor(preset, false);
      if (radius) this.applyRadius(radius, false);
    } catch {
      /* corrupt/foreign localStorage value — ignore, defaults stand */
    }
  }

  protected applyColor(p: Preset, persist = true): void {
    this.themeKey.set(p.key);
    const s = this.style();
    if (s) {
      s.setProperty('--color-primary', p.primary);
      s.setProperty('--color-primary-foreground', p.fg);
      s.setProperty('--color-ring', p.primary);
    }
    if (persist) this.save();
  }

  protected applyRadius(r: string, persist = true): void {
    this.radiusKey.set(r);
    const s = this.style();
    if (s) {
      // Tailwind v4 `rounded-*` utilities resolve --radius-{sm,md,lg,xl}; override the whole scale so the
      // control actually changes component corners (plain --radius is read by nothing). 0.5 == TW defaults.
      s.setProperty('--radius', `${r}rem`);
      s.setProperty('--radius-sm', `calc(${r}rem - 4px)`);
      s.setProperty('--radius-md', `calc(${r}rem - 2px)`);
      s.setProperty('--radius-lg', `${r}rem`);
      s.setProperty('--radius-xl', `calc(${r}rem + 4px)`);
    }
    if (persist) this.save();
  }

  protected resetTheme(): void {
    const s = this.style();
    if (s) {
      ['--color-primary', '--color-primary-foreground', '--color-ring',
        '--radius', '--radius-sm', '--radius-md', '--radius-lg', '--radius-xl'].forEach((k) => s.removeProperty(k));
    }
    this.themeKey.set('violet');
    this.radiusKey.set('0.5');
    this.exported.set('');
    if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY);
  }

  protected exportCss(): void {
    const preset = PRESETS.find((p) => p.key === this.themeKey()) ?? PRESETS[0];
    const r = this.radiusKey();
    const css = `:root {\n  --color-primary: ${preset.primary};\n  --color-primary-foreground: ${preset.fg};\n  --color-ring: ${preset.primary};\n  --radius: ${r}rem;\n  --radius-sm: calc(${r}rem - 4px);\n  --radius-md: calc(${r}rem - 2px);\n  --radius-lg: ${r}rem;\n  --radius-xl: calc(${r}rem + 4px);\n}`;
    this.exported.set(css);
    navigator.clipboard?.writeText(css);
    this.toast.success('CSS copied', 'Paste into your global stylesheet.');
  }
}
