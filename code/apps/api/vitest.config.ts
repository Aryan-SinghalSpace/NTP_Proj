import { defineConfig, configDefaults } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts', 'test/**/*.spec.ts'],
    // e2e specs bootstrap the whole Nest app and need the SWC transform
    // (decorator metadata) — they run under vitest.config.e2e.ts instead.
    exclude: [...configDefaults.exclude, '**/*.e2e.spec.ts'],
    fileParallelism: false, // integration tests share the local Postgres
    testTimeout: 20000,
    hookTimeout: 30000,
  },
});
