import { defineConfig } from 'vitest/config';

// Separate from `npm test`, because these tests need a fresh `npm run build`.
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/package/**/*.spec.ts']
  }
});
