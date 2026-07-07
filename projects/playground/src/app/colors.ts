import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '@/components/ui/icon';
import { PRESETS } from './theme-customizer';
import { generateScale } from './color-scale';
import { ToastService } from '@/components/ui/toast';

const GROUPS = [
  { range: '1–2', label: 'Backgrounds' },
  { range: '3–5', label: 'Component bg / border / hover' },
  { range: '6–8', label: 'Borders / separators' },
  { range: '9–10', label: 'Solid / accent' },
  { range: '11–12', label: 'Accessible text' },
];

/**
 * Radix-Colors-style scale viewer for signng's brand presets — 12-step OKLCH ramp per preset,
 * click a swatch to copy its oklch(...) value. Generated (see color-scale.ts), not hand-picked;
 * does not replace or migrate the app's actual semantic tokens (background/foreground/border).
 */
@Component({
  selector: 'signng-colors-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon],
  template: `
    <div class="min-h-screen bg-background text-foreground">
      <div class="sticky top-0 z-20 border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
        <div class="mx-auto flex max-w-5xl items-center gap-3">
          <a routerLink="/" class="flex items-center gap-2 font-bold hover:opacity-80">
            <span class="text-primary"><signng-icon name="bar" [size]="18" /></span> Colors
          </a>
        </div>
      </div>

      <main class="mx-auto max-w-5xl px-4 py-8">
        <p class="mb-2 max-w-2xl text-sm text-muted-foreground">
          A 12-step OKLCH scale per brand preset, generated from a single hex value (heuristic
          ramp, not Radix's algorithm — see the color-system skill for why signng doesn't migrate
          its actual tokens to this yet). Click a step to copy its <code class="rounded bg-muted px-1">oklch()</code> value.
        </p>
        <div class="mb-6 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          @for (g of GROUPS; track g.range) {
            <span><b class="text-foreground">{{ g.range }}</b> {{ g.label }}</span>
          }
        </div>

        <div class="space-y-4">
          @for (preset of presets; track preset.key) {
            <div class="flex items-center gap-3">
              <span class="w-16 shrink-0 text-sm font-medium">{{ preset.label }}</span>
              <div class="grid flex-1 grid-cols-12 gap-1">
                @for (step of scaleFor(preset.primary); track step.step) {
                  <button
                    type="button"
                    (click)="copy(step.css)"
                    [style.background]="step.css"
                    [attr.aria-label]="preset.label + ' step ' + step.step"
                    [title]="step.css"
                    class="h-10 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  ></button>
                }
              </div>
            </div>
          }
        </div>
      </main>
    </div>
  `,
})
export class ColorsPage {
  private readonly toast = inject(ToastService);
  protected readonly presets = PRESETS;
  protected readonly GROUPS = GROUPS;
  private readonly cache = new Map<string, ReturnType<typeof generateScale>>();

  protected scaleFor(hex: string) {
    let scale = this.cache.get(hex);
    if (!scale) {
      scale = generateScale(hex);
      this.cache.set(hex, scale);
    }
    return scale;
  }

  protected copy(css: string): void {
    navigator.clipboard?.writeText(css);
    this.toast.success('Copied', css);
  }
}
