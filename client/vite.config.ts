import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vitest/config";
import rootPackage from "../package.json" with { type: "json" };
import { pwaOptions } from "./pwa.config";

/**
 * 開発時に /api を転送するサーバー（npm run dev で起動する server）。
 * 本番のコンテナ（8080）とは別のポートにして、開発中の通信が本番に届かないようにする
 */
const API_SERVER = "http://127.0.0.1:8787";

export default defineConfig({
  plugins: [react(), tailwindcss(), VitePWA(pwaOptions)],
  // アプリのバージョンはルートの package.json の1か所で管理する（設定画面に表示する）
  define: { __APP_VERSION__: JSON.stringify(rootPackage.version) },
  server: {
    proxy: { "/api": API_SERVER },
  },
  // ビルドした結果を確認する `vite preview` でも /api を転送する
  preview: {
    proxy: { "/api": API_SERVER },
  },
  test: {
    environment: "node",
  },
});
