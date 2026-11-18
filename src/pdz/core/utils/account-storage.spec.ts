import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { storageEntryFor } from './account-storage';

const ROOT = join(__dirname, '..', '..');

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sources(path);
    return /\.ts$/.test(name) && !/\.spec\.ts$/.test(name) ? [path] : [];
  });
}

function literalKeys(text: string): string[] {
  const found: string[] = [];
  const declared = /\w*KEY\w*\s*=\s*['"`]([^'"`$]+)['"`]/g;
  const direct = /safeStorage\.\w+(?:<[^>]*>)?\(\s*['"`]([^'"`$]+)['"`]/g;
  const templated = /storageKey:\s*`([^`$]+)\$\{/g;
  for (const pattern of [declared, direct, templated])
    for (const match of text.matchAll(pattern)) found.push(match[1]);
  return found;
}

describe('account storage registry', () => {
  const files = sources(ROOT).filter((file) =>
    readFileSync(file, 'utf8').includes('safeStorage'),
  );

  it('finds the storage users it is meant to check', () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it('declares every safeStorage key used in src/pdz', () => {
    const missing = files.flatMap((file) =>
      literalKeys(readFileSync(file, 'utf8'))
        .filter((key) => !storageEntryFor(key))
        .map((key) => `${key} (${file})`),
    );

    expect(missing).toEqual([]);
  });

  it('classifies planner keys and settings as account-related', () => {
    expect(storageEntryFor('user-settings')?.scope).toBe('account');
    expect(storageEntryFor('plannerData:l/t:sync')?.scope).toBe('planner');
  });
});
