import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { MAIN_EXPORTS, MINI_EXPORTS } from '../expected-exports';

// Asserts the contract of the built artifacts, which is what consumers actually get.
// The suites under src/ cannot see a broken exports map or a missing file.

const require_ = createRequire(import.meta.url);
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

type Pkg = {
  main?: string;
  module?: string;
  types?: string;
  exports: Record<string, Record<string, Record<string, string>>>;
};

const pkg: Pkg = JSON.parse(
  readFileSync(resolve(root, 'package.json'), 'utf8')
);

const declaredPaths = (node: unknown): string[] => {
  if (typeof node === 'string') {
    return [node];
  }
  if (node !== null && typeof node === 'object') {
    return Object.values(node).flatMap(declaredPaths);
  }
  return [];
};

const runtimeNames = (mod: object) =>
  Object.keys(mod)
    .filter(name => name !== 'default' && name !== '__esModule')
    .sort();

describe('published package contract', () => {
  it('every path package.json points at exists in the build', () => {
    const declared = [
      pkg.main,
      pkg.module,
      pkg.types,
      ...declaredPaths(pkg.exports)
    ].filter(
      (path): path is string =>
        typeof path === 'string' && path.startsWith('./')
    );
    expect(declared.length).toBeGreaterThan(0);
    expect(declared.filter(path => !existsSync(resolve(root, path)))).toEqual(
      []
    );
  });

  it('the built ESM entries export exactly the documented names', async () => {
    const main = await import(resolve(root, pkg.exports['.'].import.default));
    const mini = await import(
      resolve(root, pkg.exports['./mini'].import.default)
    );
    expect(runtimeNames(main)).toEqual([...MAIN_EXPORTS].sort());
    expect(runtimeNames(mini)).toEqual([...MINI_EXPORTS].sort());
  });

  it('the built CJS entries export exactly the documented names', () => {
    const main = require_(resolve(root, pkg.exports['.'].require.default));
    const mini = require_(resolve(root, pkg.exports['./mini'].require.default));
    expect(runtimeNames(main)).toEqual([...MAIN_EXPORTS].sort());
    expect(runtimeNames(mini)).toEqual([...MINI_EXPORTS].sort());
  });

  it('a decoder runs in each built artifact', async () => {
    const esm = await import(resolve(root, pkg.exports['.'].import.default));
    const cjs = require_(resolve(root, pkg.exports['.'].require.default));
    const esmMini = await import(
      resolve(root, pkg.exports['./mini'].import.default)
    );
    expect(esm.string().decode('x').isOk()).toBe(true);
    expect(cjs.string().decode('x').isOk()).toBe(true);
    expect(esmMini.decode(esmMini.string(), 'x').isOk()).toBe(true);
  });

  it('keeps the deprecation tags on the aliases removed in 5.0.0', () => {
    // Without the tag, editors show no warning before 5.0.0 removes the aliases.
    // Main entry only. Delete this test together with the aliases.
    const declarations = [
      'dist/types/src/schemas/null.d.ts',
      'dist/types/src/schemas/undefined.d.ts',
      'dist/types-cjs/src/schemas/null.d.cts',
      'dist/types-cjs/src/schemas/undefined.d.cts'
    ];
    for (const path of declarations) {
      expect(readFileSync(resolve(root, path), 'utf8')).toContain(
        '@deprecated'
      );
    }
  });
});
