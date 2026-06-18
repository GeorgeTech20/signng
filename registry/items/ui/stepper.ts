import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { Icon } from '@/components/ui/icon';

export interface Step {
  label: string;
  description?: string;
}

/**
 * Stepper (helm) — a multi-step progress indicator for wizards. Shows a numbered node per step
 * (checkmark once complete, ring while active), connectors between them, and labels. `current` is a
 * two-way 0-based model; when `clickable`, completed/active steps are focusable buttons. Horizontal or
 * vertical. aria: ol/li with aria-current="step". Signals-only, OnPush.
 */
@Component({
  selector: 'signng-stepper',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <ol [class]="orientation() === 'vertical' ? 'flex flex-col gap-1' : 'flex items-center'">
      @for (step of steps(); track $index; let i = $index; let last = $last) {
        <li [class]="orientation() === 'vertical' ? 'flex gap-3' : 'flex flex-1 items-center last:flex-none'"
          [attr.aria-current]="i === current() ? 'step' : null">
          <div class="flex flex-col items-center" [class.flex-row]="orientation() === 'horizontal'">
            <button
              type="button"
              [disabled]="!clickable() || i > current()"
              (click)="clickable() && i <= current() && current.set(i)"
              [class]="node(i)"
            >
              @if (i < current()) { <signng-icon name="check" [size]="15" /> } @else { {{ i + 1 }} }
            </button>
          </div>
          <div [class]="orientation() === 'vertical' ? 'pb-4' : 'ml-2 mr-3'">
            <div [class]="'text-sm font-medium ' + (i <= current() ? 'text-foreground' : 'text-muted-foreground')">{{ step.label }}</div>
            @if (step.description) { <div class="text-xs text-muted-foreground">{{ step.description }}</div> }
          </div>
          @if (!last && orientation() === 'horizontal') {
            <div [class]="'h-px flex-1 ' + (i < current() ? 'bg-primary' : 'bg-border')"></div>
          }
        </li>
      }
    </ol>
  `,
})
export class Stepper {
  readonly steps = input<Step[]>([]);
  readonly current = model(0);
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
  readonly clickable = input(false);

  protected node(i: number): string {
    const base =
      'flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default ' +
      (this.clickable() && i <= this.current() ? 'cursor-pointer' : '');
    if (i < this.current()) return base + ' bg-primary text-primary-foreground';
    if (i === this.current()) return base + ' border-2 border-primary text-primary';
    return base + ' border border-border text-muted-foreground';
  }
}
