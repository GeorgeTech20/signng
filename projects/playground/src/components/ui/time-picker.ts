import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * TimePicker (helm) — pick an hour + minute via two native selects (accessible, keyboard-typeable, zero
 * deps). `value` is a two-way 'HH:mm' (24h) model; minutes step by `minuteStep`. Native <select> keeps it
 * minimal and screen-reader friendly. Signals-only, OnPush. No innerHTML/bypass.
 */
@Component({
  selector: 'signng-time-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-block' },
  template: `
    <div class="inline-flex h-9 items-center gap-1 rounded-md border border-input bg-background px-2.5 focus-within:ring-2 focus-within:ring-ring">
      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" class="text-muted-foreground" aria-hidden="true">
        <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <select [value]="h()" (change)="onHour($any($event.target).value)" [attr.aria-label]="(label() || 'Hora') + ' — horas'" class="cursor-pointer bg-transparent text-sm tabular-nums outline-none">
        @for (hr of hours; track hr) { <option [value]="hr">{{ pad(hr) }}</option> }
      </select>
      <span class="text-muted-foreground">:</span>
      <select [value]="m()" (change)="onMinute($any($event.target).value)" [attr.aria-label]="(label() || 'Hora') + ' — minutos'" class="cursor-pointer bg-transparent text-sm tabular-nums outline-none">
        @for (mn of minutes(); track mn) { <option [value]="mn">{{ pad(mn) }}</option> }
      </select>
    </div>
  `,
})
export class TimePicker {
  readonly value = model<string | null>(null);
  readonly minuteStep = input(5);
  readonly label = input('');

  protected readonly pad = pad;
  protected readonly hours = Array.from({ length: 24 }, (_, i) => i);
  protected readonly minutes = computed(() => {
    const step = Math.max(1, this.minuteStep());
    return Array.from({ length: Math.ceil(60 / step) }, (_, i) => i * step);
  });

  protected readonly h = computed(() => {
    const v = this.value();
    return v ? Number(v.split(':')[0]) || 0 : 0;
  });
  protected readonly m = computed(() => {
    const v = this.value();
    return v ? Number(v.split(':')[1]) || 0 : 0;
  });

  protected onHour(v: string): void {
    this.set(Number(v), this.m());
  }
  protected onMinute(v: string): void {
    this.set(this.h(), Number(v));
  }
  private set(h: number, m: number): void {
    this.value.set(`${pad(h)}:${pad(m)}`);
  }
}
