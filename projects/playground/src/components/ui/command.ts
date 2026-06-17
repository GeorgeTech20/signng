import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { CdkTrapFocus, _IdGenerator } from '@angular/cdk/a11y';
import { SignngDialogTrigger } from '@signng/core/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface CommandOption {
  value: string;
  label: string;
}

/**
 * Styled Command palette (helm) — a modal (the @signng/core/dialog primitive: centered, backdrop,
 * Esc, focus restore) containing a search combobox over a filtered command listbox. Focus auto-captures
 * to the search input; Arrow/Enter drive the list via aria-activedescendant; choosing a command emits
 * `selected` and closes. Requires the `overlay` registry item.
 */
@Component({
  selector: 'signng-command',
  imports: [SignngDialogTrigger, CdkTrapFocus, Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button signngButton variant="outline" [signngDialogTrigger]="content">{{ triggerLabel() }}</button>
    <ng-template #content let-ctx>
      <div
        cdkTrapFocus
        [cdkTrapFocusAutoCapture]="true"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="label() || 'Paleta de comandos'"
        class="w-[calc(100vw-2rem)] max-w-lg overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg"
      >
        <input
          type="text"
          role="combobox"
          autocomplete="off"
          aria-autocomplete="list"
          aria-expanded="true"
          [attr.aria-controls]="listId"
          [attr.aria-activedescendant]="activeId()"
          [attr.aria-label]="label() || 'Buscar comando'"
          [value]="query()"
          [placeholder]="placeholder()"
          (input)="onInput($event)"
          (keydown)="onKeydown($event, ctx)"
          class="w-full border-b border-border bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground"
        />
        <div class="sr-only" aria-live="polite">
          @if (!filtered().length) {
            {{ emptyLabel() }}
          }
        </div>
        <ul [id]="listId" role="listbox" [attr.aria-label]="label() || 'Comandos'" class="max-h-72 overflow-auto p-1">
          @for (cmd of filtered(); track cmd.value; let i = $index) {
            <li
              role="option"
              [id]="optId(i)"
              [attr.aria-selected]="i === activeClamped() ? 'true' : null"
              (click)="run(cmd, ctx)"
              (mouseenter)="activeIndex.set(i)"
              [class]="
                cn(
                  'flex cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm',
                  i === activeClamped() ? 'bg-accent text-accent-foreground' : ''
                )
              "
            >
              {{ cmd.label }}
            </li>
          } @empty {
            <li class="px-3 py-6 text-center text-sm text-muted-foreground">{{ emptyLabel() }}</li>
          }
        </ul>
      </div>
    </ng-template>
  `,
})
export class Command {
  readonly commands = input<CommandOption[]>([]);
  readonly triggerLabel = input('Buscar comando…');
  readonly placeholder = input('Escribe un comando o busca…');
  readonly emptyLabel = input('Sin resultados.');
  readonly label = input('');
  readonly selected = output<string>();

  protected readonly cn = cn;
  protected readonly listId = inject(_IdGenerator).getId('signng-command-');
  private readonly dialog = viewChild.required(SignngDialogTrigger);

  protected readonly query = signal('');
  protected readonly activeIndex = signal(0);

  protected readonly filtered = computed(() => {
    const q = this.query().toLowerCase().trim();
    return q ? this.commands().filter((c) => c.label.toLowerCase().includes(q)) : this.commands();
  });
  protected readonly activeClamped = computed(() => {
    const n = this.filtered().length;
    const i = this.activeIndex();
    return i >= n ? n - 1 : i;
  });
  protected readonly activeId = computed(() => {
    const i = this.activeClamped();
    return i >= 0 && i < this.filtered().length ? this.optId(i) : null;
  });

  constructor() {
    // Reset the query/selection each time the palette closes.
    effect(() => {
      if (!this.dialog().isOpen()) {
        this.query.set('');
        this.activeIndex.set(0);
      }
    });
  }

  protected optId(i: number): string {
    return `${this.listId}-opt-${i}`;
  }

  protected onInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
    this.activeIndex.set(0);
  }

  protected onKeydown(event: KeyboardEvent, ctx: { close: () => void }): void {
    const last = this.filtered().length - 1;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.activeIndex.set(Math.min(this.activeClamped() + 1, last));
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.activeIndex.set(Math.max(this.activeClamped() - 1, 0));
        break;
      case 'Enter': {
        const i = this.activeClamped();
        if (i >= 0 && i <= last) {
          event.preventDefault();
          this.run(this.filtered()[i], ctx);
        }
        break;
      }
    }
  }

  protected run(cmd: CommandOption, ctx: { close: () => void }): void {
    this.selected.emit(cmd.value);
    ctx.close();
  }
}
