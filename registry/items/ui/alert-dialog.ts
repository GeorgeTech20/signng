import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { CdkTrapFocus, _IdGenerator } from '@angular/cdk/a11y';
import { SignngDialogTrigger } from '@signng/core/dialog';
import { Button } from '@/components/ui/button';

/**
 * Styled AlertDialog (helm) — a confirm/cancel modal over the @signng/core/dialog trigger
 * primitive (centered, scroll-blocked, backdrop, Esc, focus restore). role=alertdialog +
 * aria-modal + APG naming. Emits `confirmed` on the confirm action. Requires the `overlay` item.
 */
@Component({
  selector: 'signng-alert-dialog',
  imports: [SignngDialogTrigger, CdkTrapFocus, Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button signngButton variant="destructive" [signngDialogTrigger]="content">{{ triggerLabel() }}</button>
    <ng-template #content let-ctx>
      <div
        cdkTrapFocus
        [cdkTrapFocusAutoCapture]="true"
        role="alertdialog"
        aria-modal="true"
        [attr.aria-labelledby]="title() ? titleId : null"
        [attr.aria-label]="title() ? null : 'Confirmación'"
        [attr.aria-describedby]="description() ? descId : null"
        class="w-[calc(100vw-2rem)] max-w-md rounded-lg border border-border bg-background p-6 shadow-lg"
      >
        <h2 [id]="titleId" class="text-lg font-semibold">{{ title() }}</h2>
        @if (description()) {
          <p [id]="descId" class="mt-2 text-sm text-muted-foreground">{{ description() }}</p>
        }
        <div class="mt-6 flex justify-end gap-2">
          <button signngButton variant="outline" (click)="ctx.close()">{{ cancelLabel() }}</button>
          <button signngButton variant="destructive" (click)="confirmed.emit(); ctx.close()">
            {{ confirmLabel() }}
          </button>
        </div>
      </div>
    </ng-template>
  `,
})
export class AlertDialog {
  readonly title = input('¿Estás seguro?');
  readonly description = input('Esta acción no se puede deshacer.');
  readonly triggerLabel = input('Eliminar');
  readonly cancelLabel = input('Cancelar');
  readonly confirmLabel = input('Confirmar');
  readonly confirmed = output<void>();

  protected readonly titleId = inject(_IdGenerator).getId('signng-alertdialog-title-');
  protected readonly descId = inject(_IdGenerator).getId('signng-alertdialog-desc-');
}
