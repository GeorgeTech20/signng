import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, input, model } from '@angular/core';
import { cn } from '@/lib/utils';

/**
 * Styled Resizable (helm) — two panels split by a draggable separator. Pointer drag (with pointer
 * capture) and keyboard (Arrows ±5%, Home/End) adjust the split. role=separator + aria-orientation +
 * aria-valuenow/min/max. Project `[resizableStart]` and `[resizableEnd]`.
 */
@Component({
  selector: 'signng-resizable',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClass()',
  },
  template: `
    <div [style.flex-basis.%]="split()" class="min-h-0 min-w-0 overflow-auto">
      <ng-content select="[resizableStart]" />
    </div>
    <div
      role="separator"
      tabindex="0"
      [attr.aria-orientation]="orientation()"
      aria-valuemin="0"
      aria-valuemax="100"
      [attr.aria-valuenow]="round()"
      [attr.aria-label]="label() || 'Redimensionar paneles'"
      (pointerdown)="onDown($event)"
      (pointermove)="onMove($event)"
      (pointerup)="onUp($event)"
      (keydown)="onKey($event)"
      [class]="
        cn(
          'relative shrink-0 bg-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          orientation() === 'vertical' ? 'h-1.5 w-full cursor-row-resize' : 'w-1.5 cursor-col-resize'
        )
      "
    ></div>
    <div class="min-h-0 min-w-0 flex-1 overflow-auto">
      <ng-content select="[resizableEnd]" />
    </div>
  `,
})
export class SignngResizable {
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
  readonly label = input('');
  readonly split = model(50); // percent of the start panel

  protected readonly cn = cn;
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private dragging = false;

  protected readonly hostClass = computed(() =>
    cn('flex w-full', this.orientation() === 'vertical' ? 'flex-col' : 'flex-row'),
  );
  protected round(): number {
    return Math.round(this.split());
  }

  protected onDown(event: PointerEvent): void {
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    this.dragging = true;
    event.preventDefault();
  }

  protected onMove(event: PointerEvent): void {
    if (!this.dragging) return;
    const rect = this.host.nativeElement.getBoundingClientRect();
    const pct =
      this.orientation() === 'vertical'
        ? ((event.clientY - rect.top) / rect.height) * 100
        : ((event.clientX - rect.left) / rect.width) * 100;
    this.split.set(Math.min(95, Math.max(5, pct)));
  }

  protected onUp(event: PointerEvent): void {
    this.dragging = false;
    (event.target as HTMLElement).releasePointerCapture(event.pointerId);
  }

  protected onKey(event: KeyboardEvent): void {
    const back = this.orientation() === 'vertical' ? 'ArrowUp' : 'ArrowLeft';
    const fwd = this.orientation() === 'vertical' ? 'ArrowDown' : 'ArrowRight';
    let next: number | undefined;
    if (event.key === back) next = this.split() - 5;
    else if (event.key === fwd) next = this.split() + 5;
    else if (event.key === 'Home') next = 5;
    else if (event.key === 'End') next = 95;
    else return;
    event.preventDefault();
    this.split.set(Math.min(95, Math.max(5, next)));
  }
}
