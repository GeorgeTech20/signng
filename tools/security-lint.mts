// Runnable SAST gate (security LAYER 4) — bans the Angular XSS footguns from LAYER 1.
// CI also runs CodeQL + Semgrep; this is the fast local equivalent. Run: pnpm security:lint
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOTS = [
  'projects/signng/core',
  'registry/items',
  'packages/cli/src',
  'projects/playground/src/app',
  'projects/playground/src/components',
];
const EXT = /\.(ts|mts|html)$/;

const RULES: { id: string; re: RegExp }[] = [
  { id: 'no-bypass-security-trust', re: /bypassSecurityTrust\w*/ },
  { id: 'no-inner-html', re: /\.(inner|outer)HTML\b/ },
  { id: 'no-document-write', re: /document\s*\.\s*write\b/ },
  { id: 'no-eval', re: /\beval\s*\(/ },
  { id: 'no-new-function', re: /new\s+Function\s*\(/ },
  { id: 'no-renderer-innerhtml', re: /setProperty\([^,]*,\s*['"]innerHTML['"]/ },
];

function walk(dir: string, out: string[]): void {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (EXT.test(name)) out.push(full);
  }
}

const files: string[] = [];
for (const r of ROOTS) walk(r, files);

let violations = 0;
for (const file of files) {
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    if (line.trimStart().startsWith('//') || line.trimStart().startsWith('*')) return; // skip comments
    for (const rule of RULES) {
      if (rule.re.test(line)) {
        console.log(`  ✖ ${relative('.', file)}:${i + 1}  [${rule.id}]  ${line.trim().slice(0, 80)}`);
        violations++;
      }
    }
  });
}

if (violations) {
  console.log(`\n✖ security:lint — ${violations} violation(s) in ${files.length} files`);
  process.exit(1);
}
console.log(`✔ security:lint — clean (${files.length} files, 0 forbidden sinks)`);
