// Installs the packed tarball into temporary ESM and CJS projects and type-checks them
// under `nodenext`. The repo uses `moduleResolution: bundler`, so it cannot detect
// declarations that fail under Node resolution.
// CHECK_CONSUMER_TS sets the TypeScript version. The default is the supported minimum.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const tsVersion = process.env.CHECK_CONSUMER_TS ?? '5.7';

const run = (cmd, args, cwd) =>
  execFileSync(cmd, args, { cwd, stdio: 'pipe', encoding: 'utf8' });

const work = mkdtempSync(join(tmpdir(), 'tsdatajson-consumer-'));
let failed = false;

try {
  run('npm', ['pack', '--pack-destination', work], root);
  const tarball = readdirSync(work).find(name => name.endsWith('.tgz'));
  if (!tarball) {
    throw new Error('npm pack produced no tarball');
  }

  const tsconfig = {
    compilerOptions: {
      strict: true,
      module: 'nodenext',
      moduleResolution: 'nodenext',
      target: 'ES2022',
      noEmit: true,
      // The point of the check: read the shipped declarations rather than skip them.
      skipLibCheck: false,
      esModuleInterop: true
    }
  };

  const body = `
import * as JsonDecoder from 'ts.data.json';
import * as Mini from 'ts.data.json/mini';

const userDecoder = JsonDecoder.object({
  id: JsonDecoder.number(),
  name: JsonDecoder.string()
});
type User = JsonDecoder.FromDecoder<typeof userDecoder>;
const user: User = userDecoder.parse({ id: 1, name: 'a' });
const mini = Mini.decode(Mini.object({ id: Mini.number() }), { id: 2 });
console.log(user, mini.isOk());
`;

  for (const { label, type, entry } of [
    { label: 'ESM', type: 'module', entry: 'use.ts' },
    { label: 'CJS', type: 'commonjs', entry: 'use.cts' }
  ]) {
    const dir = mkdtempSync(join(work, `${label}-`));
    writeFileSync(
      join(dir, 'package.json'),
      JSON.stringify({
        name: `consumer-${label}`,
        private: true,
        version: '1.0.0',
        type
      })
    );
    writeFileSync(
      join(dir, 'tsconfig.json'),
      JSON.stringify({ ...tsconfig, include: [entry] })
    );
    writeFileSync(join(dir, entry), body);
    run(
      'npm',
      ['i', '--silent', join(work, tarball), `typescript@${tsVersion}`],
      dir
    );
    try {
      run('npx', ['tsc', '-p', 'tsconfig.json'], dir);
      console.log(
        `check-consumer: ${label} OK (TypeScript ${tsVersion}, nodenext)`
      );
    } catch (error) {
      failed = true;
      console.error(
        `check-consumer: ${label} FAILED (TypeScript ${tsVersion}, nodenext)`
      );
      console.error(error.stdout || error.message);
    }
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}

process.exit(failed ? 1 : 0);
