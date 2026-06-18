import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  computed,
  forwardRef,
  inject,
  input,
  model,
} from '@angular/core';
import { cn } from '@/lib/utils';
import { SIGNNG_I18N } from '@/components/ui/i18n';
import { Icon, type IconName } from '@/components/ui/icon';

/**
 * Sidebar (helm compound) — a collapsible app-shell navigation rail. `signng-sidebar` owns the
 * collapsed state (role=navigation, width transitions 60↔16); `signng-sidebar-trigger` toggles it;
 * `signng-sidebar-item` renders an icon + label (label hides when collapsed, with a title hint and a
 * persistent aria-label) and marks the current page with aria-current. Header/content/footer are
 * styling directives. forwardRef breaks the item/trigger ↔ sidebar DI cycle.
 */
@Component({
  selector: 'signng-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'navigation',
    '[attr.aria-label]': 'label() || i18n.sidebarNav',
    '[class]': 'cls()',
  },
  template: `<ng-content />`,
})
export class SignngSidebar {
  protected readonly i18n = inject(SIGNNG_I18N);
  readonly collapsed = model(false);
  readonly label = input('');
  readonly class = input('');
  protected readonly cls = computed(() =>
    cn(
      'flex h-full shrink-0 flex-col gap-2 border-r border-border bg-background p-2 transition-[width] duration-200',
      this.collapsed() ? 'w-16' : 'w-60',
      this.class(),
    ),
  );
}

@Directive({ selector: '[signngSidebarHeader]', host: { '[class]': 'cls()' } })
export class SignngSidebarHeader {
  readonly class = input('');
  protected readonly cls = computed(() => cn('flex items-center gap-2 px-1 py-2', this.class()));
}

@Directive({ selector: '[signngSidebarContent]', host: { '[class]': 'cls()' } })
export class SignngSidebarContent {
  readonly class = input('');
  protected readonly cls = computed(() => cn('flex-1 space-y-1 overflow-auto', this.class()));
}

@Directive({ selector: '[signngSidebarFooter]', host: { '[class]': 'cls()' } })
export class SignngSidebarFooter {
  readonly class = input('');
  protected readonly cls = computed(() => cn('mt-auto px-1 py-2', this.class()));
}

@Component({
  selector: 'signng-sidebar-item',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <button
      type="button"
      [attr.aria-current]="active() ? 'page' : null"
      [attr.aria-label]="label()"
      [attr.title]="sidebar.collapsed() ? label() : null"
      [class]="
        cn(
          'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          active() ? 'bg-accent font-medium text-accent-foreground' : 'text-foreground',
          sidebar.collapsed() ? 'justify-center' : ''
        )
      "
    >
      @if (icon()) {
        <signng-icon [name]="icon()!" [size]="18" />
      }
      @if (!sidebar.collapsed()) {
        <span class="truncate">{{ label() }}</span>
      }
    </button>
  `,
})
export class SignngSidebarItem {
  readonly icon = input<IconName | undefined>(undefined);
  readonly label = input('');
  readonly active = input(false);
  protected readonly cn = cn;
  protected readonly sidebar = inject<SignngSidebar>(forwardRef(() => SignngSidebar));
}

@Component({
  selector: 'signng-sidebar-trigger',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex' },
  template: `
    <button
      type="button"
      (click)="sidebar.collapsed.update((v) => !v)"
      [attr.aria-expanded]="!sidebar.collapsed()"
      [attr.aria-label]="i18n.sidebarToggle"
      class="inline-flex size-8 items-center justify-center rounded-md hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <signng-icon name="menu" [size]="18" />
    </button>
  `,
})
export class SignngSidebarTrigger {
  protected readonly i18n = inject(SIGNNG_I18N);
  protected readonly sidebar = inject<SignngSidebar>(forwardRef(() => SignngSidebar));
}

export const SIGNNG_SIDEBAR = [
  SignngSidebar,
  SignngSidebarHeader,
  SignngSidebarContent,
  SignngSidebarFooter,
  SignngSidebarItem,
  SignngSidebarTrigger,
] as const;
