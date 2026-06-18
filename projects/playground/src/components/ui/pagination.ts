import { ChangeDetectionStrategy, Component, computed, input, model, inject} from '@angular/core';
import { cn } from '@/lib/utils';
import { SIGNNG_I18N } from '@/components/ui/i18n';

/**
 * Styled Pagination (helm). nav landmark with prev/next + numbered pages; the current page carries
 * aria-current="page". A compact window with ellipses is shown for large totals.
 */
@Component({
  selector: 'signng-pagination',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <nav [attr.aria-label]="label() || i18n.paginationLabel" class="flex items-center gap-1">
      <button
        type="button"
        [disabled]="page() <= 1"
        (click)="go(page() - 1)"
        [attr.aria-label]="i18n.paginationPrev"
        [class]="btn"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4" aria-hidden="true">
          <path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      @for (item of items(); track $index) {
        @if (item === 0) {
          <span class="px-2 text-sm text-muted-foreground" aria-hidden="true">…</span>
        } @else {
          <button
            type="button"
            (click)="go(item)"
            [attr.aria-current]="item === page() ? 'page' : null"
            [attr.aria-label]="i18n.paginationPage(item)"
            [class]="cn(btn, item === page() ? 'border-input bg-accent text-accent-foreground' : '')"
          >
            {{ item }}
          </button>
        }
      }
      <button
        type="button"
        [disabled]="page() >= total()"
        (click)="go(page() + 1)"
        [attr.aria-label]="i18n.paginationNext"
        [class]="btn"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4" aria-hidden="true">
          <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
    </nav>
  `,
})
export class Pagination {
  protected readonly i18n = inject(SIGNNG_I18N);
  readonly page = model(1);
  readonly total = input(1);
  readonly label = input('');

  protected readonly cn = cn;
  protected readonly btn =
    'inline-flex size-9 items-center justify-center rounded-md border border-transparent text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50';

  // Page list with ellipses (0 = ellipsis): first, last, current ±1, always 1.
  protected readonly items = computed<number[]>(() => {
    const total = this.total();
    const page = this.page();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const out = new Set<number>([1, total, page, page - 1, page + 1]);
    const sorted = [...out].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
    const result: number[] = [];
    let prev = 0;
    for (const p of sorted) {
      if (prev && p - prev > 1) result.push(0); // ellipsis
      result.push(p);
      prev = p;
    }
    return result;
  });

  protected go(p: number): void {
    if (p >= 1 && p <= this.total()) this.page.set(p);
  }
}
