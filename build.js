const esbuild = require('esbuild');

const commonConfig = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  minify: true,
  sourcemap: true,
  target: ['es2020'],
  platform: 'node',
  external: ['typescript'], // Add any external dependencies here
};

// Build ESM version
esbuild.build({
  ...commonConfig,
  outfile: 'dist/esm/index.min.js',
  format: 'esm',
}).catch(() => process.exit(1));

// Build CJS version
esbuild.build({
  ...commonConfig,
  outfile: 'dist/cjs/index.min.js',
  format: 'cjs',
}).catch(() => process.exit(1)); 