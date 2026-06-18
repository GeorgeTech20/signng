import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Icon, type IconName } from '@/components/ui/icon';

/**
 * EmptyState (helm) — a centered placeholder for empty lists / zero-results / first-run: an icon in a
 * soft circle, a title, a description, and a projected action slot (`<button signngButton>` etc).
 * Presentational, OnPush.
 */
@Component({
  selector: 'signng-empty-state',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border px-6 py-12 text-center">
      <span class="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <signng-icon [name]="icon()" [size]="22" />
      </span>
      <div class="space-y-1">
        <h3 class="text-sm font-semibold">{{ title() }}</h3>
        @if (description()) { <p class="mx-auto max-w-sm text-sm text-muted-foreground">{{ description() }}</p> }
      </div>
      <div class="mt-1"><ng-content /></div>
    </div>
  `,
})
export class EmptyState {
  readonly icon = input<IconName>('search');
  readonly title = input('Sin resultados');
  readonly description = input('');
}
