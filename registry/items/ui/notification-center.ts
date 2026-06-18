import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, input, model, signal } from '@angular/core';
import { Icon, type IconName } from '@/components/ui/icon';

export interface Notification {
  id: string;
  title: string;
  description?: string;
  time?: string;
  read?: boolean;
  icon?: IconName;
}

/**
 * NotificationCenter (helm) — a bell trigger with an unread badge and a dropdown inbox. Items show
 * read/unread state, clicking one marks it read, and "marcar todas" clears all. `items` is a two-way
 * model. Closes on outside-click / Esc. aria-live announces the unread count. Signals-only, OnPush.
 */
@Component({
  selector: 'signng-notification-center',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-block', '(document:click)': 'onDocClick($event)', '(keydown.escape)': 'open.set(false)' },
  template: `
    <div class="relative">
      <button
        type="button"
        (click)="open.set(!open())"
        [attr.aria-expanded]="open()"
        [attr.aria-label]="'Notificaciones' + (unread() ? ' (' + unread() + ' sin leer)' : '')"
        class="relative inline-flex size-9 items-center justify-center rounded-md border border-border hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <signng-icon name="bell" [size]="18" />
        @if (unread()) {
          <span class="absolute -right-1 -top-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-4 text-destructive-foreground">{{ unread() }}</span>
        }
      </button>
      <span aria-live="polite" class="sr-only">{{ unread() }} notificaciones sin leer</span>

      @if (open()) {
        <div class="absolute right-0 z-50 mt-1 w-80 rounded-lg border border-border bg-popover text-popover-foreground shadow-lg">
          <div class="flex items-center justify-between border-b border-border px-3 py-2">
            <span class="text-sm font-semibold">Notificaciones</span>
            @if (unread()) { <button type="button" (click)="markAll()" class="text-xs text-primary hover:underline">Marcar todas</button> }
          </div>
          <ul class="max-h-80 overflow-auto py-1">
            @for (n of items(); track n.id) {
              <li
                (click)="markRead(n.id)"
                [class]="'flex cursor-pointer gap-3 px-3 py-2.5 hover:bg-accent ' + (n.read ? 'opacity-60' : '')"
              >
                <span class="mt-0.5 text-muted-foreground"><signng-icon [name]="n.icon || 'info'" [size]="16" /></span>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-medium">{{ n.title }}</span>
                    @if (!n.read) { <span class="size-1.5 shrink-0 rounded-full bg-primary"></span> }
                  </div>
                  @if (n.description) { <p class="truncate text-xs text-muted-foreground">{{ n.description }}</p> }
                  @if (n.time) { <span class="text-xs text-muted-foreground">{{ n.time }}</span> }
                </div>
              </li>
            } @empty {
              <li class="px-3 py-8 text-center text-sm text-muted-foreground">Sin notificaciones</li>
            }
          </ul>
        </div>
      }
    </div>
  `,
})
export class NotificationCenter {
  readonly items = model<Notification[]>([]);
  protected readonly open = signal(false);
  private readonly host = inject(ElementRef<HTMLElement>);

  protected readonly unread = computed(() => this.items().filter((n) => !n.read).length);

  protected markRead(id: string): void {
    this.items.set(this.items().map((n) => (n.id === id ? { ...n, read: true } : n)));
  }
  protected markAll(): void {
    this.items.set(this.items().map((n) => ({ ...n, read: true })));
  }
  protected onDocClick(e: Event): void {
    if (this.open() && !this.host.nativeElement.contains(e.target as Node)) this.open.set(false);
  }
}
