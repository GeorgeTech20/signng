import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Icon, type IconName } from '@/components/ui/icon';

export interface TimelineItem {
  title: string;
  time?: string;
  description?: string;
  icon?: IconName;
  variant?: 'default' | 'primary' | 'success' | 'destructive';
}

/**
 * Timeline (helm) — a vertical activity feed: a connecting rail with a node per item (icon optional,
 * colored by `variant`), a title + time, and an optional description. Presentational, OnPush.
 */
@Component({
  selector: 'signng-timeline',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <ol class="relative ml-2 border-l border-border">
      @for (item of items(); track $index) {
        <li class="mb-6 ml-6 last:mb-0">
          <span [class]="dot(item)">
            @if (item.icon) { <signng-icon [name]="item.icon" [size]="12" /> }
          </span>
          <div class="flex flex-wrap items-center gap-x-2">
            <h4 class="text-sm font-medium">{{ item.title }}</h4>
            @if (item.time) { <time class="text-xs text-muted-foreground">{{ item.time }}</time> }
          </div>
          @if (item.description) { <p class="mt-0.5 text-sm text-muted-foreground">{{ item.description }}</p> }
        </li>
      }
    </ol>
  `,
})
export class Timeline {
  readonly items = input<TimelineItem[]>([]);

  protected dot(item: TimelineItem): string {
    const tone =
      item.variant === 'success'
        ? 'bg-primary text-primary-foreground'
        : item.variant === 'destructive'
          ? 'bg-destructive text-destructive-foreground'
          : item.variant === 'primary'
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground ring-4 ring-background';
    return `absolute -left-[calc(0.75rem+1px)] flex size-6 items-center justify-center rounded-full ${tone}`;
  }
}
