import {
  Directive,
  OnDestroy,
  TemplateRef,
  ViewContainerRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';

/** Context exposed to the dialog content template (`let-ctx`). */
export interface SignngDialogContext {
  $implicit: { close: () => void };
}

/**
 * Modal Dialog trigger primitive — composes @angular/cdk/overlay (the analysis' "compose from
 * CDK" path). Owns the overlay lifecycle: centered global position, blocking scroll strategy,
 * backdrop, Esc-to-close, and focus restoration to the trigger on close. The styled content
 * template supplies role=dialog/aria-modal + `cdkTrapFocus` (focus containment + capture).
 *
 * Zoneless/SSR-safe: the overlay is only created on click (browser); no DOM at construction.
 */
@Directive({
  selector: '[signngDialogTrigger]',
  exportAs: 'signngDialogTrigger',
  host: {
    '(click)': 'open()',
    '[attr.aria-haspopup]': '"dialog"',
    '[attr.aria-expanded]': 'isOpen()',
  },
})
export class SignngDialogTrigger implements OnDestroy {
  private readonly overlay = inject(Overlay);
  private readonly viewContainer = inject(ViewContainerRef);

  /** Dialog content template. Receives `{ close }` via `let-ctx`. */
  readonly content = input.required<TemplateRef<SignngDialogContext>>({ alias: 'signngDialogTrigger' });

  /** Overlay placement: centered modal (default) or an edge sheet/drawer. */
  readonly position = input<'center' | 'left' | 'right' | 'top' | 'bottom'>('center');

  readonly isOpen = signal(false);
  private overlayRef?: OverlayRef;
  private restoreTo: HTMLElement | null = null;

  open(): void {
    if (this.overlayRef) return;
    this.restoreTo = typeof document !== 'undefined' ? (document.activeElement as HTMLElement) : null;

    const pos = this.overlay.position().global();
    switch (this.position()) {
      case 'right': pos.top('0').right('0'); break;
      case 'left': pos.top('0').left('0'); break;
      case 'top': pos.top('0').left('0'); break;
      case 'bottom': pos.bottom('0').left('0'); break;
      default: pos.centerHorizontally().centerVertically();
    }

    const ref = this.overlay.create({
      hasBackdrop: true,
      backdropClass: 'signng-dialog-backdrop',
      positionStrategy: pos,
      scrollStrategy: this.overlay.scrollStrategies.block(),
    });
    this.overlayRef = ref;
    this.isOpen.set(true);

    const context: SignngDialogContext = { $implicit: { close: () => this.close() } };
    ref.attach(new TemplatePortal(this.content(), this.viewContainer, context));
    ref.backdropClick().subscribe(() => this.close());
    ref.keydownEvents().subscribe((event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        this.close();
      }
    });
  }

  close(): void {
    if (!this.overlayRef) return;
    this.overlayRef.dispose();
    this.overlayRef = undefined;
    this.isOpen.set(false);
    this.restoreTo?.focus?.();
    this.restoreTo = null;
  }

  ngOnDestroy(): void {
    this.close();
  }
}
