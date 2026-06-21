import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

interface Token {
  t: string;
  c: keyof typeof THEME;
}

// Fixed dark syntax palette (VS Code-ish) — the block stays dark in BOTH light and dark mode, like shadcn.
const THEME = {
  kw: '#c586c0', // keyword
  tg: '#569cd6', // tag / type
  at: '#9cdcfe', // attribute / binding
  st: '#ce9178', // string
  cm: '#6a9955', // comment
  nu: '#b5cea8', // number
  pn: '#808080', // punctuation
  df: '#d4d4d4', // default text
} as const;

// Anchored, single-pass tokenizer (no backtracking-prone patterns; length-capped). Output is rendered as
// escaped text in <span> per token — never innerHTML — so it can't inject markup (security:lint clean).
const RULES: [RegExp, keyof typeof THEME][] = [
  [/^<!--[\s\S]*?-->/, 'cm'],
  [/^\/\/[^\n]*/, 'cm'],
  [/^\/\*[\s\S]*?\*\//, 'cm'],
  [/^"(?:[^"\\]|\\.)*"/, 'st'],
  [/^'(?:[^'\\]|\\.)*'/, 'st'],
  [/^`(?:[^`\\]|\\.)*`/, 'st'],
  [/^<\/?[\w-]+/, 'tg'],
  [/^\/?>/, 'pn'],
  [/^[\w@[\]():.*-]+(?==)/, 'at'],
  [/^\b(?:import|export|from|const|let|var|class|return|new|extends|implements|interface|type|function|async|await|if|else|for|of|in|public|private|protected|readonly|true|false|null)\b/, 'kw'],
  [/^\b\d+(?:\.\d+)?\b/, 'nu'],
];

function tokenize(code: string): Token[] {
  if (!code || code.length > 6000) return [{ t: code, c: 'df' }];
  const out: Token[] = [];
  let buf = '';
  let s = code;
  const flush = () => {
    if (buf) {
      out.push({ t: buf, c: 'df' });
      buf = '';
    }
  };
  while (s.length) {
    let hit = false;
    for (const [re, c] of RULES) {
      const m = re.exec(s);
      if (m) {
        flush();
        out.push({ t: m[0], c });
        s = s.slice(m[0].length);
        hit = true;
        break;
      }
    }
    if (!hit) {
      buf += s[0];
      s = s.slice(1);
    }
  }
  flush();
  return out;
}

/**
 * CodeBlock (helm) — a syntax-highlighted code box that stays dark in both light and dark themes (shadcn
 * style). A built-in copy button reveals on hover. Highlighting comes from a small anchored tokenizer that
 * emits escaped text spans (no innerHTML, no highlighter dep, ReDoS-safe via length cap). Signals-only, OnPush.
 */
@Component({
  selector: 'signng-code',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="group relative overflow-hidden rounded-lg border border-[#27272a] bg-[#18181b]">
      @if (copyable()) {
        <button
          type="button"
          (click)="copy()"
          aria-label="Copiar código"
          class="absolute right-2 top-2 z-10 inline-flex size-7 items-center justify-center rounded-md bg-[#27272a] text-[#a1a1aa] opacity-0 transition-opacity hover:text-white focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52525b] group-hover:opacity-100"
        >
          @if (copied()) {
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round" /></svg>
          } @else {
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
          }
        </button>
      }
      <pre class="overflow-x-auto p-4 text-[13px] leading-relaxed" style="tab-size:2"><code>@for (tk of tokens(); track $index) {<span [style.color]="THEME[tk.c]">{{ tk.t }}</span>}</code></pre>
    </div>
  `,
})
export class CodeBlock {
  readonly code = input('');
  readonly copyable = input(true);

  protected readonly THEME = THEME;
  protected readonly copied = signal(false);
  protected readonly tokens = computed(() => tokenize(this.code()));

  protected copy(): void {
    navigator.clipboard?.writeText(this.code());
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 1200);
  }
}
