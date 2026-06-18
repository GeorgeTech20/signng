import { ChangeDetectionStrategy, Component, inject, input, model, signal } from '@angular/core';
import { Icon } from '@/components/ui/icon';
import { SIGNNG_I18N } from '@/components/ui/i18n';

/**
 * TagInput (helm) — free-text multi-value entry: type + Enter/comma to add a chip, Backspace on an empty
 * field removes the last, click ✕ to remove any. `tags` is a two-way `string[]` model; duplicates and
 * blanks are ignored. Signals-only, OnPush.
 */
@Component({
  selector: 'signng-tag-input',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div
      (click)="field.focus()"
      class="flex min-h-9 cursor-text flex-wrap items-center gap-1 rounded-md border border-input bg-background px-2 py-1 focus-within:ring-2 focus-within:ring-ring"
    >
      @for (tag of tags(); track $index) {
        <span class="inline-flex items-center gap-1 rounded bg-secondary px-1.5 py-0.5 text-xs text-secondary-foreground">
          {{ tag }}
          <button type="button" (click)="removeAt($index)" [attr.aria-label]="'Quitar ' + tag" class="hover:text-foreground">
            <signng-icon name="x" [size]="12" />
          </button>
        </span>
      }
      <input
        #field
        type="text"
        [value]="draft()"
        [attr.aria-label]="label() || null"
        [placeholder]="tags().length ? '' : (placeholder() || 'Añadir…')"
        (input)="draft.set($any($event.target).value)"
        (keydown)="onKey($event)"
        (blur)="commit()"
        class="min-w-[80px] flex-1 bg-transparent px-1 py-0.5 text-sm outline-none"
      />
    </div>
  `,
})
export class TagInput {
  readonly tags = model<string[]>([]);
  readonly placeholder = input('');
  readonly label = input('');
  protected readonly i18n = inject(SIGNNG_I18N);
  protected readonly draft = signal('');

  protected onKey(e: KeyboardEvent): void {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      this.commit();
    } else if (e.key === 'Backspace' && this.draft() === '' && this.tags().length) {
      this.tags.set(this.tags().slice(0, -1));
    }
  }
  protected commit(): void {
    const v = this.draft().trim();
    if (v && !this.tags().includes(v)) this.tags.set([...this.tags(), v]);
    this.draft.set('');
  }
  protected removeAt(i: number): void {
    this.tags.set(this.tags().filter((_, idx) => idx !== i));
  }
}
