import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import rootPackage from "../package.json" with { type: "json" };

/** 開発時に /api を転送するサーバー（server/ を起動したときのアドレス） */
const API_SERVER = "http://127.0.0.1:8080";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // アプリのバージョンはルートの package.json の1か所で管理する（設定画面に表示する）
  define: { __APP_VERSION__: JSON.stringify(rootPackage.version) },
  server: {
    proxy: { "/api": API_SERVER },
  },
  test: {
    environment: "node",
  },
});
