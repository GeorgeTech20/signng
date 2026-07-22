# Security Policy

## Scope

This policy covers the `@signng/core` package, the `@signng/cli` installer, the signed
component registry, and the documentation app. It does **not** cover applications built *with*
SignNG — securing the host app (CSP/Trusted Types delivery, anti-framing headers, HSTS, authn/z)
is the consumer's responsibility (see the threat-model doc).

## Supported versions

| Version | Supported |
|---------|-----------|
| latest (main) | ✅ |
| < latest | security fixes backported one minor |

## Reporting a vulnerability

Report privately via **GitHub Private Vulnerability Reporting** (Security → Report a vulnerability)
or email `security@signng.dev` (PGP key in `/.well-known/security.txt`).

- Target acknowledgement: **48 hours**.
- Target triage + fix plan: **7 days**.
- Coordinated disclosure via GitHub Security Advisory + CVE (GitHub is a CNA); fix propagates to
  OSV and `npm audit`.

## Safe harbor

Good-faith research within this scope will not lead to legal action. Do **not** test against
third-party apps that merely use SignNG, exfiltrate data, or run denial-of-service.

## What we guarantee

- Components are **correct and safe by default** (no `bypassSecurityTrust*`, no raw DOM writes,
  Trusted-Types clean) and never weaken the host app's protections.
- The registry is **Ed25519-signed**; the CLI verifies the signature against a pinned signer and
  the per-item SRI before writing — and sandboxes every write (no traversal/sensitive targets).
- Releases are published via **OIDC Trusted Publishing** with **Sigstore provenance**.

## Verifying a release

```bash
npm audit signatures            # provenance + registry signature
pnpm security:test              # CLI fail-closed checks
pnpm security:lint              # forbidden-sink SAST gate
```
