import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { Icon } from '@/components/ui/icon';

/**
 * NumberInput (helm) — a numeric spinner with clamp, step, prefix/suffix (e.g. "$" / "%") and
 * keyboard ↑/↓. Value is a two-way `model`. role=spinbutton with aria-valuenow/min/max. Signals-only,
 * OnPush. Empty input maps to null.
 */
@Component({
  selector: 'signng-number-input',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-block' },
  template: `
    <div class="inline-flex h-9 items-stretch overflow-hidden rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring">
      @if (prefix()) { <span class="flex items-center pl-2.5 text-sm text-muted-foreground">{{ prefix() }}</span> }
      <input
        type="text"
        inputmode="decimal"
        role="spinbutton"
        [attr.aria-valuenow]="value()"
        [attr.aria-valuemin]="min() === null ? null : min()"
        [attr.aria-valuemax]="max() === null ? null : max()"
        [attr.aria-label]="label() || null"
        [value]="value() ?? ''"
        [placeholder]="placeholder()"
        (input)="onInput($any($event.target).value)"
        (keydown.arrowup)="$event.preventDefault(); step(1)"
        (keydown.arrowdown)="$event.preventDefault(); step(-1)"
        class="w-20 bg-transparent px-2.5 text-sm outline-none"
      />
      @if (suffix()) { <span class="flex items-center pr-1 text-sm text-muted-foreground">{{ suffix() }}</span> }
      <div class="flex flex-col border-l border-input">
        <button type="button" tabindex="-1" (click)="step(1)" [disabled]="atMax()" aria-label="Aumentar" class="flex flex-1 items-center justify-center px-1.5 hover:bg-accent disabled:opacity-40">
          <signng-icon name="chevron-up" [size]="12" />
        </button>
        <button type="button" tabindex="-1" (click)="step(-1)" [disabled]="atMin()" aria-label="Disminuir" class="flex flex-1 items-center justify-center border-t border-input px-1.5 hover:bg-accent disabled:opacity-40">
          <signng-icon name="chevron-down" [size]="12" />
        </button>
      </div>
    </div>
  `,
})
export class NumberInput {
  readonly value = model<number | null>(null);
  readonly min = input<number | null>(null);
  readonly max = input<number | null>(null);
  readonly stepBy = input(1);
  readonly prefix = input('');
  readonly suffix = input('');
  readonly placeholder = input('');
  readonly label = input('');

  protected readonly atMin = computed(() => this.min() !== null && (this.value() ?? this.min()!) <= this.min()!);
  protected readonly atMax = computed(() => this.max() !== null && (this.value() ?? this.max()!) >= this.max()!);

  protected onInput(raw: string): void {
    const s = raw.replace(',', '.').trim();
    if (s === '') {
      this.value.set(null);
      return;
    }
    const n = Number(s);
    if (!Number.isNaN(n)) this.value.set(this.clamp(n));
  }
  protected step(dir: number): void {
    const next = (this.value() ?? 0) + dir * this.stepBy();
    this.value.set(this.clamp(next));
  }
  private clamp(n: number): number {
    const lo = this.min();
    const hi = this.max();
    if (lo !== null && n < lo) return lo;
    if (hi !== null && n > hi) return hi;
    return n;
  }
}
