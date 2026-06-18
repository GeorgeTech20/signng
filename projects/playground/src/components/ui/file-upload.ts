import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { Icon } from '@/components/ui/icon';

function fmtSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

/**
 * FileUpload (helm) — accessible drag-and-drop dropzone over a hidden native file input. Validates type
 * (`accept`) and size (`maxSize`), lists picked files with size + remove, and emits `filesChange`. The
 * dropzone is keyboard-operable (Enter/Space). Signals-only, OnPush, SSR-safe. No innerHTML/bypass.
 */
@Component({
  selector: 'signng-file-upload',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div
      role="button"
      tabindex="0"
      [attr.aria-label]="label() || 'Subir archivos'"
      (click)="picker.click()"
      (keydown.enter)="picker.click()"
      (keydown.space)="$event.preventDefault(); picker.click()"
      (dragover)="$event.preventDefault(); dragging.set(true)"
      (dragleave)="dragging.set(false)"
      (drop)="onDrop($event)"
      [class]="
        'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ' +
        (dragging() ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent/50')
      "
    >
      <span class="text-muted-foreground"><signng-icon name="upload" [size]="26" /></span>
      <div class="text-sm">
        <span class="font-medium text-foreground">Click para subir</span>
        <span class="text-muted-foreground"> o arrastra aquí</span>
      </div>
      <div class="text-xs text-muted-foreground">
        {{ accept() || 'Cualquier archivo' }}{{ maxSize() ? ' · máx ' + fmtSize(maxSize()) : '' }}
      </div>
      <input
        #picker
        type="file"
        hidden
        [accept]="accept()"
        [multiple]="multiple()"
        (change)="onSelect($event)"
      />
    </div>

    @if (error()) {
      <p class="mt-2 text-sm text-destructive" role="alert">{{ error() }}</p>
    }

    @if (files().length) {
      <ul class="mt-3 space-y-2">
        @for (f of files(); track f.name + f.size) {
          <li class="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2 text-sm">
            <span class="text-muted-foreground"><signng-icon name="check-circle" [size]="16" /></span>
            <span class="min-w-0 flex-1 truncate">{{ f.name }}</span>
            <span class="shrink-0 text-xs text-muted-foreground">{{ fmtSize(f.size) }}</span>
            <button type="button" (click)="remove(f)" aria-label="Quitar archivo" class="shrink-0 text-muted-foreground hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
              <signng-icon name="x" [size]="16" />
            </button>
          </li>
        }
      </ul>
    }
  `,
})
export class FileUpload {
  readonly accept = input('');
  readonly multiple = input(false);
  /** Max size per file in bytes (0 = unlimited). */
  readonly maxSize = input(0);
  readonly label = input('');
  readonly filesChange = output<File[]>();

  protected readonly fmtSize = fmtSize;
  protected readonly files = signal<File[]>([]);
  protected readonly dragging = signal(false);
  protected readonly error = signal('');

  protected onDrop(e: DragEvent): void {
    e.preventDefault();
    this.dragging.set(false);
    if (e.dataTransfer?.files) this.add(e.dataTransfer.files);
  }
  protected onSelect(e: Event): void {
    const input = e.target as HTMLInputElement;
    if (input.files) this.add(input.files);
    input.value = '';
  }

  private add(list: FileList): void {
    this.error.set('');
    const accepted: File[] = [];
    const max = this.maxSize();
    for (const f of Array.from(list)) {
      if (max && f.size > max) {
        this.error.set(`"${f.name}" supera el máximo (${fmtSize(max)}).`);
        continue;
      }
      if (!this.matchesAccept(f)) {
        this.error.set(`"${f.name}" no es un tipo permitido.`);
        continue;
      }
      accepted.push(f);
    }
    const next = this.multiple() ? [...this.files(), ...accepted] : accepted.slice(0, 1);
    this.files.set(next);
    this.filesChange.emit(next);
  }

  private matchesAccept(f: File): boolean {
    const accept = this.accept().trim();
    if (!accept) return true;
    return accept.split(',').map((s) => s.trim()).some((pat) => {
      if (pat.endsWith('/*')) return f.type.startsWith(pat.slice(0, -1));
      if (pat.startsWith('.')) return f.name.toLowerCase().endsWith(pat.toLowerCase());
      return f.type === pat;
    });
  }

  protected remove(f: File): void {
    const next = this.files().filter((x) => x !== f);
    this.files.set(next);
    this.filesChange.emit(next);
  }
}

/**
 * ImageUpload (helm) — FileUpload specialised for images with a thumbnail grid preview. Previews use
 * object URLs (blob:) bound through Angular's URL sanitizer and are revoked on remove/destroy (no leak).
 */
@Component({
  selector: 'signng-image-upload',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div
      role="button"
      tabindex="0"
      [attr.aria-label]="label() || 'Subir imágenes'"
      (click)="picker.click()"
      (keydown.enter)="picker.click()"
      (keydown.space)="$event.preventDefault(); picker.click()"
      (dragover)="$event.preventDefault(); dragging.set(true)"
      (dragleave)="dragging.set(false)"
      (drop)="onDrop($event)"
      [class]="
        'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-6 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ' +
        (dragging() ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent/50')
      "
    >
      <span class="text-muted-foreground"><signng-icon name="upload" [size]="24" /></span>
      <div class="text-sm"><span class="font-medium text-foreground">Subir imágenes</span><span class="text-muted-foreground"> o arrastra</span></div>
      <input #picker type="file" hidden accept="image/*" [multiple]="multiple()" (change)="onSelect($event)" />
    </div>

    @if (error()) { <p class="mt-2 text-sm text-destructive" role="alert">{{ error() }}</p> }

    @if (items().length) {
      <div class="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
        @for (it of items(); track it.url) {
          <div class="group relative aspect-square overflow-hidden rounded-md border border-border">
            <img [src]="it.url" [alt]="it.file.name" class="size-full object-cover" />
            <button type="button" (click)="remove(it)" aria-label="Quitar imagen"
              class="absolute right-1 top-1 inline-flex size-6 items-center justify-center rounded-full bg-background/90 text-foreground opacity-0 shadow transition-opacity group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <signng-icon name="x" [size]="14" />
            </button>
          </div>
        }
      </div>
    }
  `,
})
export class ImageUpload {
  readonly multiple = input(true);
  readonly maxSize = input(0);
  readonly label = input('');
  readonly filesChange = output<File[]>();

  protected readonly items = signal<{ file: File; url: string }[]>([]);
  protected readonly dragging = signal(false);
  protected readonly error = signal('');

  constructor() {
    inject(DestroyRef).onDestroy(() => this.items().forEach((i) => URL.revokeObjectURL(i.url)));
  }

  protected onDrop(e: DragEvent): void {
    e.preventDefault();
    this.dragging.set(false);
    if (e.dataTransfer?.files) this.add(e.dataTransfer.files);
  }
  protected onSelect(e: Event): void {
    const input = e.target as HTMLInputElement;
    if (input.files) this.add(input.files);
    input.value = '';
  }

  private add(list: FileList): void {
    this.error.set('');
    const max = this.maxSize();
    const fresh = Array.from(list)
      .filter((f) => f.type.startsWith('image/'))
      .filter((f) => {
        if (max && f.size > max) {
          this.error.set(`"${f.name}" supera el máximo (${fmtSize(max)}).`);
          return false;
        }
        return true;
      })
      .map((file) => ({ file, url: URL.createObjectURL(file) }));
    const next = this.multiple() ? [...this.items(), ...fresh] : fresh.slice(0, 1);
    if (!this.multiple()) this.items().forEach((i) => URL.revokeObjectURL(i.url));
    this.items.set(next);
    this.filesChange.emit(next.map((i) => i.file));
  }

  protected remove(it: { file: File; url: string }): void {
    URL.revokeObjectURL(it.url);
    const next = this.items().filter((x) => x !== it);
    this.items.set(next);
    this.filesChange.emit(next.map((i) => i.file));
  }
}

export const SIGNNG_FILE_UPLOAD = [FileUpload, ImageUpload] as const;
