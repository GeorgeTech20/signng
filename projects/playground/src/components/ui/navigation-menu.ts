import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  computed,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { _IdGenerator } from '@angular/cdk/a11y';
import { CdkConnectedOverlay, CdkOverlayOrigin, type ConnectedPosition } from '@angular/cdk/overlay';

/**
 * Styled NavigationMenu (helm compound) — a row of disclosure triggers, each revealing a projected
 * content panel in a CDK overlay (one open at a time). Click toggles; a transparent backdrop closes on
 * outside-click; Escape closes. Triggers are normal Tab stops with aria-expanded + aria-controls.
 * Project content inside each `<signng-nav-item label="…">`. Requires the `overlay` registry item.
 */
@Directive({
  selector: '[signngNavMenu], signng-nav-menu',
  host: {
    class: 'relative flex items-center gap-1',
    '(document:keydown.escape)': 'close()',
  },
})
export class SignngNavMenu {
  private readonly openItem = signal<object | null>(null);
  isOpen(item: object): boolean {
    return this.openItem() === item;
  }
  toggle(item: object): void {
    this.openItem.update((cur) => (cur === item ? null : item));
  }
  open(item: object): void {
    this.openItem.set(item);
  }
  close(): void {
    this.openItem.set(null);
  }
}

@Component({
  selector: 'signng-nav-item',
  imports: [CdkConnectedOverlay, CdkOverlayOrigin],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      cdkOverlayOrigin
      #origin="cdkOverlayOrigin"
      type="button"
      [attr.aria-expanded]="open()"
      [attr.aria-controls]="open() ? panelId : null"
      (click)="nav.toggle(this)"
      class="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring aria-expanded:bg-accent aria-expanded:text-accent-foreground"
    >
      {{ label() }}
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-3.5 transition-transform aria-expanded:rotate-180" aria-hidden="true">
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
      (backdropClick)="nav.close()"
    >
      <div
        [id]="panelId"
        role="region"
        [attr.aria-label]="label()"
        class="z-50 mt-1 min-w-56 rounded-md border border-border bg-popover p-4 text-sm text-popover-foreground shadow-md outline-none"
      >
        <ng-content />
      </div>
    </ng-template>
  `,
})
export class SignngNavItem {
  readonly label = input('');
  protected readonly nav = inject<SignngNavMenu>(forwardRef(() => SignngNavMenu));
  protected readonly panelId = inject(_IdGenerator).getId('signng-navpanel-');
  protected readonly open = computed(() => this.nav.isOpen(this));

  protected readonly positions: ConnectedPosition[] = [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 },
  ];
}

export const SIGNNG_NAVIGATION_MENU = [SignngNavMenu, SignngNavItem] as const;
