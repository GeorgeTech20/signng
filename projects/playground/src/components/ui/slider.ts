import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  model,
  numberAttribute,
} from '@angular/core';
import { SignngSlider, SignngSliderThumb } from '@signng/core/slider';
import { cn } from '@/lib/utils';

/**
 * Styled Slider (helm layer). Copied into the consumer repo — they own this file.
 * Behaviour + a11y come from the versioned npm primitive `@signng/core/slider`
 * (hybrid distribution: cosmetic source copied, a11y-critical core stays patchable).
 */
@Component({
  selector: 'signng-slider',
  imports: [SignngSlider, SignngSliderThumb],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      signngSlider
      [(value)]="value"
      [min]="min()"
      [max]="max()"
      [step]="step()"
      [disabled]="disabled()"
      [class]="cn('relative flex h-5 w-full touch-none select-none items-center', class())"
    >
      <span class="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
        <span class="absolute h-full bg-primary" [style.width.%]="percent()"></span>
      </span>
      <span
        signngSliderThumb
        [valueFormat]="valueFormat()"
        [attr.aria-label]="ariaLabel()"
        class="absolute block size-5 -translate-x-1/2 rounded-full border-2 border-primary bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background data-[disabled]:opacity-50"
      ></span>
    </div>
  `,
})
export class Slider {
  readonly value = model(0);
  readonly min = input(0, { transform: numberAttribute });
  readonly max = input(100, { transform: numberAttribute });
  readonly step = input(1, { transform: numberAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly valueFormat = input<((value: number) => string) | undefined>(undefined);
  readonly ariaLabel = input<string | undefined>(undefined);
  readonly class = input('');

  protected readonly cn = cn;
  protected readonly percent = computed(() => {
    const range = this.max() - this.min();
    return range <= 0 ? 0 : ((this.value() - this.min()) / range) * 100;
  });
}
