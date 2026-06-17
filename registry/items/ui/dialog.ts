import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { CdkTrapFocus, _IdGenerator } from '@angular/cdk/a11y';
import { SignngDialogTrigger } from '@signng/core/dialog';
import { Button } from '@/components/ui/button';

/**
 * Styled modal Dialog (helm). The @signng/core/dialog trigger owns the overlay lifecycle
 * (centered, scroll-blocked, backdrop, Esc, focus restore); this template adds the styled card
 * plus cdkTrapFocus (focus containment + auto-capture), role=dialog/aria-modal, and APG naming
 * (aria-labelledby -> visible title, aria-describedby -> description).
 *
 * Requires the `overlay` registry item (CDK prebuilt CSS + backdrop) — pulled in as a dependency.
 */
@Component({
  selector: 'signng-dialog',
  imports: [SignngDialogTrigger, CdkTrapFocus, Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button signngButton [signngDialogTrigger]="content">{{ triggerLabel() }}</button>
    <ng-template #content let-ctx>
      <div
        cdkTrapFocus
        [cdkTrapFocusAutoCapture]="true"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="title() ? titleId : null"
        [attr.aria-label]="title() ? null : 'Diálogo'"
        [attr.aria-describedby]="description() ? descId : null"
        class="w-[calc(100vw-2rem)] max-w-lg rounded-lg border border-border bg-background p-6 shadow-lg"
      >
        <h2 [id]="titleId" class="text-lg font-semibold">{{ title() }}</h2>
        @if (description()) {
          <p [id]="descId" class="mt-1 text-sm text-muted-foreground">{{ description() }}</p>
        }
        <div class="mt-4 text-sm"><ng-content /></div>
        <div class="mt-6 flex justify-end gap-2">
          <button signngButton variant="outline" (click)="ctx.close()">{{ closeLabel() }}</button>
        </div>
      </div>
    </ng-template>
  `,
})
export class Dialog {
  readonly title = input('');
  readonly description = input('');
  readonly triggerLabel = input('Open');
  readonly closeLabel = input('Close');

  protected readonly titleId = inject(_IdGenerator).getId('signng-dialog-title-');
  protected readonly descId = inject(_IdGenerator).getId('signng-dialog-desc-');
}
