import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, input, model, signal } from '@angular/core';
import { Icon } from '@/components/ui/icon';
import { SIGNNG_I18N } from '@/components/ui/i18n';

export interface MultiOption {
  value: string;
  label: string;
}

/**
 * MultiSelect (helm) — pick several options; selected show as removable chips in the trigger, the rest
 * in a toggle panel with checkmarks. `value` is a two-way `string[]` model. Closes on outside-click / Esc.
 * aria: listbox with aria-multiselectable + aria-selected. Signals-only, OnPush.
 */
@Component({
  selector: 'signng-multi-select',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block', '(document:click)': 'onDocClick($event)', '(keydown.escape)': 'open.set(false)' },
  template: `
    <div class="relative">
      <button
        type="button"
        (click)="open.set(!open())"
        [attr.aria-expanded]="open()"
        [attr.aria-label]="label() || null"
        class="flex min-h-9 w-full flex-wrap items-center gap-1 rounded-md border border-input bg-background px-2 py-1 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        @if (!value().length) {
          <span class="px-1 text-muted-foreground">{{ placeholder() || i18n.selectPlaceholder }}</span>
        }
        @for (opt of selectedOptions(); track opt.value) {
          <span class="inline-flex items-center gap-1 rounded bg-secondary px-1.5 py-0.5 text-xs text-secondary-foreground">
            {{ opt.label }}
            <span role="button" tabindex="-1" (click)="$event.stopPropagation(); remove(opt.value)" [attr.aria-label]="'Quitar ' + opt.label" class="hover:text-foreground">
              <signng-icon name="x" [size]="12" />
            </span>
          </span>
        }
        <span class="ml-auto text-muted-foreground"><signng-icon name="chevron-down" [size]="16" /></span>
      </button>

      @if (open()) {
        <ul role="listbox" aria-multiselectable="true" class="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-lg">
          @for (opt of options(); track opt.value) {
            <li
              role="option"
              [attr.aria-selected]="isSelected(opt.value)"
              (click)="toggle(opt.value)"
              class="flex cursor-pointer items-center justify-between rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
            >
              {{ opt.label }}
              @if (isSelected(opt.value)) { <signng-icon name="check" [size]="15" class="text-primary" /> }
            </li>
          } @empty {
            <li class="px-2 py-2 text-center text-sm text-muted-foreground">{{ i18n.empty }}</li>
          }
        </ul>
      }
    </div>
  `,
})
export class MultiSelect {
  readonly options = input<MultiOption[]>([]);
  readonly value = model<string[]>([]);
  readonly placeholder = input('');
  readonly label = input('');

  protected readonly i18n = inject(SIGNNG_I18N);
  private readonly host = inject(ElementRef<HTMLElement>);
  protected readonly open = signal(false);

  protected readonly selectedOptions = computed(() => {
    const set = new Set(this.value());
    return this.options().filter((o) => set.has(o.value));
  });
  protected isSelected(v: string): boolean {
    return this.value().includes(v);
  }
  protected toggle(v: string): void {
    this.value.set(this.isSelected(v) ? this.value().filter((x) => x !== v) : [...this.value(), v]);
  }
  protected remove(v: string): void {
    this.value.set(this.value().filter((x) => x !== v));
  }
  protected onDocClick(e: Event): void {
    if (this.open() && !this.host.nativeElement.contains(e.target as Node)) this.open.set(false);
  }
}
