import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CdkTrapFocus, _IdGenerator } from '@angular/cdk/a11y';
import { SignngDialogTrigger } from '@signng/core/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Styled Sheet / side drawer (helm) — the @signng/core/dialog trigger with an edge position.
 * Same modal guarantees as Dialog (focus trap, backdrop, Esc, focus restore); slides from a side.
 * Requires the `overlay` registry item.
 */
@Component({
  selector: 'signng-sheet',
  imports: [SignngDialogTrigger, CdkTrapFocus, Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button signngButton variant="outline" [signngDialogTrigger]="content" [position]="side()">
      {{ triggerLabel() }}
    </button>
    <ng-template #content let-ctx>
      <div
        cdkTrapFocus
        [cdkTrapFocusAutoCapture]="true"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="titleId"
        [attr.aria-describedby]="description() ? descId : null"
        [class]="cn('flex flex-col border border-border bg-background p-6 shadow-lg', sideClass())"
      >
        <h2 [id]="titleId" class="text-lg font-semibold">{{ title() }}</h2>
        @if (description()) {
          <p [id]="descId" class="mt-1 text-sm text-muted-foreground">{{ description() }}</p>
        }
        <div class="mt-4 flex-1 text-sm"><ng-content /></div>
        <div class="mt-6 flex justify-end">
          <button signngButton variant="outline" (click)="ctx.close()">{{ closeLabel() }}</button>
        </div>
      </div>
    </ng-template>
  `,
})
export class Sheet {
  readonly side = input<'left' | 'right' | 'top' | 'bottom'>('right');
  readonly title = input('');
  readonly description = input('');
  readonly triggerLabel = input('Open');
  readonly closeLabel = input('Close');

  protected readonly cn = cn;
  protected readonly titleId = inject(_IdGenerator).getId('signng-sheet-title-');
  protected readonly descId = inject(_IdGenerator).getId('signng-sheet-desc-');
  protected readonly sideClass = computed(() =>
    this.side() === 'left' || this.side() === 'right'
      ? 'h-screen w-full max-w-sm'
      : 'w-screen max-h-[80vh]',
  );
}
