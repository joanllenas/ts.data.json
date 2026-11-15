// vite-plugin-dts copies the extensionless source specifiers into the declarations.
// Node resolution (node16, nodenext) rejects those, so this adds the extension.
// A `.d.ts` file needs `./x.js`. A `.d.cts` file needs `./x.cjs`.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

const trees = [
  { dir: 'dist/types', declaration: '.d.ts', extension: '.js' },
  { dir: 'dist/types-cjs', declaration: '.d.cts', extension: '.cjs' }
];

const walk = async (dir, suffix) => {
  const entries = await readdir(dir, { withFileTypes: true });
  const found = await Promise.all(
    entries.map(entry => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        return walk(path, suffix);
      }
      return entry.name.endsWith(suffix) ? [path] : [];
    })
  );
  return found.flat();
};

// `from './x'`, `import('./x')` and `export ... from './x'`.
const relativeSpecifier =
  /(\bfrom\s*|\bimport\s*\(\s*)(['"])(\.\.?\/[^'"]*)\2/g;

let total = 0;
const unresolved = [];

for (const { dir, declaration, extension } of trees) {
  const root = resolve(import.meta.dirname, '..', dir);
  // package.json points at both trees, so a missing tree must stop the publish.
  if (!existsSync(root)) {
    console.error(`fix-declaration-specifiers: ${dir} does not exist`);
    process.exit(1);
  }
  const files = await walk(root, declaration);

  for (const file of files) {
    const before = await readFile(file, 'utf8');
    const after = before.replace(
      relativeSpecifier,
      (match, prefix, quote, specifier) => {
        // Already carries an extension, so leave it alone.
        if (specifier.endsWith(extension) || specifier.endsWith('.json')) {
          return match;
        }
        // A directory import must name its index file explicitly.
        const target = resolve(dirname(file), specifier);
        const isDirectory = existsSync(join(target, `index${declaration}`));
        const rewritten = isDirectory
          ? `${specifier.replace(/\/$/, '')}/index${extension}`
          : `${specifier}${extension}`;
        const declarationFile = resolve(
          dirname(file),
          `${rewritten.slice(0, -extension.length)}${declaration}`
        );
        if (!existsSync(declarationFile)) {
          unresolved.push(`${relative(process.cwd(), file)}: ${specifier}`);
        }
        total += 1;
        return `${prefix}${quote}${rewritten}${quote}`;
      }
    );
    if (after !== before) {
      await writeFile(file, after);
    }
  }

  console.log(
    `fix-declaration-specifiers: ${files.length} ${declaration} files in ${relative(process.cwd(), root)}`
  );
}

console.log(`fix-declaration-specifiers: rewrote ${total} specifiers`);

// CI runs no other declaration check before `npm publish`, so this one must fail the build.
if (unresolved.length > 0) {
  console.error(
    'fix-declaration-specifiers: these specifiers have no declaration file:'
  );
  unresolved.forEach(entry => console.error(`  ${entry}`));
  process.exit(1);
}
