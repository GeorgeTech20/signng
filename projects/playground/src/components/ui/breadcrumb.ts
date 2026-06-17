import { ChangeDetectionStrategy, Component, Directive, computed, input } from '@angular/core';
import { cn } from '@/lib/utils';

/** Breadcrumb part directives (helm). Native nav/ol/li semantics + skin. */
@Directive({ selector: 'nav[signngBreadcrumb]', host: { 'aria-label': 'breadcrumb' } })
export class Breadcrumb {}

@Directive({ selector: 'ol[signngBreadcrumbList]', host: { '[class]': 'cls()' } })
export class BreadcrumbList {
  readonly class = input('');
  protected readonly cls = computed(() =>
    cn('flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground', this.class()),
  );
}

@Directive({ selector: 'li[signngBreadcrumbItem]', host: { '[class]': 'cls()' } })
export class BreadcrumbItem {
  readonly class = input('');
  protected readonly cls = computed(() => cn('inline-flex items-center gap-1.5', this.class()));
}

@Directive({ selector: 'a[signngBreadcrumbLink]', host: { '[class]': 'cls()' } })
export class BreadcrumbLink {
  readonly class = input('');
  protected readonly cls = computed(() =>
    cn('transition-colors hover:text-foreground focus-visible:outline-none focus-visible:underline', this.class()),
  );
}

/** The current page — not a link; conveys location to AT. */
@Directive({
  selector: '[signngBreadcrumbPage]',
  host: { role: 'link', 'aria-disabled': 'true', 'aria-current': 'page', '[class]': 'cls()' },
})
export class BreadcrumbPage {
  readonly class = input('');
  protected readonly cls = computed(() => cn('font-normal text-foreground', this.class()));
}

/** Visual separator (decorative). A real <li> so the parent <ol> only contains list items. */
@Component({
  selector: 'li[signngBreadcrumbSeparator]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true', class: 'inline-flex items-center text-muted-foreground/60' },
  template: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-3.5">
      <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  `,
})
export class BreadcrumbSeparator {}

export const SIGNNG_BREADCRUMB = [
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
] as const;
