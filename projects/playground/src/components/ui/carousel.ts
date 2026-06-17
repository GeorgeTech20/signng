import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  computed,
  contentChildren,
  forwardRef,
  inject,
  input,
  model,
} from '@angular/core';

/** A carousel slide. Apply to each slide element: `<div signngCarouselItem>…`. */
@Directive({
  selector: '[signngCarouselItem]',
  host: {
    role: 'group',
    'aria-roledescription': 'diapositiva',
    '[attr.aria-label]': 'ariaLabel()',
    class: 'min-w-0 shrink-0 grow-0 basis-full',
  },
})
export class SignngCarouselItem {
  private readonly carousel = inject<SignngCarousel>(forwardRef(() => SignngCarousel));
  readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly ariaLabel = computed(() => {
    const idx = this.carousel.indexOf(this);
    return idx >= 0 ? `${idx + 1} de ${this.carousel.count()}` : null;
  });
}

/**
 * Styled Carousel (helm) — region with prev/next + arrow-key navigation over projected
 * `[signngCarouselItem]` slides. aria-roledescription=carousel/slide; a polite live region announces
 * the current slide. Track is transform-driven (no gesture lib).
 */
@Component({
  selector: 'signng-carousel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'region',
    'aria-roledescription': 'carrusel',
    '[attr.aria-label]': 'label()',
    tabindex: '0',
    '(keydown)': 'onKeydown($event)',
    class: 'relative block rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring',
  },
  template: `
    <div class="overflow-hidden rounded-md">
      <div class="flex transition-transform duration-300" [style.transform]="'translateX(-' + index() * 100 + '%)'">
        <ng-content />
      </div>
    </div>
    <button
      type="button"
      (click)="prev()"
      [disabled]="index() === 0"
      aria-label="Diapositiva anterior"
      class="absolute left-2 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background shadow disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4" aria-hidden="true"><path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" /></svg>
    </button>
    <button
      type="button"
      (click)="next()"
      [disabled]="index() >= count() - 1"
      aria-label="Diapositiva siguiente"
      class="absolute right-2 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background shadow disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4" aria-hidden="true"><path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round" /></svg>
    </button>
    <div aria-live="polite" class="sr-only">Diapositiva {{ index() + 1 }} de {{ count() }}</div>
  `,
})
export class SignngCarousel {
  readonly label = input('Carrusel');
  readonly index = model(0);
  private readonly items = contentChildren(SignngCarouselItem);

  readonly count = computed(() => this.items().length);
  indexOf(item: SignngCarouselItem): number {
    return this.items().indexOf(item);
  }

  protected prev(): void {
    if (this.index() > 0) this.index.update((v) => v - 1);
  }
  protected next(): void {
    if (this.index() < this.count() - 1) this.index.update((v) => v + 1);
  }
  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.prev();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.next();
    }
  }
}

export const SIGNNG_CAROUSEL = [SignngCarousel, SignngCarouselItem] as const;
