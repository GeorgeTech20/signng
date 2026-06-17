import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  input,
  model,
  viewChildren,
} from '@angular/core';
import { cn } from '@/lib/utils';

/**
 * Styled InputOTP (helm) — segmented one-time-code input. A role=group of single-char boxes with
 * per-box aria-labels; sequential entry auto-advances, Backspace retreats, Arrows move, paste fills.
 * `inputmode=numeric` + `autocomplete=one-time-code` enable SMS autofill. Value is the typed string.
 */
@Component({
  selector: 'signng-input-otp',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div role="group" [attr.aria-label]="label() || 'Código de verificación'" class="flex items-center gap-2">
      @for (i of slots(); track i) {
        <input
          #box
          type="text"
          inputmode="numeric"
          autocomplete="one-time-code"
          maxlength="1"
          [attr.aria-label]="'Dígito ' + (i + 1) + ' de ' + length()"
          [value]="charAt(i)"
          (input)="onInput($event, i)"
          (keydown)="onKeydown($event, i)"
          (paste)="onPaste($event)"
          (focus)="onFocus($event)"
          [class]="
            cn(
              'size-10 rounded-md border border-input bg-background text-center text-lg ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              boxClass()
            )
          "
        />
      }
    </div>
  `,
})
export class InputOtp {
  readonly length = input(6);
  readonly value = model('');
  readonly label = input('');
  readonly boxClass = input('');

  protected readonly cn = cn;
  private readonly boxes = viewChildren<ElementRef<HTMLInputElement>>('box');
  protected readonly slots = computed(() => Array.from({ length: this.length() }, (_, i) => i));

  protected charAt(i: number): string {
    return this.value()[i] ?? '';
  }

  protected onInput(event: Event, i: number): void {
    const el = event.target as HTMLInputElement;
    const ch = (el.value.match(/\d/g) ?? []).pop() ?? '';
    // sequential: typing at box i sets the prefix up to i + this char (truncating the rest).
    this.value.set((this.value().slice(0, i) + ch).slice(0, this.length()));
    el.value = ch;
    if (ch && i < this.length() - 1) this.focusBox(i + 1);
  }

  protected onKeydown(event: KeyboardEvent, i: number): void {
    switch (event.key) {
      case 'Backspace':
        if (!this.charAt(i) && i > 0) {
          event.preventDefault();
          this.value.set(this.value().slice(0, i - 1));
          this.focusBox(i - 1);
        } else if (this.charAt(i)) {
          this.value.set(this.value().slice(0, i));
        }
        break;
      case 'ArrowLeft':
        if (i > 0) {
          event.preventDefault();
          this.focusBox(i - 1);
        }
        break;
      case 'ArrowRight':
        if (i < this.length() - 1) {
          event.preventDefault();
          this.focusBox(i + 1);
        }
        break;
    }
  }

  protected onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const digits = (event.clipboardData?.getData('text').match(/\d/g) ?? []).join('').slice(0, this.length());
    this.value.set(digits);
    this.focusBox(Math.min(digits.length, this.length() - 1));
  }

  protected onFocus(event: FocusEvent): void {
    (event.target as HTMLInputElement).select();
  }

  private focusBox(i: number): void {
    this.boxes()[i]?.nativeElement.focus();
  }
}
