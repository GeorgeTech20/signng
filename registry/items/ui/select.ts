import { ChangeDetectionStrategy, Component, computed, inject, input, model, signal } from '@angular/core';
import { CdkTrapFocus, _IdGenerator } from '@angular/cdk/a11y';
import { CdkConnectedOverlay, CdkOverlayOrigin, type ConnectedPosition } from '@angular/cdk/overlay';
import { Listbox, Option } from '@angular/aria/listbox';
import { cn } from '@/lib/utils';
import { SIGNNG_I18N } from '@/components/ui/i18n';

export interface SelectOption {
  value: string;
  label: string;
}

/**
 * Styled Select (helm) — trigger button + a CDK overlay hosting @angular/aria's Listbox/Option
 * (keyboard nav, typeahead, roving focus, aria-selected inherited from Google). Single-select
 * bridged to the listbox's value array. cdkTrapFocus moves focus into the list on open and back
 * to the trigger on close. Requires the `overlay` registry item. SSR-safe (overlay only on click).
 */
@Component({
  selector: 'signng-select',
  imports: [CdkConnectedOverlay, CdkOverlayOrigin, CdkTrapFocus, Listbox, Option],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'onEscape()',
  },
  template: `
    <button
      cdkOverlayOrigin
      #origin="cdkOverlayOrigin"
      type="button"
      role="combobox"
      aria-haspopup="listbox"
      [attr.aria-expanded]="open()"
      [attr.aria-controls]="open() ? listboxId : null"
      [attr.aria-label]="label() || null"
      [class]="
        cn(
          'flex h-10 w-full min-w-48 items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          class()
        )
      "
      (click)="open.set(!open())"
    >
      <span [class.text-muted-foreground]="value() === null">{{ selectedLabel() }}</span>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4 opacity-60" aria-hidden="true">
        <path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>
    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="origin"
      [cdkConnectedOverlayOpen]="open()"
      [cdkConnectedOverlayPositions]="positions"
      [cdkConnectedOverlayHasBackdrop]="true"
      cdkConnectedOverlayBackdropClass="cdk-overlay-transparent-backdrop"
      [cdkConnectedOverlayPush]="true"
      (backdropClick)="open.set(false)"
    >
      <ul
        ngListbox
        [id]="listboxId"
        cdkTrapFocus
        [cdkTrapFocusAutoCapture]="true"
        [multi]="false"
        selectionMode="explicit"
        [value]="listboxValue()"
        (valueChange)="onChange($event)"
        [attr.aria-label]="label() || i18n.options"
        class="z-50 max-h-60 min-w-48 overflow-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md outline-none"
      >
        @for (opt of options(); track opt.value) {
          <li
            ngOption
            [value]="opt.value"
            class="flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[active]:bg-accent"
          >
            {{ opt.label }}
          </li>
        }
      </ul>
    </ng-template>
  `,
})
export class Select {
  protected readonly i18n = inject(SIGNNG_I18N);
  readonly options = input<SelectOption[]>([]);
  readonly value = model<string | null>(null);
  readonly placeholder = input('');
  readonly label = input('');
  readonly class = input('');
  readonly open = signal(false);

  protected readonly cn = cn;
  protected readonly listboxId = inject(_IdGenerator).getId('signng-select-listbox-');
  protected readonly selectedLabel = computed(
    () => this.options().find((o) => o.value === this.value())?.label ?? (this.placeholder() || this.i18n.selectPlaceholder),
  );
  protected readonly listboxValue = computed(() => (this.value() !== null ? [this.value()!] : []));

  protected onChange(values: string[]): void {
    this.value.set(values[0] ?? null);
    this.open.set(false);
  }

  protected onEscape(): void {
    if (this.open()) this.open.set(false);
  }

  protected readonly positions: ConnectedPosition[] = [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 6 },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -6 },
  ];
}
