import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';

/**
 * E2E config: boots the full Nest app, so it needs SWC to emit the decorator
 * metadata that NestJS DI relies on (esbuild — the default vitest transform —
 * does not). Kept separate from the unit/integration config.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.e2e.spec.ts'],
    globals: true,
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 40000,
  },
  plugins: [
    swc.vite({
      jsc: {
        parser: { syntax: 'typescript', decorators: true },
        transform: { legacyDecorator: true, decoratorMetadata: true },
      },
    }),
  ],
});
