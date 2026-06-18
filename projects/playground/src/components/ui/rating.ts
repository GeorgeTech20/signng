import { ChangeDetectionStrategy, Component, computed, input, model, signal } from '@angular/core';

/**
 * Rating (helm) — a star rating control. `value` is a two-way model (0..max); hover previews, click sets,
 * arrow keys adjust, and clicking the current star clears to 0. role=slider (aria-valuenow/min/max/text)
 * so SR users get a coherent control. `readonly` renders a static display. Signals-only, OnPush.
 */
@Component({
  selector: 'signng-rating',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'slider',
    '[attr.tabindex]': 'readonly() ? null : 0',
    '[attr.aria-readonly]': 'readonly() || null',
    '[attr.aria-valuenow]': 'value()',
    'aria-valuemin': '0',
    '[attr.aria-valuemax]': 'max()',
    '[attr.aria-label]': 'label() || null',
    '[attr.aria-valuetext]': 'value() + " de " + max()',
    '(keydown.arrowright)': 'bump(1, $event)',
    '(keydown.arrowup)': 'bump(1, $event)',
    '(keydown.arrowleft)': 'bump(-1, $event)',
    '(keydown.arrowdown)': 'bump(-1, $event)',
    '(mouseleave)': 'hover.set(-1)',
    class: 'inline-flex items-center gap-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded',
  },
  template: `
    @for (i of stars(); track i) {
      <span
        [class]="'inline-flex ' + (readonly() ? '' : 'cursor-pointer')"
        (mouseenter)="!readonly() && hover.set(i)"
        (click)="!readonly() && pick(i)"
      >
        <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24"
          [attr.fill]="i <= display() ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.6"
          [class]="i <= display() ? 'text-amber-400' : 'text-muted-foreground'" stroke-linejoin="round">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      </span>
    }
  `,
})
export class Rating {
  readonly value = model(0);
  readonly max = input(5);
  readonly size = input(20);
  readonly readonly = input(false);
  readonly label = input('');

  protected readonly hover = signal(-1);
  protected readonly stars = computed(() => Array.from({ length: this.max() }, (_, i) => i + 1));
  protected readonly display = computed(() => (this.hover() >= 0 ? this.hover() : this.value()));

  protected pick(i: number): void {
    this.value.set(this.value() === i ? 0 : i);
  }
  protected bump(dir: number, e: Event): void {
    if (this.readonly()) return;
    e.preventDefault();
    this.value.set(Math.max(0, Math.min(this.max(), this.value() + dir)));
  }
}
