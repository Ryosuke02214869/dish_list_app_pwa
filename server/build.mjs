// 本番用に server を1つのファイルにまとめる（shared の TypeScript も一緒に取り込む）。
// better-sqlite3 はネイティブモジュールなので、まとめずに node_modules から読み込む。
import { build } from "esbuild";

await build({
  entryPoints: ["src/index.ts"],
  outfile: "dist/index.js",
  bundle: true,
  platform: "node",
  target: "node22",
  format: "esm",
  external: ["better-sqlite3"],
  sourcemap: true,
  logLevel: "info",
});
