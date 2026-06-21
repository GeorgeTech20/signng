import { ChangeDetectionStrategy, Component, ElementRef, input, model, signal, viewChild } from '@angular/core';

type Range = [number, number];

/**
 * RangeSlider (helm) — a two-thumb slider selecting a [low, high] range (Radix-style; the net-new single
 * slider stays single). Each thumb is role=slider with its own aria-valuemin/max/now bounded by the other
 * thumb; pointer drag moves the nearest thumb; Arrow/Home/End adjust the focused thumb. Values snap to
 * `step`, clamp to [min,max], and the thumbs can't cross. `value` is a two-way [low, high] model.
 * Signals-only, OnPush, touch-action: none for clean dragging.
 */
@Component({
  selector: 'signng-range-slider',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div
      #track
      (pointerdown)="onDown($event)"
      (pointermove)="onMove($event)"
      (pointerup)="active.set(-1)"
      (pointercancel)="active.set(-1)"
      class="relative flex h-5 w-full touch-none select-none items-center"
    >
      <div class="absolute h-1.5 w-full rounded-full bg-muted"></div>
      <div class="absolute h-1.5 rounded-full bg-primary" [style.left.%]="pct(value()[0])" [style.right.%]="100 - pct(value()[1])"></div>
      @for (i of [0, 1]; track i) {
        <button
          type="button"
          role="slider"
          [attr.aria-label]="(ariaLabel() || 'Rango') + (i === 0 ? ' — mínimo' : ' — máximo')"
          [attr.aria-valuemin]="i === 0 ? min() : value()[0]"
          [attr.aria-valuemax]="i === 0 ? value()[1] : max()"
          [attr.aria-valuenow]="value()[i]"
          (keydown)="onKey($event, i)"
          [style.left.%]="pct(value()[i])"
          class="absolute size-4 -translate-x-1/2 rounded-full border-2 border-primary bg-background shadow transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        ></button>
      }
    </div>
  `,
})
export class RangeSlider {
  readonly value = model<Range>([20, 60]);
  readonly min = input(0);
  readonly max = input(100);
  readonly step = input(1);
  readonly ariaLabel = input('');

  private readonly track = viewChild.required<ElementRef<HTMLElement>>('track');
  protected readonly active = signal(-1);

  protected pct(v: number): number {
    const span = this.max() - this.min();
    return span <= 0 ? 0 : ((v - this.min()) / span) * 100;
  }

  protected onDown(e: PointerEvent): void {
    const v = this.fromX(e.clientX);
    const [lo, hi] = this.value();
    const i = Math.abs(v - lo) <= Math.abs(v - hi) ? 0 : 1;
    this.active.set(i);
    this.setThumb(i, v);
    this.track().nativeElement.setPointerCapture?.(e.pointerId);
  }
  protected onMove(e: PointerEvent): void {
    if (this.active() < 0) return;
    this.setThumb(this.active(), this.fromX(e.clientX));
  }
  protected onKey(e: KeyboardEvent, i: number): void {
    const s = this.step();
    let d = 0;
    switch (e.key) {
      case 'ArrowRight': case 'ArrowUp': d = s; break;
      case 'ArrowLeft': case 'ArrowDown': d = -s; break;
      case 'Home': this.setThumb(i, i === 0 ? this.min() : this.value()[0]); e.preventDefault(); return;
      case 'End': this.setThumb(i, i === 0 ? this.value()[1] : this.max()); e.preventDefault(); return;
      default: return;
    }
    e.preventDefault();
    this.setThumb(i, this.value()[i] + d);
  }

  private fromX(clientX: number): number {
    const r = this.track().nativeElement.getBoundingClientRect();
    const ratio = r.width <= 0 ? 0 : (clientX - r.left) / r.width;
    return this.min() + ratio * (this.max() - this.min());
  }
  private setThumb(i: number, raw: number): void {
    const s = this.step();
    let v = Math.round(raw / s) * s;
    v = Math.max(this.min(), Math.min(this.max(), v));
    const [lo, hi] = this.value();
    if (i === 0) v = Math.min(v, hi);
    else v = Math.max(v, lo);
    const next: Range = i === 0 ? [v, hi] : [lo, v];
    if (next[0] !== lo || next[1] !== hi) this.value.set(next);
  }
}
