import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { CdkTrapFocus, _IdGenerator } from '@angular/cdk/a11y';
import { CdkConnectedOverlay, CdkOverlayOrigin, type ConnectedPosition } from '@angular/cdk/overlay';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

/**
 * Styled DatePicker (helm) — trigger button + the Calendar in a CDK overlay dialog. Composes two
 * shipped pieces: the controlled Calendar (APG date grid) and the overlay+focus pattern. cdkTrapFocus
 * moves focus into the dialog on open; picking a day commits the value, closes, and restores focus to
 * the trigger. Esc / outside-click dismiss. Requires the `overlay` registry item.
 */
@Component({
  selector: 'signng-date-picker',
  imports: [CdkConnectedOverlay, CdkOverlayOrigin, CdkTrapFocus, Calendar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'onEscape()',
  },
  template: `
    <button
      #trigger
      cdkOverlayOrigin
      #origin="cdkOverlayOrigin"
      type="button"
      aria-haspopup="dialog"
      [attr.aria-expanded]="open()"
      [attr.aria-label]="label() || null"
      (click)="open.set(!open())"
      [class]="
        cn(
          'inline-flex h-10 w-full min-w-56 items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          value() ? 'text-foreground' : 'text-muted-foreground',
          class()
        )
      "
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4 opacity-70" aria-hidden="true">
        <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      {{ displayLabel() }}
    </button>
    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="origin"
      [cdkConnectedOverlayOpen]="open()"
      [cdkConnectedOverlayPositions]="positions"
      [cdkConnectedOverlayHasBackdrop]="true"
      cdkConnectedOverlayBackdropClass="cdk-overlay-transparent-backdrop"
      [cdkConnectedOverlayPush]="true"
      (attach)="onAttach()"
      (backdropClick)="open.set(false)"
    >
      <div
        [id]="dialogId"
        cdkTrapFocus
        role="dialog"
        [attr.aria-label]="label() || 'Selector de fecha'"
        class="mt-1 rounded-lg shadow-lg"
      >
        <signng-calendar
          [value]="value()"
          (valueChange)="onPick($event)"
          [min]="min()"
          [max]="max()"
          [locale]="locale()"
        />
      </div>
    </ng-template>
  `,
})
export class DatePicker {
  readonly value = model<string | null>(null);
  readonly min = input<string | null>(null);
  readonly max = input<string | null>(null);
  readonly label = input('');
  readonly placeholder = input('Elegir fecha');
  readonly locale = input('es');
  readonly class = input('');
  readonly open = signal(false);

  protected readonly cn = cn;
  protected readonly dialogId = inject(_IdGenerator).getId('signng-datepicker-');
  private readonly trigger = viewChild.required<ElementRef<HTMLElement>>('trigger');

  protected readonly displayLabel = computed(() => {
    const v = this.value();
    if (!v) return this.placeholder();
    const [y, m, d] = v.split('-').map(Number);
    return new Intl.DateTimeFormat(this.locale(), { dateStyle: 'medium' }).format(new Date(y, m - 1, d));
  });

  /** On open, move focus to the calendar grid (APG date picker) so arrow keys work immediately. */
  protected onAttach(): void {
    queueMicrotask(() => {
      const grid = document.getElementById(this.dialogId)?.querySelector<HTMLElement>('[role="grid"]');
      grid?.focus();
    });
  }

  protected onPick(value: string | null): void {
    this.value.set(value);
    this.open.set(false);
    this.trigger().nativeElement.focus();
  }

  protected onEscape(): void {
    if (this.open()) {
      this.open.set(false);
      this.trigger().nativeElement.focus();
    }
  }

  protected readonly positions: ConnectedPosition[] = [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 },
  ];
}
