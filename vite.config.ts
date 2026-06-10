import { defineConfig } from 'vitest/config';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es', 'cjs'],
      fileName: format => `index.${format === 'es' ? 'js' : 'cjs'}`
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
      outDirs: 'dist/types'
    })
  ],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.d.ts',
        '**/*.spec.ts',
        'vite.config.ts',
        'src/index.ts'
      ]
    }
  }
});
