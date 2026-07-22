// Minimal CycloneDX SBOM for the publishable packages (security LAYER 5 / supply-chain).
// npm's built-in `npm sbom` needs an npm lockfile; this repo uses pnpm, so we emit the
// production dependency graph of the two shipped packages directly. Run: pnpm sbom
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PKGS = [
  { file: 'projects/signng/core/package.json', fields: ['dependencies', 'peerDependencies'] },
  { file: 'packages/cli/package.json', fields: ['dependencies'] },
];

function version(name) {
  try {
    return JSON.parse(readFileSync(resolve('node_modules', name, 'package.json'), 'utf8')).version;
  } catch {
    return null;
  }
}

const seen = new Map();
for (const pkg of PKGS) {
  const json = JSON.parse(readFileSync(pkg.file, 'utf8'));
  // the package itself
  seen.set(json.name, json.version);
  for (const field of pkg.fields) {
    for (const dep of Object.keys(json[field] ?? {})) {
      if (!seen.has(dep)) seen.set(dep, version(dep) ?? json[field][dep]);
    }
  }
}

function toPurl(name, ver) {
  const encodedName = name.split('/').map(encodeURIComponent).join('/');
  return `pkg:npm/${encodedName}@${encodeURIComponent(ver ?? '')}`;
}

const components = [...seen].map(([name, ver]) => ({
  type: 'library',
  name,
  version: ver,
  purl: toPurl(name, ver),
}));

const bom = {
  bomFormat: 'CycloneDX',
  specVersion: '1.5',
  version: 1,
  metadata: { component: { type: 'library', name: 'signng', version: '0.0.1' } },
  components,
};

writeFileSync('sbom.cyclonedx.json', JSON.stringify(bom, null, 2));
console.log(`✔ SBOM (CycloneDX 1.5) -> sbom.cyclonedx.json  (${components.length} components)`);
