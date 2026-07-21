import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';
import { SIGNNG_ACCORDION } from '@signng/core/accordion';

export interface AccordionItem {
  value: string;
  title: string;
  content: string;
}

/**
 * Styled Accordion (helm) over @angular/aria's accordion directives — a11y (keyboard, aria-expanded,
 * lazy panel content) is inherited from Google; SignNG adds the skin + chevron.
 */
@Component({
  selector: 'signng-accordion',
  imports: [SIGNNG_ACCORDION],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      ngAccordionGroup
      [multiExpandable]="multiple()"
      class="divide-y divide-border overflow-hidden rounded-md border border-border"
    >
      @for (item of items(); track item.value) {
        <div>
          <h3 class="flex">
            <button
              ngAccordionTrigger
              [panel]="panel"
              class="group flex flex-1 items-center justify-between px-4 py-3 text-sm font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
            >
              {{ item.title }}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                class="size-4 shrink-0 transition-transform group-aria-expanded:rotate-180"
                aria-hidden="true"
              >
                <path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </h3>
          <div ngAccordionPanel #panel="ngAccordionPanel">
            <ng-template ngAccordionContent>
              <div class="px-4 pb-3 text-sm text-muted-foreground">{{ item.content }}</div>
            </ng-template>
          </div>
        </div>
      }
    </div>
  `,
})
export class Accordion {
  readonly items = input<AccordionItem[]>([]);
  readonly multiple = input(false, { transform: booleanAttribute });
}
