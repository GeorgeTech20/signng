import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { AbstractControl, type ValidationErrors } from '@angular/forms';
import { _IdGenerator } from '@angular/cdk/a11y';

// Default messages for the common built-in Angular validators (override per-field via `messages`).
const DEFAULT_MESSAGES: Record<string, (e: any) => string> = {
  required: () => 'Este campo es obligatorio.',
  email: () => 'Correo no válido.',
  minlength: (e) => `Mínimo ${e?.requiredLength} caracteres.`,
  maxlength: (e) => `Máximo ${e?.requiredLength} caracteres.`,
  min: (e) => `Debe ser ≥ ${e?.min}.`,
  max: (e) => `Debe ser ≤ ${e?.max}.`,
  pattern: () => 'Formato no válido.',
};

/**
 * Field (helm) — the Angular-idiomatic equivalent of shadcn's <Form>: wraps a reactive-forms control with
 * a label, projected control, description, and an auto error message derived from the control's validators.
 * The error shows once the control is invalid AND touched/dirty, with role=alert (announced). If you mark
 * the projected input with `#control`, the field wires aria-invalid + aria-describedby onto it. Use inside
 * a reactive form: `<signng-field [control]="f.controls.email" label="Email"><input signngInput #control
 * formControlName="email" /></signng-field>`. Signals-only, OnPush.
 */
@Component({
  selector: 'signng-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block space-y-1.5' },
  template: `
    @if (label()) {
      <label [attr.for]="forId() || null" class="text-sm font-medium leading-none peer-disabled:opacity-70">
        {{ label() }}@if (required()) {<span class="text-destructive" aria-hidden="true"> *</span>}
      </label>
    }
    <ng-content />
    @if (showError()) {
      <p [id]="errId" class="text-sm font-medium text-destructive" role="alert">{{ errorText() }}</p>
    } @else if (description()) {
      <p [id]="descId" class="text-sm text-muted-foreground">{{ description() }}</p>
    }
  `,
})
export class SignngField {
  readonly control = input<AbstractControl | null>(null);
  readonly label = input('');
  readonly description = input('');
  readonly required = input(false);
  /** id of the projected control, for the label's `for`. */
  readonly forId = input('');
  /** override default validator messages: { required: '…', email: '…' }. */
  readonly messages = input<Record<string, string>>({});

  protected readonly errId = inject(_IdGenerator).getId('signng-field-err-');
  protected readonly descId = inject(_IdGenerator).getId('signng-field-desc-');

  // Reactive-forms state (touched/invalid/errors) isn't signal-based, so bridge control.events -> a tick
  // signal the computeds depend on; resubscribes if the bound control changes.
  private readonly tick = signal(0);
  constructor() {
    effect((onCleanup) => {
      const c = this.control();
      this.tick.update((v) => v + 1);
      if (!c) return;
      const sub = c.events.subscribe(() => this.tick.update((v) => v + 1));
      onCleanup(() => sub.unsubscribe());
    });
  }

  protected readonly showError = computed(() => {
    this.tick();
    const c = this.control();
    return !!c && c.invalid && (c.touched || c.dirty);
  });
  protected readonly errorText = computed(() => {
    this.tick();
    const errs = this.control()?.errors as ValidationErrors | null;
    if (!errs) return '';
    const key = Object.keys(errs)[0];
    const custom = this.messages()[key];
    if (custom) return custom;
    const fn = DEFAULT_MESSAGES[key];
    return fn ? fn(errs[key]) : 'Valor no válido.';
  });
}

export const SIGNNG_FORM = [SignngField] as const;
