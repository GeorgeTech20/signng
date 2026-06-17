import {
  Directive,
  Injectable,
  ElementRef,
  inject,
  input,
  model,
  signal,
  computed,
  effect,
  booleanAttribute,
  numberAttribute,
} from '@angular/core';

/**
 * Net-new headless Slider primitive — authored from scratch because no accessible slider
 * primitive exists in `@angular/aria` *or* `@angular/cdk` (it is part of signng's
 * contribution surface, per the architecture analysis).
 *
 * Design rules:
 *  - The WAI-ARIA `slider` role + all `aria-value*` live in the THUMB directive's host
 *    bindings, so a consumer styling the markup cannot accidentally drop accessibility.
 *  - Full keyboard control (arrows / Page / Home / End) is the WCAG 2.5.7 non-drag
 *    alternative to pointer dragging.
 *  - Signals-only, OnPush- and zoneless-safe: no zone.js reliance, and the DOM is only
 *    measured inside pointer handlers (browser-only), never at construction → SSR-safe.
 *  - No `bypassSecurityTrust*`, no raw DOM writes (security LAYER 1).
 */

type Orientation = 'horizontal' | 'vertical';

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

function snapToStep(value: number, min: number, step: number): number {
  if (step <= 0) return value;
  return min + Math.round((value - min) / step) * step;
}

/** Shared reactive state — the DI-provided "context" every slider part reads. */
@Injectable()
export class SignngSliderState {
  readonly min = signal(0);
  readonly max = signal(100);
  readonly step = signal(1);
  readonly disabled = signal(false);
  readonly orientation = signal<Orientation>('horizontal');
  readonly value = signal(0);

  /** Filled position as a percentage of the track. */
  readonly percent = computed(() => {
    const range = this.max() - this.min();
    return range <= 0 ? 0 : (clamp(this.value(), this.min(), this.max()) - this.min()) / range * 100;
  });

  setValue(next: number): void {
    this.value.set(clamp(snapToStep(next, this.min(), this.step()), this.min(), this.max()));
  }
  increment(steps = 1): void {
    this.setValue(this.value() + this.step() * steps);
  }
  decrement(steps = 1): void {
    this.setValue(this.value() - this.step() * steps);
  }
}

/**
 * Root / track directive. Provides the shared state, mirrors inputs into it, and owns
 * pointer dragging on the track.
 */
@Directive({
  selector: '[signngSlider]',
  exportAs: 'signngSlider',
  providers: [SignngSliderState],
  host: {
    class: 'signng-slider',
    '[attr.data-orientation]': 'state.orientation()',
    '[attr.data-disabled]': 'state.disabled() ? "" : null',
    '(pointerdown)': 'onPointerDown($event)',
    '(pointermove)': 'onPointerMove($event)',
    '(pointerup)': 'onPointerUp($event)',
    '(pointercancel)': 'onPointerUp($event)',
  },
})
export class SignngSlider {
  protected readonly state = inject(SignngSliderState);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private dragging = false;

  readonly min = input(0, { transform: numberAttribute });
  readonly max = input(100, { transform: numberAttribute });
  readonly step = input(1, { transform: numberAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly orientation = input<Orientation>('horizontal');
  /** Two-way bound current value: `[(value)]`. Controlled iff the parent binds it. */
  readonly value = model(0);

  constructor() {
    // Inputs → state.
    effect(() => this.state.min.set(this.min()));
    effect(() => this.state.max.set(this.max()));
    effect(() => this.state.step.set(this.step()));
    effect(() => this.state.disabled.set(this.disabled()));
    effect(() => this.state.orientation.set(this.orientation()));
    // External value → state (clamped/snapped). Converges, so no ping-pong.
    effect(() => this.state.setValue(this.value()));
    // State → external model.
    effect(() => this.value.set(this.state.value()));
  }

  protected onPointerDown(event: PointerEvent): void {
    if (this.state.disabled()) return;
    this.dragging = true;
    this.host.nativeElement.setPointerCapture?.(event.pointerId);
    this.updateFromPointer(event);
    event.preventDefault();
  }

  protected onPointerMove(event: PointerEvent): void {
    if (this.dragging) this.updateFromPointer(event);
  }

  protected onPointerUp(event: PointerEvent): void {
    if (!this.dragging) return;
    this.dragging = false;
    this.host.nativeElement.releasePointerCapture?.(event.pointerId);
  }

  private updateFromPointer(event: PointerEvent): void {
    // getBoundingClientRect only runs inside a pointer handler → browser-only, SSR-safe.
    const rect = this.host.nativeElement.getBoundingClientRect();
    const horizontal = this.state.orientation() === 'horizontal';
    const ratio = horizontal
      ? (event.clientX - rect.left) / rect.width
      : 1 - (event.clientY - rect.top) / rect.height;
    const range = this.state.max() - this.state.min();
    this.state.setValue(this.state.min() + clamp(ratio, 0, 1) * range);
  }
}

/**
 * Thumb directive — the focusable `role="slider"` element. Owns all ARIA wiring and the
 * keyboard model (the non-drag alternative).
 */
@Directive({
  selector: '[signngSliderThumb]',
  exportAs: 'signngSliderThumb',
  host: {
    role: 'slider',
    class: 'signng-slider-thumb',
    '[attr.tabindex]': 'state.disabled() ? -1 : 0',
    '[attr.aria-valuemin]': 'state.min()',
    '[attr.aria-valuemax]': 'state.max()',
    '[attr.aria-valuenow]': 'state.value()',
    '[attr.aria-valuetext]': 'valueText()',
    '[attr.aria-orientation]': 'state.orientation()',
    '[attr.aria-disabled]': 'state.disabled() ? "true" : null',
    '[style.inset-inline-start.%]': "state.orientation() === 'horizontal' ? state.percent() : null",
    '[style.inset-block-end.%]': "state.orientation() === 'vertical' ? state.percent() : null",
    '(keydown)': 'onKeydown($event)',
  },
})
export class SignngSliderThumb {
  protected readonly state = inject(SignngSliderState);

  /** Optional formatter for `aria-valuetext` (e.g. currency, %, units). */
  readonly valueFormat = input<((value: number) => string) | undefined>(undefined);

  protected readonly valueText = computed(() => {
    const format = this.valueFormat();
    return format ? format(this.state.value()) : String(this.state.value());
  });

  protected onKeydown(event: KeyboardEvent): void {
    if (this.state.disabled()) return;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        this.state.increment();
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        this.state.decrement();
        break;
      case 'PageUp':
        this.state.increment(10);
        break;
      case 'PageDown':
        this.state.decrement(10);
        break;
      case 'Home':
        this.state.setValue(this.state.min());
        break;
      case 'End':
        this.state.setValue(this.state.max());
        break;
      default:
        return; // let other keys through
    }
    event.preventDefault();
  }
}

/** Convenience import barrel for templates. */
export const SIGNNG_SLIDER = [SignngSlider, SignngSliderThumb] as const;
