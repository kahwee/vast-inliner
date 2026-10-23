import { defineConfig } from "tsdown";

export default defineConfig({
  clean: true,
  dts: { generator: "oxc" },
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  outputOptions: { exports: "named" },
  sourcemap: true,
  target: "node22",
});
