import { defineConfig } from 'vitest/config';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: 'src/index.ts',
        mini: 'src/mini.ts'
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) =>
        `${entryName}.${format === 'es' ? 'js' : 'cjs'}`
    },
    rollupOptions: {
      external: ['typescript']
    },
    minify: true,
    sourcemap: true,
    target: 'es2022',
    outDir: 'dist',
    emptyOutDir: true
  },
  plugins: [
    dts({
      // A `.d.ts` in a `"type": "module"` package is read as ESM, so `require` needs `.d.cts`.
      // vite-plugin-dts 5.0.2 ignores `entryRoot`, so the `src/` path segment stays for now.
      outDirs: [
        'dist/types',
        { dir: 'dist/types-cjs', moduleFormat: 'cjs' }
      ],
      exclude: ['**/*.spec.ts', '**/*.type-test.ts']
    })
  ],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      // Without `include`, a file that no test imports is absent from the report.
      include: ['src/**/*.ts'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.d.ts',
        '**/*.spec.ts',
        '**/*.type-test.ts',
        'vite.config.ts'
      ]
    }
  }
});
