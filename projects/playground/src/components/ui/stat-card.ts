import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Icon, type IconName } from '@/components/ui/icon';

/**
 * StatCard (helm) — a KPI tile: label + optional icon, a large value, and a colored delta chip
 * (up = primary, down = destructive). Presentational; signals-only, OnPush. Compose several in a grid.
 */
@Component({
  selector: 'signng-stat-card',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="rounded-lg border border-border bg-card p-4">
      <div class="flex items-center justify-between">
        <span class="text-sm text-muted-foreground">{{ label() }}</span>
        @if (icon()) { <span class="text-muted-foreground"><signng-icon [name]="icon()!" [size]="16" /></span> }
      </div>
      <div class="mt-1.5 flex items-end gap-2">
        <span class="text-2xl font-semibold tracking-tight">{{ value() }}</span>
        @if (delta()) {
          <span [class]="chip()">
            <signng-icon [name]="up() ? 'trending' : 'arrow-right'" [size]="12" />
            {{ delta() }}
          </span>
        }
      </div>
      @if (hint()) { <p class="mt-1 text-xs text-muted-foreground">{{ hint() }}</p> }
    </div>
  `,
})
export class StatCard {
  readonly label = input('');
  readonly value = input<string | number>('');
  readonly delta = input('');
  readonly up = input(true);
  readonly icon = input<IconName | undefined>(undefined);
  readonly hint = input('');

  protected readonly chip = computed(() =>
    'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium ' +
    (this.up() ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'),
  );
}
