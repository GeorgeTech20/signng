// Adversarial proof that the CLI fails CLOSED (security LAYER 2). Run: tsx e2e/security-negative.mts
import { generateKeyPairSync } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { assertSafeTarget, verifyFileIntegrity } from '../packages/cli/src/security.mts';
import { assertSafeRegistry } from '../packages/cli/src/registry.mts';
import { verifyRegistry } from '../packages/cli/src/signature.mts';

let pass = 0;
let fail = 0;
function expectThrow(label: string, fn: () => unknown) {
  try {
    fn();
    console.log(`  ✖ FAIL (no throw): ${label}`);
    fail++;
  } catch (e) {
    console.log(`  ✔ blocked: ${label}  ->  ${(e as Error).message.split('\n')[0]}`);
    pass++;
  }
}
function expectFalse(label: string, value: boolean) {
  if (value === false) {
    console.log(`  ✔ rejected: ${label}`);
    pass++;
  } else {
    console.log(`  ✖ FAIL (accepted): ${label}`);
    fail++;
  }
}

const ROOT = resolve(process.cwd(), 'projects/playground');

// 1) SRI tamper: a registry file whose content was swapped must be rejected.
const button = JSON.parse(readFileSync('registry/public/r/button.json', 'utf8'));
const tampered = { ...button.files[0], content: button.files[0].content + '\n/* injected */' };
expectThrow('SRI mismatch (tampered registry content)', () => verifyFileIntegrity(tampered));

// 2) Path traversal into a git hook (auto-exec vector T1).
expectThrow('path traversal target ../../.husky/pre-commit', () =>
  assertSafeTarget('../../.husky/pre-commit', ROOT),
);

// 3) Absolute path target.
expectThrow('absolute target /etc/passwd', () => assertSafeTarget('/etc/passwd', ROOT));

// 4) Overwrite a sensitive config file.
expectThrow('sensitive target package.json', () => assertSafeTarget('package.json', ROOT));

// 5) Insecure transport.
expectThrow('insecure http:// registry', () => assertSafeRegistry('http://evil.example/r'));

// 6) Signature: tampered manifest must fail verification against the real pubkey.
const registry = JSON.parse(readFileSync('registry/public/r/registry.json', 'utf8'));
const tamperedItems = registry.items.map((i: { name: string; integrity: string }, idx: number) =>
  idx === 0 ? { ...i, integrity: 'sha256-attackerswapped' } : i,
);
expectFalse(
  'tampered registry manifest (valid signer)',
  verifyRegistry(tamperedItems, registry.signature, registry.publicKey),
);

// 7) Signature: a different (attacker) signer key must fail even on the genuine manifest.
const attacker = generateKeyPairSync('ed25519').publicKey.export({ type: 'spki', format: 'pem' }) as string;
expectFalse(
  'genuine manifest signed by attacker key (pin mismatch)',
  verifyRegistry(registry.items, registry.signature, attacker),
);

// Control: genuine manifest + genuine signer verifies true.
if (verifyRegistry(registry.items, registry.signature, registry.publicKey)) {
  console.log('  ✔ allowed: genuine manifest + genuine signer verifies');
  pass++;
} else {
  console.log('  ✖ FAIL (genuine rejected)');
  fail++;
}

// Control: a legit file + target must NOT throw.
try {
  verifyFileIntegrity(button.files[0]);
  assertSafeTarget('src/components/ui/button.ts', ROOT);
  console.log('  ✔ allowed: untampered button + safe target');
  pass++;
} catch (e) {
  console.log(`  ✖ FAIL (legit blocked): ${(e as Error).message}`);
  fail++;
}

console.log(`\n${fail === 0 ? '✔' : '✖'} security fail-closed: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
