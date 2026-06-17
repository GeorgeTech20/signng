import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
  computed,
  inject,
  input,
  linkedSignal,
  model,
  signal,
} from '@angular/core';
import { _IdGenerator } from '@angular/cdk/a11y';
import { cn } from '@/lib/utils';

// --- date helpers (ISO 'yyyy-MM-dd', local time, no external dep) ---
function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function parse(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function addDays(s: string, n: number): string {
  const d = parse(s);
  d.setDate(d.getDate() + n);
  return iso(d);
}
function addMonths(s: string, n: number): string {
  const d = parse(s);
  d.setMonth(d.getMonth() + n, 1); // snap to the 1st (month-nav buttons)
  return iso(d);
}
function addMonthsKeepDay(s: string, n: number): string {
  const d = parse(s);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, daysInMonth)); // clamp to shorter months (APG Page behaviour)
  return iso(d);
}

interface Day {
  iso: string;
  num: number;
  outside: boolean;
  disabled: boolean;
  label: string;
}

/**
 * Styled Calendar (helm) — fully-controlled date grid (WAI-ARIA APG grid pattern). The grid is the
 * single tab stop (tabindex=0); the focused day is exposed via aria-activedescendant. Keyboard:
 * Arrows move ±1 day / ±1 week, Home/End to week edges, PageUp/Down change month (keeping the day),
 * Enter/Space select. Navigation skips disabled days and hard-stops at min/max. The active cell shows
 * a focus ring only while the grid is focused.
 *
 * SSR: the displayed month comes from `value`/`defaultMonth` (deterministic). The "today" highlight
 * (aria-current) is applied client-side only (afterNextRender) to avoid a server/client day mismatch.
 * For a calendar with no initial value under SSR, pass `defaultMonth` for a deterministic first month.
 */
@Component({
  selector: 'signng-calendar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [class]="cn('inline-block rounded-lg border border-border bg-background p-3', class())">
      <div class="mb-2 flex items-center justify-between">
        <button
          type="button"
          (click)="cursor.set(addMonths(cursor(), -1))"
          aria-label="Mes anterior"
          class="inline-flex size-7 items-center justify-center rounded-md hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
        <div [id]="monthLabelId" class="text-sm font-medium capitalize">{{ monthLabel() }}</div>
        <button
          type="button"
          (click)="cursor.set(addMonths(cursor(), 1))"
          aria-label="Mes siguiente"
          class="inline-flex size-7 items-center justify-center rounded-md hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4" aria-hidden="true">
            <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </div>

      <!-- polite boundary announcement (month changes) without making the visible label a live region -->
      <div aria-live="polite" class="sr-only">{{ monthLabel() }}</div>

      <div
        role="grid"
        tabindex="0"
        [attr.aria-label]="label() || 'Calendario'"
        [attr.aria-describedby]="monthLabelId"
        [attr.aria-activedescendant]="dayId(cursor())"
        (focus)="focused.set(true)"
        (blur)="focused.set(false)"
        (keydown)="onKeydown($event)"
        class="outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
      >
        <div role="row" class="grid grid-cols-7">
          @for (wd of weekdays(); track wd.key) {
            <span role="columnheader" [attr.aria-label]="wd.long" class="py-1 text-center text-xs text-muted-foreground">
              {{ wd.short }}
            </span>
          }
        </div>
        @for (week of weeks(); track $index) {
          <div role="row" class="grid grid-cols-7">
            @for (day of week; track day.iso) {
              <span
                role="gridcell"
                [id]="dayId(day.iso)"
                [attr.aria-selected]="day.iso === value() ? 'true' : null"
                [attr.aria-current]="day.iso === today() ? 'date' : null"
                [attr.aria-disabled]="day.disabled ? 'true' : null"
                [attr.aria-label]="day.label"
                (click)="select(day)"
                [class]="
                  cn(
                    'm-0.5 flex size-9 cursor-pointer items-center justify-center rounded-md text-sm',
                    day.outside ? 'text-muted-foreground' : '',
                    day.disabled ? 'pointer-events-none text-muted-foreground line-through' : 'hover:bg-accent',
                    day.iso === value() ? 'bg-primary text-primary-foreground hover:bg-primary' : '',
                    focused() && day.iso === cursor() ? 'ring-2 ring-ring ring-offset-1' : '',
                    day.iso === today() && day.iso !== value() ? 'font-bold' : ''
                  )
                "
              >
                {{ day.num }}
              </span>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class Calendar {
  readonly value = model<string | null>(null);
  readonly defaultMonth = input<string | null>(null);
  readonly min = input<string | null>(null);
  readonly max = input<string | null>(null);
  readonly label = input('');
  readonly class = input('');
  readonly locale = input('es');
  /** First day of week: 0=Sun … 6=Sat. Default 1 (Monday) — correct for es and most CLDR locales. */
  readonly weekStartsOn = input(1);

  protected readonly cn = cn;
  protected readonly addMonths = addMonths;
  protected readonly monthLabelId = inject(_IdGenerator).getId('signng-cal-month-');
  private readonly gridId = inject(_IdGenerator).getId('signng-cal-');
  private readonly initialMonth = iso(new Date()); // deterministic-enough month seed for SSR

  protected readonly focused = signal(false);
  // Today highlight is client-only to avoid an SSR/hydration day mismatch.
  protected readonly today = signal<string | null>(null);

  // Focused day (drives the displayed month + aria-activedescendant). Follows value/defaultMonth;
  // keyboard nav overrides via .set().
  protected readonly cursor = linkedSignal(
    () => this.value() ?? this.defaultMonth() ?? this.initialMonth,
  );

  constructor() {
    afterNextRender(() => this.today.set(iso(new Date())));
  }

  protected readonly weekdays = computed(() => {
    const fmtShort = new Intl.DateTimeFormat(this.locale(), { weekday: 'short' });
    const fmtLong = new Intl.DateTimeFormat(this.locale(), { weekday: 'long' });
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(2024, 0, 7 + ((this.weekStartsOn() + i) % 7)); // 2024-01-07 is a Sunday (getDay 0)
      return { key: i, short: fmtShort.format(d), long: fmtLong.format(d) };
    });
  });

  protected readonly monthLabel = computed(() =>
    new Intl.DateTimeFormat(this.locale(), { month: 'long', year: 'numeric' }).format(parse(this.cursor())),
  );

  protected readonly weeks = computed<Day[][]>(() => {
    const c = parse(this.cursor());
    const year = c.getFullYear();
    const month = c.getMonth();
    const firstDow = new Date(year, month, 1).getDay();
    const offset = (firstDow - this.weekStartsOn() + 7) % 7;
    const gridStart = new Date(year, month, 1 - offset);
    const dayFmt = new Intl.DateTimeFormat(this.locale(), { dateStyle: 'long' });
    const weeks: Day[][] = [];
    for (let w = 0; w < 6; w++) {
      const row: Day[] = [];
      for (let dd = 0; dd < 7; dd++) {
        const day = new Date(gridStart);
        day.setDate(gridStart.getDate() + w * 7 + dd);
        const isoStr = iso(day);
        row.push({
          iso: isoStr,
          num: day.getDate(),
          outside: day.getMonth() !== month,
          disabled: this.isDisabled(isoStr),
          label: dayFmt.format(day),
        });
      }
      weeks.push(row);
    }
    return weeks;
  });

  protected dayId(isoStr: string): string {
    return `${this.gridId}-${isoStr}`;
  }

  private isDisabled(isoStr: string): boolean {
    const min = this.min();
    const max = this.max();
    return (!!min && isoStr < min) || (!!max && isoStr > max);
  }

  protected select(day: Day): void {
    if (day.disabled) return;
    this.value.set(day.iso);
    this.cursor.set(day.iso);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const c = this.cursor();
    let next: string | undefined;
    switch (event.key) {
      case 'ArrowLeft': next = addDays(c, -1); break;
      case 'ArrowRight': next = addDays(c, 1); break;
      case 'ArrowUp': next = addDays(c, -7); break;
      case 'ArrowDown': next = addDays(c, 7); break;
      case 'Home': next = addDays(c, -((parse(c).getDay() - this.weekStartsOn() + 7) % 7)); break;
      case 'End': next = addDays(c, 6 - ((parse(c).getDay() - this.weekStartsOn() + 7) % 7)); break;
      case 'PageUp': next = addMonthsKeepDay(c, -1); break;
      case 'PageDown': next = addMonthsKeepDay(c, 1); break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!this.isDisabled(c)) this.value.set(c);
        return;
      default:
        return;
    }
    event.preventDefault();
    this.cursor.set(this.resolveEnabled(next, event.key));
  }

  /** Skip disabled days in the travel direction; hard-stop at min/max (don't cross). */
  private resolveEnabled(target: string, key: string): string {
    const dir = key === 'ArrowLeft' || key === 'ArrowUp' || key === 'Home' || key === 'PageUp' ? -1 : 1;
    const min = this.min();
    const max = this.max();
    let resolved = target;
    while (this.isDisabled(resolved)) {
      const step = addDays(resolved, dir);
      if ((min && step < min) || (max && step > max)) return this.cursor(); // blocked -> stay
      resolved = step;
    }
    return resolved;
  }
}
