import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['packages/**/*.test.ts', 'packages/**/*.spec.ts'],
        exclude: ['node_modules', 'dist'],
        testTimeout: 30000, // Property-based tests may need more time
    },
});
