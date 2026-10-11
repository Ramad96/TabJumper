import { readFileSync, writeFileSync } from 'node:fs';

const manifestPath = new URL('../manifest.json', import.meta.url);
const packagePath = new URL('../package.json', import.meta.url);
const manifestText = readFileSync(manifestPath, 'utf8');
const packageText = readFileSync(packagePath, 'utf8');
const manifest = JSON.parse(manifestText);
const pkg = JSON.parse(packageText);
if (manifest.version !== pkg.version) throw new Error('Manifest and package versions must match before bumping.');
const parts = manifest.version.split('.').map(Number);
if (parts.length !== 3 || parts.some(n => !Number.isInteger(n) || n < 0 || n > 65535)) throw new Error('Expected a three-part Chrome version.');
if (parts[2] === 65535) throw new Error('Patch version limit reached; bump the minor version manually.');
parts[2]++;
const version = parts.join('.');
for (const [path, text] of [[manifestPath, manifestText], [packagePath, packageText]]) {
  writeFileSync(path, text.replace(/("version"\s*:\s*")[^"]+"/, `$1${version}"`));
}
console.log(`Tab Jumper v${version}`);
