import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, input, model, signal } from '@angular/core';
import { Icon } from '@/components/ui/icon';

// local-time ISO helpers (no external dep)
function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function parse(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function addMonths(s: string, n: number): string {
  const d = parse(s);
  d.setDate?.(1);
  d.setMonth(d.getMonth() + n, 1);
  return iso(d);
}

/**
 * DateRangePicker (helm) — a popover month grid that selects a start→end range (first click sets start,
 * second sets end; an earlier second click swaps). The in-range days are tinted, the endpoints filled.
 * `start`/`end` are two-way ISO ('yyyy-MM-dd') models. Intl month/weekday labels; closes on outside-click
 * / Esc. Signals-only, OnPush, SSR-safe (month seed is deterministic).
 */
@Component({
  selector: 'signng-date-range-picker',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-block', '(document:click)': 'onDocClick($event)', '(keydown.escape)': 'open.set(false)' },
  template: `
    <div class="relative">
      <button
        type="button"
        (click)="open.set(!open())"
        [attr.aria-expanded]="open()"
        [attr.aria-label]="label() || 'Rango de fechas'"
        class="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <signng-icon name="calendar" [size]="15" class="text-muted-foreground" />
        <span [class]="start() ? '' : 'text-muted-foreground'">{{ triggerText() }}</span>
      </button>

      @if (open()) {
        <div class="absolute z-50 mt-1 rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-lg">
          <div class="mb-2 flex items-center justify-between">
            <button type="button" (click)="cursor.set(addMonths(cursor(), -1))" aria-label="Mes anterior" class="inline-flex size-7 items-center justify-center rounded-md hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <signng-icon name="chevron-left" [size]="16" />
            </button>
            <span class="text-sm font-medium capitalize">{{ monthLabel() }}</span>
            <button type="button" (click)="cursor.set(addMonths(cursor(), 1))" aria-label="Mes siguiente" class="inline-flex size-7 items-center justify-center rounded-md hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <signng-icon name="chevron-right" [size]="16" />
            </button>
          </div>
          <div class="grid grid-cols-7 gap-0.5">
            @for (wd of weekdays(); track $index) {
              <span class="py-1 text-center text-xs text-muted-foreground">{{ wd }}</span>
            }
            @for (day of days(); track day.iso) {
              <button
                type="button"
                (click)="pick(day.iso)"
                [class]="cell(day)"
                [attr.aria-pressed]="day.iso === start() || day.iso === end()"
              >{{ day.num }}</button>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class DateRangePicker {
  readonly start = model<string | null>(null);
  readonly end = model<string | null>(null);
  readonly locale = input('es');
  readonly label = input('');

  protected readonly addMonths = addMonths;
  private readonly host = inject(ElementRef<HTMLElement>);
  protected readonly open = signal(false);
  protected readonly cursor = signal(iso(new Date(2026, 5, 1)));

  protected readonly monthLabel = computed(() =>
    new Intl.DateTimeFormat(this.locale(), { month: 'long', year: 'numeric' }).format(parse(this.cursor())),
  );
  protected readonly weekdays = computed(() => {
    const fmt = new Intl.DateTimeFormat(this.locale(), { weekday: 'narrow' });
    return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(2024, 0, 8 + i))); // Mon-first
  });
  protected readonly days = computed(() => {
    const c = parse(this.cursor());
    const first = new Date(c.getFullYear(), c.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7; // Monday-first
    const startDay = new Date(first);
    startDay.setDate(1 - offset);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(startDay);
      d.setDate(startDay.getDate() + i);
      return { iso: iso(d), num: d.getDate(), outside: d.getMonth() !== c.getMonth() };
    });
  });

  protected triggerText(): string {
    const s = this.start();
    if (!s) return this.label() || 'Elegir rango';
    const fmt = new Intl.DateTimeFormat(this.locale(), { day: 'numeric', month: 'short' });
    const e = this.end();
    return e ? `${fmt.format(parse(s))} – ${fmt.format(parse(e))}` : fmt.format(parse(s));
  }

  protected pick(d: string): void {
    const s = this.start();
    const e = this.end();
    if (!s || (s && e)) {
      this.start.set(d);
      this.end.set(null);
    } else if (d < s) {
      this.end.set(s);
      this.start.set(d);
    } else {
      this.end.set(d);
    }
  }

  protected cell(day: { iso: string; outside: boolean }): string {
    const s = this.start();
    const e = this.end();
    const isEnd = day.iso === s || day.iso === e;
    const inRange = !!s && !!e && day.iso > s && day.iso < e;
    return (
      'flex size-8 items-center justify-center rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ' +
      (day.outside ? 'text-muted-foreground ' : '') +
      (isEnd
        ? 'bg-primary text-primary-foreground'
        : inRange
          ? 'bg-accent text-accent-foreground'
          : 'hover:bg-accent')
    );
  }

  protected onDocClick(e: Event): void {
    if (this.open() && !this.host.nativeElement.contains(e.target as Node)) this.open.set(false);
  }
}
