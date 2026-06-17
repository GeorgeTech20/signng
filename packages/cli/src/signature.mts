// Registry signing (security LAYER 2a) — Ed25519 over the registry manifest.
// The CLI verifies the signature against a PINNED signer pubkey (recorded in ui.config.json),
// defeating a compromised origin/CDN that swaps the JSON *and* recomputes SRI hashes.
//
// This is the local-key analogue of Sigstore keyless signing: same property (verify-before-write
// + signer-identity pinning). Production swaps the local key for cosign/Sigstore OIDC identity.
import { generateKeyPairSync, sign as edSign, verify as edVerify } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

export interface SignedIndexItem {
  name: string;
  type: string;
  integrity: string;
}

/** Stable, order-independent message bound by the signature. */
export function canonicalMessage(items: SignedIndexItem[]): string {
  return items
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((i) => `${i.name}:${i.integrity}`)
    .join('\n');
}

export function loadOrCreateKeys(dir: string): { privatePem: string; publicPem: string } {
  const privPath = `${dir}/signing.key`;
  const pubPath = `${dir}/signing.pub`;
  if (!existsSync(privPath) || !existsSync(pubPath)) {
    mkdirSync(dir, { recursive: true });
    const { publicKey, privateKey } = generateKeyPairSync('ed25519');
    writeFileSync(privPath, privateKey.export({ type: 'pkcs8', format: 'pem' }) as string);
    writeFileSync(pubPath, publicKey.export({ type: 'spki', format: 'pem' }) as string);
  }
  return { privatePem: readFileSync(privPath, 'utf8'), publicPem: readFileSync(pubPath, 'utf8') };
}

export function signRegistry(items: SignedIndexItem[], privatePem: string): string {
  return edSign(null, Buffer.from(canonicalMessage(items), 'utf8'), privatePem).toString('base64');
}

export function verifyRegistry(
  items: SignedIndexItem[],
  signatureB64: string,
  publicPem: string,
): boolean {
  try {
    return edVerify(
      null,
      Buffer.from(canonicalMessage(items), 'utf8'),
      publicPem,
      Buffer.from(signatureB64, 'base64'),
    );
  } catch {
    return false;
  }
}

/** Normalize a PEM for equality comparison (pin check). */
export function normalizePem(pem: string): string {
  return pem.replace(/\r\n/g, '\n').trim();
}
