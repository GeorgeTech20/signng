import { ChangeDetectionStrategy, Component, ElementRef, inject, input, model, signal } from '@angular/core';

const DEFAULT_SWATCHES = [
  '#ef4444', '#f97316', '#f59e0b', '#22c55e', '#06b6d4', '#3b82f6', '#6d4aff', '#ec4899',
  '#0a0a0a', '#525252', '#a3a3a3', '#ffffff',
];

/**
 * ColorPicker (helm) — a trigger swatch + popover with preset swatches, the native eyedropper/picker
 * (`<input type=color>`) and a hex field. `value` is a two-way hex model. Closes on outside-click / Esc.
 * Signals-only, OnPush. (Hex is validated before commit; no innerHTML/bypass.)
 */
@Component({
  selector: 'signng-color-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-block', '(document:click)': 'onDocClick($event)', '(keydown.escape)': 'open.set(false)' },
  template: `
    <div class="relative">
      <button
        type="button"
        (click)="open.set(!open())"
        [attr.aria-expanded]="open()"
        [attr.aria-label]="(label() || 'Color') + ': ' + value()"
        class="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-2 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span class="size-5 rounded border border-border" [style.background]="value()"></span>
        <span class="font-mono text-xs uppercase">{{ value() }}</span>
      </button>

      @if (open()) {
        <div class="absolute z-50 mt-1 w-56 rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-lg">
          <div class="grid grid-cols-6 gap-1.5">
            @for (c of swatches(); track c) {
              <button
                type="button"
                (click)="commit(c)"
                [style.background]="c"
                [attr.aria-label]="c"
                [class]="'size-7 rounded-md border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ' + (c.toLowerCase() === value().toLowerCase() ? 'border-foreground ring-2 ring-ring' : 'border-border')"
              ></button>
            }
          </div>
          <div class="mt-3 flex items-center gap-2">
            <input type="color" [value]="value()" (input)="commit($any($event.target).value)" aria-label="Selector de color" class="h-8 w-9 cursor-pointer rounded border border-input bg-background p-0.5" />
            <input
              type="text"
              [value]="value()"
              (input)="onHex($any($event.target).value)"
              maxlength="7"
              aria-label="Hex"
              class="h-8 flex-1 rounded-md border border-input bg-background px-2 font-mono text-sm uppercase outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>
      }
    </div>
  `,
})
export class ColorPicker {
  readonly value = model('#6d4aff');
  readonly swatches = input<string[]>(DEFAULT_SWATCHES);
  readonly label = input('');

  private readonly host = inject(ElementRef<HTMLElement>);
  protected readonly open = signal(false);

  protected commit(hex: string): void {
    this.value.set(hex);
  }
  protected onHex(raw: string): void {
    const v = raw.startsWith('#') ? raw : '#' + raw;
    if (/^#[0-9a-fA-F]{6}$/.test(v)) this.value.set(v);
  }
  protected onDocClick(e: Event): void {
    if (this.open() && !this.host.nativeElement.contains(e.target as Node)) this.open.set(false);
  }
}
