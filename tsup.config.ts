import { defineConfig } from "tsup";

export default defineConfig({
  entry: { index: "src/index.ts", "lucid/index": "src/lucid/index.ts" },
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: false,
  clean: true,
  target: "es2022",
});
