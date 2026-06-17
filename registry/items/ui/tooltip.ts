import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { _IdGenerator } from '@angular/cdk/a11y';
import { CdkConnectedOverlay, CdkOverlayOrigin, type ConnectedPosition } from '@angular/cdk/overlay';

/**
 * Styled Tooltip (helm) composed from @angular/cdk/overlay's declarative connected overlay.
 * Shows on hover/focus, hides on leave/blur/Escape (Escape works regardless of focus — APG 1.4.13).
 * The bubble has a stable id; the trigger references it via aria-describedby while open.
 * Overlay opens only on interaction → SSR-safe.
 */
@Component({
  selector: 'signng-tooltip',
  imports: [CdkConnectedOverlay, CdkOverlayOrigin],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'dismiss()',
  },
  template: `
    <span
      cdkOverlayOrigin
      #origin="cdkOverlayOrigin"
      class="inline-flex"
      [attr.aria-describedby]="open() ? id : null"
      (mouseenter)="hovered.set(true)"
      (mouseleave)="hovered.set(false)"
      (focusin)="focused.set(true)"
      (focusout)="focused.set(false)"
    >
      <ng-content />
    </span>
    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="origin"
      [cdkConnectedOverlayOpen]="open()"
      [cdkConnectedOverlayPositions]="positions"
      [cdkConnectedOverlayPush]="true"
    >
      <div
        [id]="id"
        role="tooltip"
        (mouseenter)="bubbleHovered.set(true)"
        (mouseleave)="bubbleHovered.set(false)"
        class="z-50 max-w-xs rounded-md bg-foreground px-3 py-1.5 text-xs text-background shadow-md"
      >
        {{ text() }}
      </div>
    </ng-template>
  `,
})
export class Tooltip {
  readonly text = input('');

  protected readonly id = inject(_IdGenerator).getId('signng-tooltip-');
  protected readonly hovered = signal(false);
  protected readonly focused = signal(false);
  // WCAG 1.4.13: the tooltip stays open while the pointer is over the bubble itself (hoverable).
  protected readonly bubbleHovered = signal(false);
  protected readonly open = computed(() => this.hovered() || this.focused() || this.bubbleHovered());

  protected dismiss(): void {
    this.hovered.set(false);
    this.focused.set(false);
    this.bubbleHovered.set(false);
  }

  protected readonly positions: ConnectedPosition[] = [
    { originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom', offsetY: -6 },
    { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top', offsetY: 6 },
  ];
}
