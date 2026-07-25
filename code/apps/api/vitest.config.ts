import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts', 'test/**/*.spec.ts'],
    // Integration tests share the local Postgres — don't run files in parallel.
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 30000,
  },
});
