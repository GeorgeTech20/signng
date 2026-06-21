import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Spinner (helm) — a loading indicator. role=status with an accessible label so screen readers announce
 * the busy state; the spin animation uses Tailwind's `animate-spin` and is paused under
 * prefers-reduced-motion by the browser/utility. Pure SVG, OnPush, no deps.
 */
@Component({
  selector: 'signng-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex items-center gap-2' },
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24 24"
      fill="none"
      class="animate-spin text-current motion-reduce:animate-none"
      role="status"
      [attr.aria-label]="label() || 'Cargando'"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" class="opacity-20" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
    </svg>
    @if (label()) { <span class="text-sm text-muted-foreground">{{ label() }}</span> }
  `,
})
export class Spinner {
  readonly size = input(20);
  readonly label = input('');
}
