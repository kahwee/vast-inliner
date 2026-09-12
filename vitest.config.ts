import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      thresholds: {
        branches: 70,
        functions: 85,
        lines: 85,
        statements: 80,
      },
    },
  },
});
