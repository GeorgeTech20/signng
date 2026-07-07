import { ChangeDetectionStrategy, Component, signal, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon, ICONS, type IconName } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { ToastService } from '@/components/ui/toast';

const SIZES = [16, 20, 24, 32, 48];
const STROKES = [1, 1.5, 2, 2.5];

/**
 * Icon gallery — Radix-icons-style: adjustable size + stroke width, and a copy mode toggle
 * (Angular component usage vs. raw <svg> markup), so an icon can be tuned before copying.
 */
@Component({
  selector: 'signng-icons-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, Input],
  template: `
    <div class="min-h-screen bg-background text-foreground">
      <div class="sticky top-0 z-20 border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
        <div class="mx-auto flex max-w-5xl flex-wrap items-center gap-3">
          <a routerLink="/" class="flex items-center gap-2 font-bold hover:opacity-80">
            <span class="text-primary"><signng-icon name="bar" [size]="18" /></span> Icons
          </a>
          <span class="rounded border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">{{ filtered().length }}/{{ names().length }}</span>
          <div class="flex-1"></div>
          <input signngInput class="max-w-xs" placeholder="Search icons…" [value]="q()" (input)="q.set($any($event.target).value)" />
        </div>
      </div>

      <!-- Controls bar: size, stroke, copy mode -->
      <div class="border-b border-border bg-muted/20">
        <div class="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5 text-xs">
          <div class="flex items-center gap-1.5">
            <span class="text-muted-foreground">Size</span>
            @for (s of SIZES; track s) {
              <button (click)="size.set(s)" [class]="'rounded px-2 py-0.5 tabular-nums ' + (size() === s ? 'bg-accent font-medium text-accent-foreground' : 'text-muted-foreground hover:bg-accent/50')">{{ s }}</button>
            }
          </div>
          <div class="flex items-center gap-1.5">
            <span class="text-muted-foreground">Stroke</span>
            @for (w of STROKES; track w) {
              <button (click)="stroke.set(w)" [class]="'rounded px-2 py-0.5 tabular-nums ' + (stroke() === w ? 'bg-accent font-medium text-accent-foreground' : 'text-muted-foreground hover:bg-accent/50')">{{ w }}</button>
            }
          </div>
          <div class="flex items-center gap-1.5">
            <span class="text-muted-foreground">Copy as</span>
            <div class="flex rounded-md bg-muted p-0.5">
              <button (click)="copyMode.set('component')" [class]="'rounded px-2 py-0.5 ' + (copyMode() === 'component' ? 'bg-background shadow-sm' : 'text-muted-foreground')">Component</button>
              <button (click)="copyMode.set('svg')" [class]="'rounded px-2 py-0.5 ' + (copyMode() === 'svg' ? 'bg-background shadow-sm' : 'text-muted-foreground')">SVG</button>
            </div>
          </div>
        </div>
      </div>

      <main class="mx-auto max-w-5xl px-4 py-8">
        <p class="mb-6 text-sm text-muted-foreground">
          Feather-style stroke icons, 24px grid, zero dependencies. Adjust size/stroke above,
          then click any icon to copy it as a component or as raw SVG.
        </p>
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
          @for (name of filtered(); track name) {
            <button
              type="button"
              (click)="copy(name)"
              [title]="name"
              class="flex flex-col items-center gap-2 rounded-lg border border-border p-4 text-center hover:border-primary hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span class="flex h-12 items-center justify-center" [style.--stroke]="stroke()">
                <signng-icon [name]="name" [size]="size()" class="[&_svg]:[stroke-width:var(--stroke)]" />
              </span>
              <span class="w-full truncate text-xs text-muted-foreground">{{ name }}</span>
            </button>
          }
        </div>
        @if (!filtered().length) {
          <p class="py-16 text-center text-muted-foreground">No icons match "{{ q() }}".</p>
        }
      </main>
    </div>
  `,
})
export class IconsPage {
  private readonly toast = inject(ToastService);
  protected readonly SIZES = SIZES;
  protected readonly STROKES = STROKES;
  protected readonly names = signal(Object.keys(ICONS) as IconName[]);
  protected readonly q = signal('');
  protected readonly size = signal(24);
  protected readonly stroke = signal(2);
  protected readonly copyMode = signal<'component' | 'svg'>('component');
  protected readonly filtered = computed(() => {
    const query = this.q().toLowerCase().trim();
    return query ? this.names().filter((n) => n.includes(query)) : this.names();
  });

  private svgFor(name: IconName): string {
    const paths = ICONS[name].map((d) => `  <path d="${d}" />`).join('\n');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${this.size()}" height="${this.size()}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${this.stroke()}" stroke-linecap="round" stroke-linejoin="round">\n${paths}\n</svg>`;
  }

  protected copy(name: IconName): void {
    const isSvg = this.copyMode() === 'svg';
    const attrs = `name="${name}"${this.size() !== 20 ? ` [size]="${this.size()}"` : ''}`;
    const out = isSvg ? this.svgFor(name) : `<signng-icon ${attrs} />`;
    navigator.clipboard?.writeText(out);
    this.toast.success(isSvg ? 'SVG copied' : 'Component copied', name);
  }
}
