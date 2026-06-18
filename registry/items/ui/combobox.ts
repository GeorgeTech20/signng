import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { _IdGenerator } from '@angular/cdk/a11y';
import { CdkConnectedOverlay, CdkOverlayOrigin, type ConnectedPosition } from '@angular/cdk/overlay';
import { cn } from '@/lib/utils';
import { SIGNNG_I18N } from '@/components/ui/i18n';

export interface ComboboxOption {
  value: string;
  label: string;
}

/**
 * Styled Combobox (helm) — searchable single-select, fully controlled (APG combobox pattern).
 * Built from a native `<input role=combobox>` + a CDK overlay listbox we own, rather than the
 * Developer-Preview aria Combobox (which didn't expand/bind reliably). Keyboard: ArrowDown/Up move
 * the active option, Enter selects, Esc reverts + closes, Home/End jump. Focus stays on the input;
 * the active option is exposed via aria-activedescendant. Requires the `overlay` registry item.
 */
@Component({
  selector: 'signng-combobox',
  imports: [CdkConnectedOverlay, CdkOverlayOrigin],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div cdkOverlayOrigin #origin="cdkOverlayOrigin" class="relative" (focusout)="onFocusOut($event)">
      <input
        #input
        type="text"
        role="combobox"
        autocomplete="off"
        aria-autocomplete="list"
        [attr.aria-expanded]="expanded()"
        [attr.aria-controls]="expanded() ? listboxId : null"
        [attr.aria-activedescendant]="activeId()"
        [attr.aria-label]="label() || null"
        [value]="query()"
        [placeholder]="placeholder() || i18n.searchPlaceholder"
        (input)="onInput($event)"
        (focus)="open()"
        (click)="open()"
        (keydown)="onKeydown($event)"
        [class]="
          cn(
            'flex h-10 w-full min-w-48 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            class()
          )
        "
      />
      <!-- Persistent polite live region: announces empty-results to screen readers. -->
      <div class="sr-only" aria-live="polite">
        @if (expanded() && !filtered().length) {
          {{ emptyLabel() || i18n.empty }}
        }
      </div>
    </div>
    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="origin"
      [cdkConnectedOverlayOpen]="expanded()"
      [cdkConnectedOverlayPositions]="positions"
      [cdkConnectedOverlayWidth]="panelWidth()"
      [cdkConnectedOverlayHasBackdrop]="true"
      cdkConnectedOverlayBackdropClass="cdk-overlay-transparent-backdrop"
      [cdkConnectedOverlayPush]="true"
      (backdropClick)="close()"
    >
      <ul
        [id]="listboxId"
        role="listbox"
        [attr.aria-label]="label() || 'Options'"
        class="z-50 max-h-60 overflow-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md outline-none"
      >
        @for (opt of filtered(); track opt.value; let i = $index) {
          <li
            role="option"
            [id]="optionId(i)"
            [attr.aria-selected]="opt.value === value()"
            (mousedown)="$event.preventDefault()"
            (click)="select(opt)"
            (mouseenter)="activeIndex.set(i)"
            [class]="
              cn(
                'flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm',
                i === activeClamped() ? 'bg-accent text-accent-foreground' : ''
              )
            "
          >
            {{ opt.label }}
          </li>
        } @empty {
          <li class="px-2 py-1.5 text-sm text-muted-foreground">{{ emptyLabel() || i18n.empty }}</li>
        }
      </ul>
    </ng-template>
  `,
})
export class Combobox {
  protected readonly i18n = inject(SIGNNG_I18N);
  readonly options = input<ComboboxOption[]>([]);
  readonly value = model<string | null>(null);
  readonly label = input('');
  readonly placeholder = input('');
  readonly emptyLabel = input('');
  readonly class = input('');

  protected readonly cn = cn;
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly inputEl = viewChild.required<ElementRef<HTMLInputElement>>('input');
  protected readonly listboxId = inject(_IdGenerator).getId('signng-combobox-');

  protected readonly query = signal('');
  protected readonly expanded = signal(false);
  protected readonly activeIndex = signal(-1);
  protected readonly panelWidth = signal<number | string>('auto');
  protected readonly positions: ConnectedPosition[] = [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 6 },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -6 },
  ];

  private readonly selectedLabel = computed(
    () => this.options().find((o) => o.value === this.value())?.label ?? '',
  );

  protected readonly filtered = computed(() => {
    const q = this.query().toLowerCase().trim();
    if (!q || q === this.selectedLabel().toLowerCase()) return this.options();
    return this.options().filter((o) => o.label.toLowerCase().includes(q));
  });

  // Clamp the highlight to the live list so an external options/value change while open can't desync it.
  protected readonly activeClamped = computed(() => {
    const n = this.filtered().length;
    const i = this.activeIndex();
    return i >= n ? n - 1 : i;
  });

  protected readonly activeId = computed(() => {
    const i = this.activeClamped();
    return this.expanded() && i >= 0 && i < this.filtered().length ? this.optionId(i) : null;
  });

  constructor() {
    // Keep the input text in sync with the committed value when not actively typing.
    effect(() => {
      if (!this.expanded()) this.query.set(this.selectedLabel());
    });
    // Scroll the active option into view.
    effect(() => {
      const id = this.activeId();
      if (id && typeof document !== 'undefined') {
        queueMicrotask(() => document.getElementById(id)?.scrollIntoView({ block: 'nearest' }));
      }
    });
  }

  protected optionId(i: number): string {
    return `${this.listboxId}-opt-${i}`;
  }

  protected open(): void {
    if (this.expanded()) return;
    this.panelWidth.set(this.inputEl().nativeElement.offsetWidth);
    this.expanded.set(true);
    const selected = this.filtered().findIndex((o) => o.value === this.value());
    this.activeIndex.set(selected >= 0 ? selected : this.filtered().length ? 0 : -1);
  }

  protected close(): void {
    this.expanded.set(false);
    this.activeIndex.set(-1);
    this.query.set(this.selectedLabel()); // revert orphan text to the committed selection
  }

  /** Close when focus truly leaves the field (Tab/click-away). Option clicks keep focus on the
   *  input via mousedown.preventDefault, so a contained relatedTarget is never an option. */
  protected onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (!next || !this.host.nativeElement.contains(next)) this.close();
  }

  protected select(opt: ComboboxOption): void {
    this.value.set(opt.value);
    this.query.set(opt.label);
    this.expanded.set(false);
    this.activeIndex.set(-1);
    this.inputEl().nativeElement.focus();
  }

  protected onInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
    if (!this.expanded()) this.open();
    this.activeIndex.set(this.filtered().length ? 0 : -1);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const last = this.filtered().length - 1;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!this.expanded()) this.open();
        else this.activeIndex.update((i) => Math.min(i + 1, last));
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (this.expanded()) this.activeIndex.update((i) => Math.max(i - 1, 0));
        break;
      case 'Enter': {
        const i = this.activeClamped(); // clamped: highlight/activedescendant + activation agree
        if (this.expanded() && i >= 0 && i <= last) {
          event.preventDefault();
          this.select(this.filtered()[i]);
        }
        break;
      }
      case 'Escape':
        if (this.expanded()) {
          event.preventDefault();
          this.close();
        }
        break;
      case 'Home':
        if (this.expanded()) {
          event.preventDefault();
          this.activeIndex.set(0);
        }
        break;
      case 'End':
        if (this.expanded()) {
          event.preventDefault();
          this.activeIndex.set(last);
        }
        break;
    }
  }
}
